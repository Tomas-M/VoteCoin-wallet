/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/

const pick = (O, ...K) => K.reduce((o, k) => (o[k]=O[k], o), {});

var rateVOTBTC=0;
var rateBTCUSD=0;
var totalPrivate=0;
var totalTransparent=0;
var connections=0;
var blocks=0;
var totalblocks=0;

var transparent_addresses=storage_load('taddresses',{});
var shielded_addresses=storage_load('zaddresses',{});
var labels=storage_load('labels',{});
var votes={}; // pending votes, until they are confirmed

// This is how to generate these:
// main.rpc('z_getnewaddress',["sprout"],function(addr){ console.log(addr); main.rpc('z_exportviewingkey',[addr],function(key){ console.log(key); },function(err){ console.log(err);}) })
var poll_address="zcNtGdENMcuKpwwgQif7BwRZLh6dmmy2d3AC8ssWxWZQUU6bVFfj9ipHyFvZgy2xRCD1jubDrXEhBuzhi8cf1Xy1NxBH71U";
var poll_viewkey="ZiVKcy3zHHwVvr5DPMMdSWY581QZgZmtBYJYrk6UiupH8pmvMp4N3Veqy7mSLYPmQz2aNGUpVm4Njw9Qs4rVkFrz2SR7iBY3c";

var poll_fee=1;
var polls=storage_load('polls',{});

if ($.isEmptyObject(polls))
{
   var examples = require('./poll_examples.js');
   var polls = examples.poll_examples;
}

var wallet_seq="130";
var myPie;

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


// init crypto keys
var cryptokeys=false;
async function init_crypto()
{
   cryptokeys=storage_load('cryptokeys',{});
   if (cryptokeys.sign)
   {
      cryptokeys=new CryptoGraphy(cryptokeys);
      await cryptokeys.ready;
   }
   else
   {
      cryptokeys=new CryptoGraphy();
      await cryptokeys.ready;
      var exp=await cryptokeys.exportKeys();
      storage_save('cryptokeys',exp);
   }
}
init_crypto();


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
      if (blocks>totalblocks) totalblocks=blocks;
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
                  if (operations[opid].create_poll_tx)
                  {
                     delete operations[opid].create_poll_tx;
                     poll_progress_hide();
                     poll_success(ret.result.txid);
                  }

                  var result_poll_tx=operations[opid].result_poll_tx;
                  if (result_poll_tx)
                  {
                     delete operations[opid].result_poll_tx;
                     votes[opid].txid=ret.result.txid;
                     poll_results(result_poll_tx);
                  }

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
      main.rpc("gettransaction",[tr.txid,false],(res)=>
      {
         tr.blocktime=res.blocktime;
         update_voteheight(res.txid,res.blockhash);
         sort_transactions();
      });
   })(transactions[i]);
}


function update_voteheight(txid,blockhash)
{
   if (blockhash)
   main.rpc("getblock",[blockhash],function(res)
   {
      for (var i in votes)
         if (votes[i].txid==txid)
            votes[i].height=res.height;
   })
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
         if (res[i]!=poll_viewkey)
         {
            update_shielded_addr(res[i]);
            add_shielded_transactions_received(res[i]);
         }
      });

      update_gui();
   });
}


function checkNewVersion()
{
   $.get("https://votecoin.site/version.php",{},function(ret){
      ret=JSON_fromString(ret);
      if (ret.seq>wallet_seq)
      {
         if (confirm(ret.message)) openURL(ret.download);
      }
   })
}


function setUpdater(func,time)
{
   setInterval(func,time);
   setTimeout(func,0); // run right away
}


function init()
{
   settext('versioninfo',"build "+wallet_seq);
   setUpdater(update_logerr,1000); // once every second

   $('#progress').show();
   $('#progressmessage').html("<div style='margin-bottom: 40px; margin-top: 40px'>"
                                 +"<span class='fa fa-cloud-download-alt' style='color: #ddd; font-size: 150px;'></span>"
                              +"</div>"
                              +"Downloading VoteCoin proving keys.<br>This is needed only once, please wait...");

   // check && download sprout proving file
   main.download_all_files(download_progress,function()
   {
      show_progress(100);
      setUpdater(update_debug,1000);  // every 1 second
      $('#progressmessage').html("<div style='margin-bottom: 40px; margin-top: 40px'>"
                                     +"<span class='fa fa-cog' style='color: #ddd; animation:spin 5s linear infinite; font-size: 150px;'></span>"
                                 +"</div>"
                                 +"VoteCoin wallet is starting, please wait...<div class=debuglogindex><div class=debuglog></div><div class=debuglogafter></div></div>");
      // start wallet
      main.walletStart();

      // wait for wallet to be ready
      wait_for_wallet().then(()=>
      {
          isInitialized=true;
          import_viewing_keys();
          update_addresses();
          poll_dashboard(true);

          // init periodic stats updaters
          setUpdater(update_rates,600000); // once per 10 minutes
          setUpdater(update_totals,10000); // every 10 seconds
          setUpdater(update_stats,5000);  // every 5 seconds
          setUpdater(update_operation_status,5000);  // every 5 seconds
          setUpdater(update_totalblocks,60000);   // every 1 minute
          setUpdater(update_transactions,5000);   // every 5 seconds
          setUpdater(update_gui,1000);   // every 1 second

          gui_show('dashboard');

          setTimeout(function(){setUpdater(checkNewVersion,600000); },2000);// once per hour
      })
   });
}

init();
