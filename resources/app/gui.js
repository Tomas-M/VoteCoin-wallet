
const child_process = require('child_process');

function gui_show(t)
{
    $('.menurow').removeClass('active');
    $('.menurow[data-toggle="'+t+'"]').addClass('active');
    $('.container').hide();
    $('#'+t).show();
    if (t=='send') $('#sendto').focus();
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
    else if (totalblocks-2>blocks) settext('blockcurrent','sync '+Math.floor(blocks/totalblocks*100)+'%',true);
    else settext('blockcurrent','sync 100%');

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

    function date(t)
    {
      var d = new Date(t*1000);
      var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return d.getDate()+" "+monthNames[d.getMonth()]+" "+d.getFullYear()+" ";
    }

    var trans=""; var i;
    for (i=0; i<transactions.length; i++)
    {
       var memo=htmlspecialchars(transactions[i].memo);
       if (i>20) break;
       var blocktime=transactions[i].blocktime;

       var confirmtime=blocktime; if (!confirmtime) confirmtime=transactions[i].time;
       trans+="<div class='transactionrow "+transactions[i].category+"'>"
                    +"<div class=date title='"+humanReadableDate(confirmtime)+"'>"+date(confirmtime)+"</div>"
                    +"<div class=confirmed><i class='fa fa-"+(!blocktime?"clock-o":"check")+"' style='margin-left: 0px; font-size: 14px;'></i><i class='fa fa-"+(transactions[i].address?"user":"shield")+"' style='margin-left: 8px; opacity: 0.6; font-size: 14px;'></i></div>"
                    +"<div class=transid data-txid='"+transactions[i].txid+"' "+(memo?'title="'+transactions[i].txid+'"><span class=memotext>'+memo+"</span>":">"+transactions[i].txid)+"</div>"
                    +"<div class='amount'>"+(transactions[i].amount>0?"+":"")+num(transactions[i].amount,8,true)+" VOT</div>"
             +"</div>";
    }

    var change=sethtml('transactionslist',trans);

    if (change) // only update chart if there are new transactions sent or received
    {
        var chart=""; var i,max=0;
        for (i=0; i<transactions.length; i++) max=transactions[i].amount>max?transactions[i].amount:max;
        for (i=0; i<transactions.length; i++) chart='<div title="'+humanReadableDate(transactions[i].blocktime||transactions[i].time)+'\n'+UCfirst(transactions[i].category)+" "+num(Math.abs(transactions[i].amount,8))+' VOT" class="chartbar '+(transactions[i].amount<0?'minus':'')+'" style="width: calc('+100/transactions.length+'% - 2px); height: '+Math.ceil(Math.abs(transactions[i].amount)/max*150)+'px"></div>'+chart;
        sethtml('transactionchart',chart);
    }

    var from=$('#choosefrom').val();
    $('#choosefrom').children().not(':eq(0), :eq(1)').remove();
    $('#choosefrom').append('<option disabled>------------------------------------------------------------------------------------------------------');
    for(var i in transparent_addresses) if (transparent_addresses[i]!=0) $('#choosefrom').append('<option value="'+i+'">'+num(transparent_addresses[i],8)+' - '+i+'</option>');
    for(var i in shielded_addresses) if (shielded_addresses[i]!=0) $('#choosefrom').append('<option value="'+i+'">'+num(shielded_addresses[i],8)+' - '+i+'</option>');
    $('#choosefrom').val(from);
    if ($('#choosefrom').val()==null) $('#choosefrom').val($("#choosefrom option:eq("+(from.match(/^z/)?"1":"0")+")").val());

    var ops="";
    var operationsAr=makeOrderedArray(operations,['creation_time']);

    for (i in operationsAr)
    {
       ops="<div class=operationrow>"
              +"<div class=operationtime title='"+humanReadableDate(operationsAr[i].creation_time)+"'>"+timeAgo(operationsAr[i].creation_time)+"</div>"
              +"<div class=operationamount>"+num(operationsAr[i].amount,8,true)+" VOT</div>"
              +"<div class=operationicon><i class='fa fa-"+(!operationsAr[i].status || operationsAr[i].status.match(/queued|executing/)?'clock-o':(operationsAr[i].status.match(/failed|canceled/)?'exclamation-circle':'check'))+"'></i></div>"
              +"<div class=operationstatus>"+(operationsAr[i].error?operationsAr[i].status+" - "+operationsAr[i].error.message:operationsAr[i].status)+(operationsAr[i].txid?" - <span class=transid data-txid='"+operationsAr[i].txid+"'>txid</span>":"")+"</div>"
           +"</div>"+ops;
    }

    sethtml('operationslist',ops);

    var addressesT='';
    var addressesS='';
    for (i in transparent_addresses) if (transparent_addresses[i]!=0) addressesT+="<div class=addresslistrow><div class=addresslabel title='Receive to this address'>"+i+"</div> <div class=addressbalance>"+num(transparent_addresses[i],8)+" VOT</div><div class=addressbuttons><i title='Send from this address' class='fa fa-upload'></i></div></div>";
    for (i in shielded_addresses) if (shielded_addresses[i]!=0) addressesS+="<div class=addresslistrow><div class=addresslabel title='Receive to this address'>"+i+"</div> <div class=addressbalance>"+num(shielded_addresses[i],8)+" VOT</div><div class=addressbuttons><i title='Send from this address' class='fa fa-upload'></i></div></div>";
    sethtml('walletaddresses',(addressesT!=''?"<br><h2><i class='fa fa-user' style='margin-right: 10px;'></i></h2>"+addressesT:"")+(addressesS!=''?"<br><h2><i class='fa fa-shield' style='margin-right: 10px;'></i></h2>"+addressesS:""));
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
   $('#newaddr').val(addr).show();
   $('#newaddr').css('height',addr.length>60?'45px':'17px');
   $('#qrcode').show();
   qrcode.makeCode(addr);
   $('#right div').stop().animate({scrollTop:0}, 500, 'swing');
   $('#newaddr').select();
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
