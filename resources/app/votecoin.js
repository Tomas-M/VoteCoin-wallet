/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/


var {ipcRenderer, remote} = require('electron');
const main = remote.require("./main.js");

const pick = (O, ...K) => K.reduce((o, k) => (o[k]=O[k], o), {});

var rateVOTBTC=0;
var rateBTCUSD=0;
var totalPrivate=0;
var totalTransparent=0;
var connections=0;
var blocks=0;
var totalblocks=0;

var transparent_addresses=storage_load('taddresses',{});;
var shielded_addresses=storage_load('zaddresses',{});;

// Get all operations, mark leftover ones from previous run as canceled
var operations=storage_load('operations',{});
for(i in operations)
{
   if (operations[i].status.match(/executing|queued/))
   {
      operations[i].status='canceled by wallet close';
      operations[i].finished=true;
   }
}

// get all transactions
var transactions=storage_load('transactions',[]);


function wait_for_wallet()
{
   return new Promise((resolve,reject)=>
   {
      update_totals(true,resolve);
   });
}


function update_totals(repeat,doneFunc)
{
   main.rpc("z_gettotalbalance", [0], (res)=>
   {
      totalTransparent=parseFloat(res.transparent);
      totalPrivate=parseFloat(res.private);
      if (doneFunc) doneFunc();
   },repeat);
}


function update_rates()
{
     $.get("http://votecoin.site/bestrate.php",function(rates)
     {
        rates=JSON_fromString(rates);
        if (!rates) return;
        rateBTCUSD=parseFloat(rates.BTCUSD);
        rateVOTBTC=parseFloat(rates.VOTBTC);
     });
}


function update_stats()
{
   main.rpc("getinfo", "", (res)=>
   {
      connections=parseFloat(res.connections);
      blocks=parseFloat(res.blocks);
    });
}


function update_operation_status()
{
   main.rpc("z_getoperationstatus", [], (res)=>
   {
      for(var i=0; i<res.length; i++)
      {
         var id=res[i].id;
         operations[id]=operations[id]||{};
         for (k in pick(res[i], "creation_time", "id", "method", "status", "error")) operations[id][k]=res[i][k];

         if (!operations[id].finished && !operations[id].status.match(/executing|queued/)) (function(opid)
         {
            main.rpc("z_getoperationresult", [[opid]], (ret)=>
            {
               var ret=ret.pop();
               operations[opid].finished=true;

               if (!ret.error)
               {
                  operations[opid].txid=ret.result.txid;

                  if (isShielded(ret.params.amounts[0].address)) // we're sending to Z address, tx may not be in list, memo definitely is not
                  if (z_track)
                  {
                     // track the change as well
                     var change=ret.params.amounts[0].amount+ret.params.fee-operations[opid].zbalance;
                     if (isShielded(ret.params.fromaddress) && change!=0) add_transaction({"time":now(), "fee":ret.params.fee, "category":"send", "txid": ret.result.txid, "amount": change});
                     add_transaction({"time":now(), "fee":ret.params.fee, "category":"send", "txid": ret.result.txid, "amount": -1*ret.params.amounts[0].amount, "memo": ret.params.amounts[0].memo});
                  }

                  update_transactions();
                  update_addresses();
               }

               storage_save('operations',operations);

            },function(e){console.log(e);});
         })(id);
      }
      storage_save('operations',operations);

      var preventExit=false;
      for(i in operations) if (operations[i].status.match(/executing|queued/)) preventExit=true;
      main.setTransactionInProgress(preventExit);
   });
}


function update_totalblocks()
{
     $.get("http://explorer.votecoin.site/insight-api-zcash/status?q=getInfo",function(res)
     {
        totalblocks=parseFloat(res.info.blocks);
     });
}

function propertiesMatch(a,b,p)
{
   for (var i=0; i<p.length; i++) if (a[p[i]]!=b[p[i]]) return false;
   return true;
}

function add_transaction(entry)
{
   var ex=-1;
   if (entry.memo) entry.memo=$.trim(hexDecode(entry.memo)); // decode memo if present and store it natively

   for (var i=0; i<transactions.length; i++)
      if (propertiesMatch(transactions[i], entry, ["fee", "category", "txid", "amount"]))
         { ex=i; break; }

   if (ex==-1)
   {
      transactions.push(entry);
      audio_notify();
      sort_transactions();
      return true;
   }
   else
   {
      if (entry.memo) transactions[ex].memo=entry.memo;
      return false; // already seen
   }
}


function sort_transactions()
{
   sortByKeys(transactions,["blocktime","time","amount"],true);
   storage_save("transactions",transactions);
}

function update_unconfirmed_transactions()
{
   for (var i=0; i<transactions.length; i++)
   if (!transactions[i].blocktime)
   (function(tr)
   {
      main.rpc("gettransaction",[tr.txid,true],(res)=>
      {
         tr.blocktime=res.blocktime;
         sort_transactions();
      });
   })(transactions[i]);
}

function update_transactions(start) // load all T transactions into array
{
   if (!start) start=0;

   if (reset_transactions_list)
   {
      transactions=[];
      reset_transactions_list=false;
      return update_transactions();
   }

   var max=10;
   var added, canstop=false;
   main.rpc("listtransactions",["",max,start],(res)=>
   {
      for (var i=0; i<res.length; i++)
      {
         added=add_transaction(pick(res[i], "address", "blocktime", "time", "fee", "category", "txid", "amount"));
         // as soon as we reach a known transaction, we can stop querying for next transactions
         if (!added) canstop=true;
      }

      if (res.length>=max && !canstop) update_transactions(start+max);
      else
      {
         // all yet-unknown transactions were loaded, we can finish
         update_unconfirmed_transactions();
         update_addresses(); // this also updates shielded received transactions
         update_gui();
      }
   });
}


function add_shielded_transactions_received(zaddr)
{
   if (!z_track) return;
   main.rpc("z_listreceivedbyaddress",[zaddr,0],(res)=>
   {
      for (var i=0; i<res.length; i++) (function(rec)
      {
         main.rpc("gettransaction",[rec.txid],(ret)=>
         {
            add_transaction({"blocktime":ret.blocktime, "time":ret.time, "fee":ret.fee, "category":"receive", "txid": ret.txid, "amount": rec.amount, "memo": rec.memo});
         });
      })(res[i]);
   });
}


function balance_update(tgt,src,reset)
{
   var i;
   if (reset) for (i in tgt) tgt[i]=0;
   for (i in src) tgt[src[i].address]=0;
   for (i in src) tgt[src[i].address]=(tgt[src[i].address]?tgt[src[i].address]:0)+src[i].amount;
}


function update_shielded_addr(zaddr)
{
   main.rpc("z_getbalance",[zaddr,0],(res)=>
   {
      balance_update(shielded_addresses,[{'address':zaddr,'amount':res}]);
      storage_save("zaddresses",shielded_addresses);
   });
}


function update_addresses()
{
   main.rpc("listunspent",[0],(res)=>
   {
      balance_update(transparent_addresses,res,true);
      storage_save("taddresses",transparent_addresses);

      main.rpc("z_listaddresses",[],(res)=>
      {
          for (var i=0; i<res.length; i++)
          {
             update_shielded_addr(res[i]);
             add_shielded_transactions_received(res[i]);
          }
      });

      update_gui();
   });
}



function setUpdater(func,time)
{
   setInterval(func,time);
   setTimeout(func,0); // run right away
}


function init()
{
   setUpdater(update_logerr,1000); // once every second

   $('#progress').show();
   $('#progressmessage').html("<div style='margin-bottom: 40px; margin-top: 40px'>"
                                 +"<span class='fa fa-cloud-download' style='color: #ddd; font-size: 150px;'></span>"
                              +"</div>"
                              +"Downloading VoteCoin proving keys (900MB).<br>This is needed only once, please wait...");

   // check && download sprout proving file
   main.download_all_files(download_progress,function()
   {
      show_progress(100);
      $('#progressmessage').html("<div style='margin-bottom: 40px; margin-top: 40px'>"
                                     +"<span class='fa fa-cog' style='color: #ddd; animation:spin 5s linear infinite; font-size: 150px;'></span>"
                                 +"</div>"
                                 +"VoteCoin wallet is starting, please wait...");
      // start wallet
      main.walletStart();

      // wait for wallet to be ready
      wait_for_wallet().then(()=>
      {
          isInitialized=true;
          update_addresses();

          // init periodic stats updaters
          setUpdater(update_rates,600000); // once per 10 minutes
          setUpdater(update_totals,10000); // every 10 seconds
          setUpdater(update_stats,2000);  // every 2 seconds
          setUpdater(update_operation_status,2000);  // every 2 seconds
          setUpdater(update_totalblocks,60000);   // every 1 minute
          setUpdater(update_transactions,5000);   // every 5 seconds
          setUpdater(update_gui,1000);   // every 1 second

          gui_show('dashboard');
      })
   });
}

init();
