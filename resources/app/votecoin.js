/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/


var {ipcRenderer, remote} = require('electron');
const main = remote.require("./main.js");
const child_process = require('child_process');

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

var transparent_addresses=[];
var shielded_addresses=[];

var operations=[];


function JSON_fromString(json)
{
   var ret={};
   try { ret=JSON.parse(json); } catch (e) { console.log(e); };
   return ret;
}


function ztrack_toggle()
{
   z_track=$('#ztrack').is(':checked')?1:0;
   stash.set('z_track',z_track);
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

function hexDecode(hex)
{
    var str='';
    hex=hex.replace(/0+$/,"");
    if (hex.substr(0,2).toUpperCase().match(/^F5|^F6/)) return '';
    for (var i=0; i<hex.length; i+=2) str+=String.fromCharCode(parseInt(hex.substr(i,2),16));
    return str;
}

function htmlspecialchars(str)
{
   return str;
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

    var trans=""; var i;
    for (i=transparent_transactions.length-1; i>=0; i--)
    {
       if (i<transparent_transactions.length-10) break;
       var confirm=transparent_transactions[i].blocktime; if (!confirm) confirm=transparent_transactions[i].time
       trans+="<div class='transactionrow "+transparent_transactions[i].category+"'>"
                    +"<div class=date title='"+(new Date(confirm*1000)).toUTCString()+"'>"+date(confirm)+"</div>"
                    +"<div class=confirmed>"+(transparent_transactions[i].confirmations==0?"<i class='fa fa-clock-o'></i>":"<i class='fa fa-check'></i>")+"</div>"
                    +"<div class=transid "+(transparent_transactions[i].memo?'title="'+htmlspecialchars(hexDecode(transparent_transactions[i].memo))+'"':"")+">"+transparent_transactions[i].txid+"</div>"
                    +"<div class='amount'>"+(transparent_transactions[i].amount>0?"+":"")+num(transparent_transactions[i].amount,8,true)+" VOT</div>"
             +"</div>";
    }
    sethtml('transactionslist',trans);

    var from=$('#choosefrom').val();
    $('#choosefrom').children().not(':eq(0), :eq(1)').remove();
    for(var i in transparent_addresses) if (transparent_addresses[i].amount!=0) $('#choosefrom').append('<option value="'+transparent_addresses[i].address+'">'+spacepad(transparent_addresses[i].amount)+' - '+transparent_addresses[i].address+'</option>');
    for(var i in shielded_addresses) if (shielded_addresses[i].amount!=0) $('#choosefrom').append('<option value="'+shielded_addresses[i].address+'">'+spacepad(shielded_addresses[i].amount)+' - '+shielded_addresses[i].address+'</option>');
    $('#choosefrom').val(from);

    var ops="";
    for (i=operations.length-1; i>=0; i--)
    {
       ops+="<div class=operationrow>"
              +"<div class=operationid>"+operations[i].id.replace(/^opid-/,"")+"</div>"
              +"<div class=operationicon><i class='fa fa-"+(operations[i].status.match(/pending|queued|executing/)?'clock-o':(operations[i].status=='failed'?'exclamation-circle':'check'))+"'></i></div>"
              +"<div class=operationstatus>"+(operations[i].error?operations[i].error.message:operations[i].status)+"</div>"
           +"</div>";
    }
    sethtml('operationslist',ops);
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
         res[i]=pick(res[i], "creation_time", "id", "method", "status", "error");

         if (res[i].status=="success")
         main.rpc("z_getoperationresult", [[res[i].id]], (ret)=>
         {
             console.log(ret);
             // TODO perhaps msg user that operation has completed
         },function(e){console.log(e);});
      }
      operations=res;
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

function update_shielded_addr(zaddr)
{
   main.rpc("z_getbalance",[zaddr,0],(res)=>
   {
      for(var i=shielded_addresses.length-1; i>=0; i--)
         if (shielded_addresses[i].address==zaddr) { shielded_addresses[i].amount=res; break; }
      if (i<0) shielded_addresses.push({'address':zaddr,'amount':res});
   });
}


function update_addresses()
{
   main.rpc("listunspent",[0],(res)=>
   {
      for (var j=0; j<res.length; j++)
      {
         for(var i=transparent_addresses.length-1; i>=0; i--)
            if (transparent_addresses[i].address==res[j].address) { transparent_addresses[i].amount=res[j].amount; break; }
         if (i<0) transparent_addresses.push(res[j]);
      }

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


function genNewAddress(transparent)
{
    var prefix="";
    if (transparent) prefix="z_";
    main.rpc(prefix+"getnewaddress","",function(res)
    {
        var addr=res;
        $('#newaddr').val(addr).show();
        $('#qrcode').show();
        qrcode.makeCode(addr);
    },true)
}

function isTransparent(addr) { return addr.substr(0,1)=='t'; }
function isPrivate(addr) { return !isTransparent(addr); }
function reset_sendform() {} // TODO

function sendpayment()
{
     var i;
     var from=$('#choosefrom').val();
     var to=$('#sendto').val();
     var amount=parseFloat($('#amount').val());
     if (isNaN(amount)) amount=0;
     var fee=parseFloat($('#fee').val());
     if (isNaN(fee)) fee=0;

     function payment_failure(err)
     {
        if (err.error) err=err.error;
        if (err.message) err=err.message;
        console.log(err);
     }

     function payment_success(res)
     {
        console.log(res);
        if (res.match(/^opid-/)) update_operation_status();
        update_transactions();
        update_addresses();
        reset_sendform();
     }

     if (amount==0) return payment_failure("Amount must be greater than zero");

     if (from=='t') // auto-select transparent FROM address
     {
        // if TO address is transparent, just use sendtoaddress rpc
        if (isTransparent(to))
        {
            main.rpc("settxfee", [fee], function(res) {
               main.rpc("sendtoaddress",[to,amount,"","",false], payment_success,payment_failure);
            }, function(err){ payment_failure("Could not set tx fee to "+fee); });
        }
        else
        {
           // else if TO address is shielded, we may need to find best suitable FROM t address manually by balance.
           for(i in transparent_addresses) if (transparent_addresses[i].amount>=amount+fee)
           {
              main.rpc("z_sendmany",[transparent_addresses[i].address,[{'address':to,'amount':amount}],0,fee], payment_success,payment_failure);
              return;
           }
           payment_failure("Can't find any transparent address with sufficient balance.");
        }
     }
     else
     if (from=='z') // auto-select shielded FROM address
     {
        for(i in shielded_addresses) if (shielded_addresses[i].amount>=amount+fee)
        {
           main.rpc("z_sendmany",[shielded_addresses[i].address,[{'address':to,'amount':amount}],1,fee], payment_success,payment_failure);
           return;
        }
        payment_failure("Can't find any transparent address with sufficient balance.");
     }
     else // one particular transparent or shielded address selected, try the payment as is
     {
         main.rpc("z_sendmany",[from,[{'address':to,'amount':amount}],isTransparent(from)?0:1,fee], payment_success,payment_failure);
     }
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
          setUpdater(update_transactions,60000);   // every 1 minute
          setUpdater(update_gui,1000);   // every 1 second
      })
   });
}

// https://github.com/electron/electron/issues/2301

// load settings on start

var z_track = stash.get('z_track');
if (typeof z_track == "undefined") { z_track=1; stash.set('z_track',z_track); }
$('#ztrack').prop('checked',z_track);

init();
