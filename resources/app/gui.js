
const child_process = require('child_process');

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
       var blocktime=transparent_transactions[i].blocktime;

       var confirmtime=blocktime; if (!confirmtime) confirmtime=transparent_transactions[i].time;
       trans+="<div class='transactionrow "+transparent_transactions[i].category+"'>"
                    +"<div class=date title='"+utcDate(confirmtime)+"'>"+date(confirmtime)+"</div>"
                    +"<div class=confirmed>"+(!blocktime?"<i class='fa fa-clock-o'></i>":"<i class='fa fa-check'></i>")+"</div>"
                    +"<div class=transid data-txid='"+transparent_transactions[i].txid+"' "+(memo?'title="'+transparent_transactions[i].txid+'"><span class=memotext>'+memo+"</span>":">"+transparent_transactions[i].txid)+"</div>"
                    +"<div class='amount'>"+(transparent_transactions[i].amount>0?"+":"")+num(transparent_transactions[i].amount,8,true)+" VOT</div>"
             +"</div>";
    }
    sethtml('transactionslist',trans);

    var from=$('#choosefrom').val();
    $('#choosefrom').children().not(':eq(0), :eq(1)').remove();
    $('#choosefrom').append('<option disabled>------------------------------------------------------------------------------------------------------');
    for(var i in transparent_addresses) if (transparent_addresses[i]!=0) $('#choosefrom').append('<option value="'+i+'">'+num(transparent_addresses[i],8)+' - '+i+'</option>');
    for(var i in shielded_addresses) if (shielded_addresses[i]!=0) $('#choosefrom').append('<option value="'+i+'">'+num(shielded_addresses[i],8)+' - '+i+'</option>');
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

function msg(s)
{
   if (s=="") $('#msg').html('').hide();
   else $('#msg').text(s).show();
}


function openURL(url)
{
   child_process.execSync('start '+url);
}
