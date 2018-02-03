
const child_process = require('child_process');

function gui_show(t,duration)
{
    $('.container:visible').css('opacity',0);
    setTimeout(function()
    {
        $('.container').hide();
        $('.menurow').removeClass('active');
        $('.menurow[data-toggle="'+t+'"]').addClass('active');
        $('#'+t).show().css('opacity',0).fadeTo(1,1);
        if (t=='send') $('#sendto').focus();
        if (t=='dashboard') $('#txfilter').focus();
        $('#right div').scrollTop(0);
    },100);
}


function update_logerr()
{
   var err=main.getLastRPCerrorMessage();
   if (err!='')
   {
      settext('rpclog',err);
      $('#rpclog').show();
      $('#blockheight').hide();
   }
   else
   {
      settext('rpclog','');
      $('#rpclog').hide();
      $('#blockheight').show();
   }
}


function dateShort(t)
{
   var d = new Date(t*1000);
   var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
   return d.getDate()+" "+monthNames[d.getMonth()]+" "+d.getFullYear()+" ";
}


function localeSubstringMatch(haystack,needle)
{
   if (haystack.toLocaleUpperCase().search(needle.toLocaleUpperCase())>=0) return true;
   return false;
}


function txfiltermatch(tx,filter)
{
   filter=$.trim(filter);
   if (filter.match(/^-?[0-9.,]+$/))  // user wants to search for amount
   {
      var amount=parseFloat(filter.replace(/,/g,"."));
      if (!isNaN(amount))
      {
         amount=Math.abs(amount);
         if (Math.abs(tx.amount)==amount) return true;
         if (Math.floor(amount)==amount && Math.floor(Math.abs(tx.amount))==amount) return true; // searching for whole number returns fractions as well
         else return false;
      }
   }

   var date=Date.parse(filter);
   if (!isNaN(date)) // user wants to search for date
   {
      // round both date and tx.blocktime to date boundaries
      date=(new Date(date)).getTime()/1000;
      if (dateShort(date)==dateShort(tx.blocktime || tx.time)) return true;
      else return false;
   }

   if (tx.memo && localeSubstringMatch(tx.memo,filter)) return true;
   if (tx.txid.match(filter)) return true;
   return false;
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

    if (connections==0 || blocks==0 || totalblocks==0) settext('blockcurrent','sync 0%',true);
    else if (totalblocks-2>blocks)
    {
       settext('blockcurrent','sync '+Math.floor(blocks/totalblocks*100)+'%',true);
       settext('blockcurrentheight','block '+blocks,true);
    }
    else
    {
       settext('blockcurrent','sync 100%');
       settext('blockcurrentheight','block '+blocks);
    }

    // Show a welcome screen until the user has some transaction
    if (transactions.length==0)
    {
       $('#welcomescreen').show();
       $('#totals').hide();
       $('#transactionsearch').hide();
       $('#transactionslist').hide();
       $('#transactionchart').hide();
    }
    else
    {
       $('#welcomescreen').hide();
       $('#totals').show();
       $('#transactionsearch').show();
       $('#transactionslist').show();
       $('#transactionchart').show();
    }

    var filter=$('#txfilter').val();
    var trans=""; var i;
    for (i=0; i<transactions.length; i++)
    if (txfiltermatch(transactions[i],filter))
    {
       var memo=htmlspecialchars(transactions[i].memo);
       if (i>20) break;
       var blocktime=transactions[i].blocktime;

       var confirmtime=blocktime; if (!confirmtime) confirmtime=transactions[i].time;
       trans+="<div class='transactionrow "+transactions[i].category+"'>"
                    +"<div class=date title='"+humanReadableDate(confirmtime)+"'>"+dateShort(confirmtime)+"</div>"
                    +"<div class=confirmed><i class='fa fa-"+(!blocktime?"clock-o":"check")+"' style='margin-left: 0px; font-size: 14px;'></i><i class='fa fa-"+(transactions[i].address?"user":"shield")+"' style='margin-left: 8px; opacity: 0.6; font-size: 14px;'></i></div>"
                    +"<div class=transid data-txid='"+transactions[i].txid+"' "+(memo?'title="'+transactions[i].txid+'"><span class=memotext>'+memo+"</span>":">"+transactions[i].txid)+"</div>"
                    +"<div class='amount'>"+(transactions[i].amount>0?"+":"")+num(transactions[i].amount,8,true)+" VOT</div>"
             +"</div>";
    }

    if (trans=='') trans='<div class=searchempty>Your search returned empty result...</div>';

    var change=sethtml('transactionslist',trans);
    if (change) // only update chart if there are new transactions sent or received
    {
        var chart=""; var i,max=0;
        for (i=0; i<transactions.length; i++) max=transactions[i].amount>max?transactions[i].amount:max;
        for (i=0; i<transactions.length; i++) chart+='<div title="'+humanReadableDate(transactions[i].blocktime||transactions[i].time)+'\n'+UCfirst(transactions[i].category)+" "+num(Math.abs(transactions[i].amount,8))+' VOT" class="chartbar '+(transactions[i].amount<0?'minus':'')+'" style="width: calc('+100/transactions.length+'% - 2px); height: '+Math.ceil(Math.abs(transactions[i].amount)/max*150)+'px"></div>';
        sethtml('transactionchart',chart);
    }

    var from=$('#choosefrom').val();
    var fromaddr="";

    for(var i in transparent_addresses) if (transparent_addresses[i]!=0) fromaddr+='<tr data-value="'+i+'"><td class=vot>'+num(transparent_addresses[i],8)+' VOT &nbsp;-</td><td class=addr>'+i+'</td></tr>';
    for(var i in shielded_addresses) if (shielded_addresses[i]!=0) fromaddr+='<tr data-value="'+i+'"><td class=vot>'+num(shielded_addresses[i],8)+' VOT &nbsp;-</td><td class=addr>'+i+'</td></tr>';
    if (fromaddr!='') fromaddr="<table cellspacing=0 cellpadding=0>"+fromaddr+"</table>"
    sethtml('choosefromaddresses',fromaddr);
    setAddressFrom(from);

    var ops="";
    var operationsAr=makeOrderedArray(operations,['creation_time']);

    for (i in operationsAr)
    {
       ops="<div class=operationrow>"
              +"<div class=operationtime title='"+humanReadableDate(operationsAr[i].creation_time)+"'>"+timeAgo(operationsAr[i].creation_time)+"</div>"
              +"<div class=operationamount>"+num(operationsAr[i].amount,8,true)+" VOT</div>"
              +"<div class=operationicon><i class='fa fa-"+(!operationsAr[i].status || operationsAr[i].status.match(/queued|executing/)?'clock-o':(operationsAr[i].status.match(/failed|canceled/)?'exclamation-circle':'check'))+"'></i></div>"
              +"<div class=operationstatus>"+(operationsAr[i].error?operationsAr[i].status+" - "+operationsAr[i].error.message:operationsAr[i].status.replace(/^executing/,"executing, please wait..."))+(operationsAr[i].txid?" - <span class=transid data-txid='"+operationsAr[i].txid+"'>txid</span>":"")+"</div>"
           +"</div>"+ops;
    }

    sethtml('operationslist',ops);

    var addressesT='';
    var addressesS='';
    for (i in transparent_addresses) if (transparent_addresses[i]!=0) addressesT+="<div class=addresslistrow><div class=addresslabel title='Receive to this address'>"+i+"</div> <div class=addressbalance>"+num(transparent_addresses[i],8)+" VOT</div><div class=addressbuttons><i title='Send from this address' class='fa fa-upload'></i></div></div>";
    for (i in shielded_addresses) if (shielded_addresses[i]!=0) addressesS+="<div class=addresslistrow><div class=addresslabel title='Receive to this address'>"+i+"</div> <div class=addressbalance>"+num(shielded_addresses[i],8)+" VOT</div><div class=addressbuttons><i title='Send from this address' class='fa fa-upload'></i></div></div>";
    sethtml('walletaddresses',(addressesT!=''?"<br><h2><i class='fa fa-user' style='margin-right: 10px;'></i></h2>"+addressesT:"")+(addressesS!=''?"<br><h2><i class='fa fa-shield' style='margin-right: 10px;'></i></h2>"+addressesS:""));
}

function setAddressFrom(ev)
{
   if (typeof ev == "string")
   {
      ev=$("#choosefromoptions [data-value='"+ev+"']");
      if (ev.length>0) ev={'currentTarget':ev};
      else ev=undefined;
   }

   if (typeof ev == "undefined")
   {
      if ($('#choosefrom').val().match(/^z/)) setAddressFrom("z");
      else setAddressFrom("t");
      return;
   }

   $('#choosefromlabel').val("From: "+$(ev.currentTarget).find('td').last().text().replace(/^From: /,""));
   $('#choosefrom').val($(ev.currentTarget).data('value'));
   $('#choosefromoptions tr').removeClass('active');
   $("#choosefromoptions [data-value='"+$(ev.currentTarget).data('value')+"']").addClass('active');
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

function show_receiving_address(addr)
{
   var el=$('#'+(addr.length>60?"z":"t")+'addrbox');
   $('#taddrbox').html('');
   $('#zaddrbox').html('');
   el.html("<textarea style='width: calc(100% - 20px);'></textarea>");
   el.find('textarea').val(addr).css('height',addr.length>60?'48px':'17px').select();
   $('#qrcode').show();
   qrcode.makeCode(addr);
   $('#right div').animate({scrollTop:0}, 500, 'swing');
}

function download_progress(file,size,bytes)
{
   var pct=Math.ceil(bytes/size*100);
   show_progress(pct);
}

function msg(s)
{
   if (s=="") $('#msg').html('').hide();
   else $('#msg').text(s).show();
}


function openURL(url)
{
   child_process.execSync('start '+url);
}
