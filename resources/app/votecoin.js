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

var transparent_addresses={};
var shielded_addresses={};

var operations=storage_load('operations',{});

function JSON_fromString(str)
{
   var ret={};
   try { ret=JSON.parse(str); } catch (e) { console.log(e); };
   return ret;
}

function JSON_toString(obj)
{
   return JSON.stringify(obj);
}


function ztrack_toggle()
{
   z_track=$('#ztrack').is(':checked')?1:0;
   storage_save('z_track',z_track);
}


function storage_save(key,val)
{
   if (typeof val === "undefined") return;
   localStorage.setItem(key, JSON_toString(val));
}

function storage_load(key,default_value)
{
   var val=localStorage.getItem(key);
   if (typeof val == "undefined") { val=default_value; storage_save(key,val); }
   else val=JSON_fromString(val);
   return val;
}


function num(n,precision,strip)
{
   if (!precision) precision=0;
   n=parseFloat(n);
   if (isNaN(n)) n=0;
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


function htmlspecialchars(text)
{
   text=text+"";
   var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
   return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function utcDate(d)
{
   return (new Date(d*1000)).toUTCString();
}

function now()
{
   return Math.floor(Date.now()/1000);
}

function timeAgo(t)
{
   function plural(n) { if (n>1 || n==0) return "s"; else return ""; }
   var length=now()-t;

   var days=length/60/60/24;
   var hours=(days-Math.floor(days))*24;
   var minutes=(hours-Math.floor(hours))*60;

   var weeks=Math.floor(days/7);
   var months=Math.floor(days/30);
   var years=Math.floor(days/365);

   days=Math.floor(days);
   hours=Math.floor(hours);
   minutes=Math.floor(minutes);

   if (years>0) return years+" year"+plural(years)+" ago";
   if (months>0) return months+" month"+plural(months)+" ago";
   if (weeks>0) return weeks+" week"+plural(weeks)+" ago";
   if (days>0) return days+" day"+plural(days)+" ago";
   if (hours>0) return hours+" hour"+plural(hours)+" ago";
   if (minutes>0) return minutes+" minute"+plural(minutes)+" ago";
   return "a while ago";
}


function makeOrderedArray(obj,sortkey,idname)
{
   var res=[]; var el;
   for (var i in obj)
   {
      el=obj[i];
      if (idname) el[idname]=i;
      res.push(el);
   }
   return res.sort( function(a, b) { if (a[sortkey]==b[sortkey]) return 0; if (a[sortkey]<b[sortkey]) return -1; else return 1; } );
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
       var memo=htmlspecialchars($.trim(hexDecode(transparent_transactions[i].memo)));
       if (i<transparent_transactions.length-10) break;
       var confirm=transparent_transactions[i].blocktime; if (!confirm) confirm=transparent_transactions[i].time
       trans+="<div class='transactionrow "+transparent_transactions[i].category+"'>"
                    +"<div class=date title='"+utcDate(confirm)+"'>"+date(confirm)+"</div>"
                    +"<div class=confirmed>"+(transparent_transactions[i].confirmations==0?"<i class='fa fa-clock-o'></i>":"<i class='fa fa-check'></i>")+"</div>"
                    +"<div class=transid data-txid='"+transparent_transactions[i].txid+"' "+(memo?'title="'+transparent_transactions[i].txid+'"><span class=memotext>'+memo+"</span>":">"+transparent_transactions[i].txid)+"</div>"
                    +"<div class='amount'>"+(transparent_transactions[i].amount>0?"+":"")+num(transparent_transactions[i].amount,8,true)+" VOT</div>"
             +"</div>";
    }
    sethtml('transactionslist',trans);

    var from=$('#choosefrom').val();
    $('#choosefrom').children().not(':eq(0), :eq(1)').remove();
    for(var i in transparent_addresses) if (transparent_addresses[i]!=0) $('#choosefrom').append('<option value="'+i+'">'+spacepad(transparent_addresses[i])+' - '+i+'</option>');
    for(var i in shielded_addresses) if (shielded_addresses[i]!=0) $('#choosefrom').append('<option value="'+i+'">'+spacepad(shielded_addresses[i])+' - '+i+'</option>');
    $('#choosefrom').val(from);
    if ($('#choosefrom').val()==null) $('#choosefrom').val($("#choosefrom option:eq("+(from.match(/^z/)?"1":"0")+")").val());

    var ops="";
    var operationsAr=makeOrderedArray(operations,'creation_time');
    for (i in operationsAr)
    {
       ops="<div class=operationrow>"
              +"<div class=operationtime title='"+utcDate(operationsAr[i].creation_time)+"'>"+timeAgo(operationsAr[i].creation_time)+"</div>"
              +"<div class=operationamount>"+num(operationsAr[i].amount,8,true)+" VOT</div>"
              +"<div class=operationicon><i class='fa fa-"+(operationsAr[i].status.match(/pending|queued|executing/)?'clock-o':(operationsAr[i].status=='failed'?'exclamation-circle':'check'))+"'></i></div>"
              +"<div class=operationstatus>"+(operationsAr[i].error?operationsAr[i].status+" - "+operationsAr[i].error.message:operationsAr[i].status)+(operationsAr[i].txid?" - <span class=transid data-txid='"+operationsAr[i].txid+"'>txid</span>":"")+"</div>"
           +"</div>"+ops;
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


function show_progress(pct)
{
   if (pct>0 && pct<100)
   {
      $('#progressinner').css('width',pct+'%');
      $('#progressinnertext').text(pct+'%');
      $('#progressbar').show();
   }
   else
   {
      $('#progressinner').css('width','100%');
      $('#progressinnertext').text('');
      $('#progressbar').hide();
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


function maxSendAmount()
{
   var i;
   var amount=0;
   var fee=parseFloat($('#fee').val()); if (isNaN(fee)) fee=0;

   var from=$('#choosefrom').val();

   if (from=='t') for(i in transparent_addresses) amount+=transparent_addresses[i];
   else if (from=='z') { for(i in shielded_addresses) if (shielded_addresses[i]>amount) amount=shielded_addresses[i]; }
   else if (isTransparent(from)) amount=transparent_addresses[from];
   else amount=shielded_addresses[from];

   amount=amount-fee;
   $('#amount').val(num(amount,8,true));
}


function isTransparent(addr) { return addr.substr(0,1)=='t'; }
function isPrivate(addr) { return !isTransparent(addr); }
function reset_sendform() {} // TODO

function sendpayment()
{
     var i;
     var from=$('#choosefrom').val();
     var to=$('#sendto').val();
     var amount=parseFloat($('#amount').val()); if (isNaN(amount)) amount=0;
     var fee=parseFloat($('#fee').val()); if (isNaN(fee)) fee=0;
     var memo=hexEncode($.trim($('#memo').val()));

     function payment_failure(err)
     {
        if (err.error) err=err.error;
        if (err.message) err=err.message;
        operations[now(true)]={'amount':amount, 'creation_time':now(), 'finished':true, 'status':"failed", 'error':{'message':err}}
     }

     function payment_success(res)
     {
        console.log(res);
        if (res.match(/^opid-/)) { operations[res]={'amount':amount, 'creation_time':now()}; update_operation_status(); }
        else operations[now(true)]={'amount':amount, 'creation_time':now(), 'finished':true, 'status':"success"}

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
           for(i in transparent_addresses) if (transparent_addresses[i]>=amount+fee)
           {
              main.rpc("z_sendmany",[i,[{'address':to,'amount':amount,'memo':memo}],0,fee], payment_success,payment_failure);
              return;
           }
           payment_failure("Can't find any transparent address with sufficient balance.");
        }
     }
     else
     if (from=='z') // auto-select shielded FROM address
     {
        for(i in shielded_addresses) if (shielded_addresses[i]>=amount+fee)
        {
           main.rpc("z_sendmany",[shielded_addresses[i],[{'address':to,'amount':amount,'memo':memo}],1,fee], payment_success,payment_failure);
           return;
        }
        payment_failure("Can't find any transparent address with sufficient balance.");
     }
     else // one particular transparent or shielded address selected, try the payment as is
     {
         main.rpc("z_sendmany",[from,[{'address':to,'amount':amount,'memo':memo}],isTransparent(from)?0:1,fee], payment_success,payment_failure);
     }
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
