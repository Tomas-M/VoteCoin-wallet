/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/


var {ipcRenderer, remote} = require('electron');
const main = remote.require("./main.js");
const child_process = require('child_process');

var rateVOTBTC=0;
var rateBTCUSD=0;
var totalPrivate=0;
var totalTransparent=0;
var connections=0;
var blocks=0;
var totalblocks=0;
var transactionslist=[];
var transparent_addresses=[];
var shielded_addresses=[];

function JSON_fromString(json)
{
   var ret={};
   try { ret=JSON.parse(json); } catch (e) { console.log(e); };
   return ret;
}


function num(n,precision,strip)
{
   if (!precision) precision=0;
   n=parseFloat(n);
   n=n.toFixed(precision);
   if (strip && precision>0) n=n.replace(/0+$/,"").replace(/[.]$/,"");
   return n;
}


function msg(s)
{
   if (s=="") $('#msg').html('').hide();
   else $('#msg').text(s).show();
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


function openURL(url)
{
   child_process.execSync('start '+url);
}

// add leading and trailing spaces to numerical VOT value
function spacepad(vot)
{
    return vot.toFixed(8);
}

function update_gui()
{
    settext('transparentVOT',num(totalTransparent,8,true));
    settext('privateVOT',num(totalPrivate,8,true));
    settext('totalVOT',num(totalTransparent+totalPrivate,8));
    if (rateBTCUSD*rateVOTBTC>0) settext('totalUSD',"$"+num((totalTransparent+totalPrivate)*rateBTCUSD*rateVOTBTC,2,true));
    else sethtml('totalUSD',"&nbsp;");
    settext('connections',num(connections));
    settext('blockcurrent',num(blocks));
    settext('blocktotal',num(totalblocks>blocks?totalblocks:blocks));

    if (connections==0 || blocks==0 || totalblocks==0 || totalblocks-2>blocks) $('#syncinprogress').slideDown(); else $('#syncinprogress').slideUp();

    function date(t)
    {
      var d = new Date(t*1000);
      var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return d.getDate()+" "+monthNames[d.getMonth()]+"<br>"+d.getFullYear()+" ";
    }

    var trans="";
    for (var i in transactionslist)
    {
       var confirm=transactionslist[i].blocktime; if (!confirm) confirm=transactionslist[i].time
       trans="<div class='transactionrow "+transactionslist[i].category+"'>"
                    +"<div class=date title='"+(new Date(confirm*1000)).toUTCString()+"'>"+date(confirm)+"</div>"
                    +"<div class=confirmed>"+(transactionslist[i].confirmations==0?"<i class='fa fa-clock-o'></i>":"<i class='fa fa-check'></i>")+"</div>"
                    +"<div class=transid>"+transactionslist[i].txid+"</div>"
                    +"<div class='amount'>"+(transactionslist[i].amount>0?"+":"")+num(transactionslist[i].amount,8,true)+" VOT</div>"
             +"</div>"+trans;
    }
    sethtml('transactionslist',trans);

    $('#choosefrom').children().not(':eq(0), :eq(1)').remove();
    for(var i in transparent_addresses) if (transparent_addresses[i].amount!=0) $('#choosefrom').append('<option value="'+transparent_addresses[i].address+'">'+spacepad(transparent_addresses[i].amount)+' - '+transparent_addresses[i].address+'</option>');
    for(var i in shielded_addresses) if (shielded_addresses[i].amount!=0) $('#choosefrom').append('<option value="'+shielded_addresses[i].address+'">'+spacepad(shielded_addresses[i].amount)+' - '+shielded_addresses[i].address+'</option>');
}


function wait_for_wallet()
{
   return new Promise((resolve,reject)=>
   {
      update_totals(true,resolve);
   });
}


function update_totals(repeat,doneFunc)
{
   main.rpc("z_gettotalbalance", "", (res)=>
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
  main.rpc("z_listoperationids", "", (res)=>
  {
       console.log(res);
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
         transactionslist=res;
         update_gui();
    });
}


function update_shielded_balance(zaddr)
{
   main.rpc("z_getbalance",[zaddr],(res)=>
   {
      for(var i=shielded_addresses.length-1; i>=0; i--)
         if (shielded_addresses[i].address==zaddr) { shielded_addresses[i].amount=res; break; }
      if (i<0) shielded_addresses.push({'address':zaddr,'amount':res});
   });
}


function update_addresses()
{
   main.rpc("listunspent",[],(res)=>
   {
      transparent_addresses=res;
      main.rpc("z_listaddresses",[],(res)=>
      {
          for (var i=0; i<res.length; i++) update_shielded_balance(res[i]);
      });

      update_gui();
   });
}


function show_progress(pct)
{
   if (pct>0 && pct<100)
   {
      $('#progressinner').css('width',pct+'%');
      $('#progressinnertext').text(pct+'%');
   }
   else
   {
      $('#progressinner').css('width','100%');
      $('#progressinnertext').text('');
   }
}


function download_progress(file,size,bytes)
{
   var pct=Math.ceil(bytes/size*100);
   show_progress(pct);
}


function setUpdater(func,time)
{
   setInterval(func,time);
   setTimeout(func,0); // run right away
}


function genNewAddress(isTransparent)
{
    var prefix="";
    if (isTransparent) prefix="z_";
    main.rpc(prefix+"getnewaddress","",function(res)
    {
        var addr=res;
        $('#newaddr').val(addr).show();
        $('#qrcode').show();
        qrcode.makeCode(addr);
    },true)
}


function sendpayment()
{
     var from=$('#choosefrom').val();
     var to=$('#sendto').val();
     var amount=parseFloat($('#amount').val());
     var fee=parseFloat($('#fee').val());
     if (isNaN(fee)) fee=0;

//     votecoin-cli z_sendmany %2 "[{\"address\": \"%3\", \"amount\": %4}]" 1 0

// if total T balance > amount, use: sendtoaddress
// else use z_sendmany
//   - sendtoaddress returns directly txid in result
//   - z_sendmany returns ...?


//     main.rpc("settxfee", [fee], function(res)
     //{
       main.rpc("z_sendmany",["t1HtxNNnrmXqtGgNo5wbKf2kQTJruceigij",[{'address':to,'amount':amount}],0,fee], function(res){
          console.log('sent',res);
//          update_transactionslist();
}, function(e){console.log(e);});

/*
        main.rpc("sendtoaddress",[to,amount], function(res){
           console.log('sent',res);
           update_transactionslist();
        });
*/
     //});
}


function init()
{
   $('#progress').show();
   $('#progressmessage').html("Downloading VoteCoin proving keys (900MB).<br>This is needed only once, please wait...");

   // check && download sprout proving file
   main.download_all_files(download_progress,function()
   {
      show_progress(100);
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

          update_addresses();

          // init periodic stats updaters
          setUpdater(update_rates,600000); // once per 10 minutes
          setUpdater(update_totals,10000); // every 10 seconds
          setUpdater(update_stats,2000);  // every 2 seconds
          setUpdater(update_operation_status,2000);  // every 2 seconds
          setUpdater(update_totalblocks,60000);   // every 1 minute
          setUpdater(update_transactionslist,60000);   // every 1 minute
          setUpdater(update_gui,1000);   // every 1 second
      })
   });
}

init();
