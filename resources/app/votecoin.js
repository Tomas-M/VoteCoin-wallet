/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/


var {ipcRenderer, remote} = require('electron');  
var main = remote.require("./main.js");

var rateVOTBTC=0;
var rateBTCUSD=0;
var totalPrivate=0;
var totalTransparent=0;
var connections=0;
var blocks=0;
var totalblocks=0;
var transactionslist=[];


function JSON_fromString(json)
{
   var ret={};
   try { ret=JSON.parse(json); } catch (e) { console.log(e); };
   return ret;
}


function num(n,precision)
{
   if (!precision) precision=0;
   n=parseFloat(n);
   return n.toFixed(precision);
}


function msg(s)
{
   if (s=="") $('#msg').html('').hide();
   else $('#msg').text(s).show();
}


function wait_for_wallet()
{
   return new Promise((resolve,reject)=>
   {
      main.rpc("getinfo", "", (res)=> { if (res.result) resolve(); }, true);
   });
}


function settext(element,t)
{
   var el=$('#'+element);
   if (el.text()==t) return;
   el.text(t);
}

function sethtml(element,h)
{
   var el=$('#'+element);
   if (el.data('rawhtml')==h) return;
   el.html(h);
   el.data('rawhtml',h)
}


function update_gui()
{
    settext('transparentVOT',num(totalTransparent,8));
    settext('privateVOT',num(totalPrivate,8));
    settext('totalVOT',num(totalTransparent+totalPrivate,8));
    if (rateBTCUSD*rateVOTBTC>0) settext('totalUSD',"$"+num((totalTransparent+totalPrivate)*rateBTCUSD*rateVOTBTC,2));
    else sethtml('totalUSD',"&nbsp;");
    settext('connections',num(connections));
    settext('blockcurrent',num(blocks));
    settext('blocktotal',num(totalblocks>blocks?totalblocks:blocks));

    function date(t)
    {
      var d = new Date(t*1000);
      var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return d.getDate()+" "+monthNames[d.getMonth()]+"<br>"+d.getFullYear()+" ";
    }

    var trans="";
    for (var i in transactionslist)
         trans+="<div class='transactionrow "+transactionslist[i].category+"'>"
                    +"<div class=date>"+date(transactionslist[i].blocktime)+"</div>"
                    +"<div class=confirmed>"+(transactionslist[i].confirmations==0?"<i class='fa fa-clock-o'></i>":"<i class='fa fa-check'></i>")+"</div>"
                    +"<div class=transid>"+transactionslist[i].txid+"</div>"
                    +"<div class='amount'>"+(transactionslist[i].amount>0?"+":"")+transactionslist[i].amount+" VOT</div>"
               +"</div>";

    sethtml('transactionslist',trans);
}


function update_totals()
{
   main.rpc("z_gettotalbalance", "", (res)=>
   {
      if (res.result)
      {
         totalTransparent=parseFloat(res.result.transparent);
         totalPrivate=parseFloat(res.result.private);
      }
   });
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
        if (res.result)
        {
            connections=parseFloat(res.result.connections);
            blocks=parseFloat(res.result.blocks);
        }
    });
}


function update_totalblocks()
{
     $.get("http://explorer.votecoin.site/insight-api-zcash/status?q=getInfo",function(res)
     {
        totalblocks=parseFloat(res.info.blocks);
     });
}


function update_transactionslist()
{
    main.rpc("listtransactions",[],(res)=>
    {
        if (res.result)
        {
            transactionslist=res.result;
        }
    });
}


function download_progress(file,size,bytes)
{
   $('#progressbar').css('width',Math.ceil(bytes/size*100)+'%');
}

function setUpdater(func,time)
{
   setInterval(func,time);
   setTimeout(func,0); // run right away
}


function init()
{
   $('#progress').show();
   $('#progressmessage').html("Downloading VoteCoin proving keys (900MB).<br>This is needed only once, please wait...");

   // check && download sprout proving file
   main.download_all_files(download_progress,function()
   {
      $('#progressmessage').html("VoteCoin wallet is starting, please wait...");
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

          // init periodic stats updaters
          setUpdater(update_rates,600000); // once per 10 minutes
          setUpdater(update_totals,10000); // every 10 seconds
          setUpdater(update_stats,2000);  // every 2 seconds
          setUpdater(update_totalblocks,60000);   // every 1 minute
          setUpdater(update_transactionslist,60000);   // every 1 minute
          setUpdater(update_gui,1000);   // every 1 second
      })
   });
}

init();
