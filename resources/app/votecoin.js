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

var transparent_transactions=[];
var shielded_transactions=[];

var transparent_addresses={};
var shielded_addresses={};

var operations=storage_load('operations',{});


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
         for (k in pick(res[i], "creation_time", "id", "method", "status", "error")) operations[id][k]=(res[i][k]);

         if (!operations[id].finished && !operations[id].status.match(/executing|queued/)) (function(opid)
         {
            main.rpc("z_getoperationresult", [[opid]], (ret)=>
            {
               operations[opid].finished=true;
               operations[opid].result=ret.pop();
               try { operations[opid].txid=operations[opid].result.result.txid; } catch(err){}

               storage_save('operations',operations);
               update_transactions();
               update_addresses();
            },function(e){console.log(e);});
         })(id);
      }
      storage_save('operations',operations);
   });
}


function update_totalblocks()
{
     $.get("http://explorer.votecoin.site/insight-api-zcash/status?q=getInfo",function(res)
     {
        totalblocks=parseFloat(res.info.blocks);
     });
}


function update_transactions(start) // load all T transactions into memory
{
   if (!start) start=0;
   var max=100;
   main.rpc("listtransactions",["",max,start],(res)=>
   {
      for (var i=0; i<res.length; i++) res[i]=pick(res[i], "blocktime", "time", "fee", "category", "confirmations", "txid", "amount");
      if (start==0) transparent_transactions=res;
      else Array.prototype.unshift.apply(transparent_transactions,res);

      if (res.length>=max) update_transactions(start+max);
      else { update_addresses(); update_gui(); }
   });
}


function add_shielded_transactions_received(zaddr)
{
   main.rpc("z_listreceivedbyaddress",[zaddr,0],(res)=>
   {
      for (var i=0; i<res.length; i++) (function(rec)
      {
         main.rpc("gettransaction",[rec.txid],(ret)=>
         {
            transparent_transactions.push({"blocktime":ret.blocktime, "time":ret.time, "fee":ret.fee, "category":"receive", "confirmations": ret.confirmations, "txid": ret.txid, "amount": rec.amount, "memo": rec.memo});
         });
      })(res[i]);
   });
}


function balance_update(tgt,src,reset)
{
   var i;
   if (reset) for (i in tgt) delete tgt[i];
   for (i in src) tgt[src[i].address]=0;
   for (i in src) tgt[src[i].address]=(tgt[src[i].address]?tgt[src[i].address]:0)+src[i].amount;
}


function update_shielded_addr(zaddr)
{
   main.rpc("z_getbalance",[zaddr,0],(res)=>
   {
      balance_update(shielded_addresses,[{'address':zaddr,'amount':res}]);
   });
}


function update_addresses()
{
   main.rpc("listunspent",[0],(res)=>
   {
      balance_update(transparent_addresses,res,true);

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
   $('#progress').show();
   $('#progressmessage').html("<div style='margin-bottom: 40px; margin-top: 40px'><span class='fa fa-cloud-download' style='color: #ddd; font-size: 150px;'></span></div>Downloading VoteCoin proving keys (900MB).<br>This is needed only once, please wait...");

   // check && download sprout proving file
   main.download_all_files(download_progress,function()
   {
      show_progress(100);
      $('#progressmessage').html("<div style='margin-bottom: 40px; margin-top: 40px'><span class='fa fa-cog' style='color: #ddd; animation:spin 5s linear infinite; font-size: 150px;'></span></div>VoteCoin wallet is starting, please wait...");
      // parse votecoin.conf file, if empty set random password and write to file.

      // start wallet
      main.walletStart();

      // wait for wallet to be ready
      wait_for_wallet().then(()=>
      {
          $('#progress').hide();
          $('#dashboard').show();
          $('.menurow').first().addClass('active');
          isInitialized=true;

          update_addresses();

          // init periodic stats updaters
          setUpdater(update_rates,600000); // once per 10 minutes
          setUpdater(update_totals,10000); // every 10 seconds
          setUpdater(update_stats,2000);  // every 2 seconds
          setUpdater(update_operation_status,2000);  // every 2 seconds
          setUpdater(update_totalblocks,60000);   // every 1 minute
          setUpdater(update_transactions,60000);   // every 1 minute
          setUpdater(update_gui,1000);   // every 1 second
      })
   });
}


// TODO make sure to warn user about pending transaction before he closes window
// see https://github.com/electron/electron/issues/2301

// load settings on start

var z_track = storage_load('z_track');
$('#ztrack').prop('checked',z_track);

init();
