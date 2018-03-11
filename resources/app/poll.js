/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/

function show_new_poll_help(e)
{
   if (e.type=='mouseleave' || e.type=='focusout')
   {
      $('#polloptionhelp').stop().fadeTo(500,0);
   }
   if (e.type=='mouseenter' || e.type=='focusin')
   {
      var h=$('#helpcontainer').height();
      var help=$(e.target).data('help')||"";
      if (help=='next') help=$(e.target).next().data('help')||"";
      if (help) help="<div id=helpcontainer><div style='position: relative; top:13px; border-bottom: 1px dashed #666; z-index:1'></div><div align=center><i class='fa fa-info-circle' style='padding: 5px; background-color: #e9e9e9; color: #777; z-index:2; position: relative;'></i></div><div align=justify style='font-size: 14px;'>"+help+"</div></div>";
      else return;
      $('#polloptionhelp').html(help);
      if ($('#helpcontainer').height()<h) $('#helpcontainer').height(h);
      $('#polloptionhelp').stop().fadeTo(500,1);
   }
}


function poll_dashboard(show)
{
   if (show)
   {
      $('#pollfilter').show();
      $('#votelist').show();
      $('#votesearch').show();
      $('#newvote').hide();
      $('#addnewpoll').html($('#addnewpoll').data('prevtext')).removeClass('cancel').data('prevtext','');
      $('#actionbutton').html('');
      $('#voteid').text('');
      scrollTop();
   }
   else
   {
      $('#pollfilter').hide();
      $('#votelist').hide();
      $('#votesearch').hide();
      $('#newvote').show();
      $('#addnewpoll').data('prevtext',$('#addnewpoll').html());
      $('#addnewpoll').html('<span class="fa fa-long-arrow-alt-left"></span> &nbsp;back').addClass('cancel');
   }
}


function show_new_poll(ev)
{
   var btn=$(this);
   if (btn.data('prevtext')) return poll_dashboard(true); // click on back button

   poll_dashboard(false);
   var bPerDay=1440/2.5; // average blocks per day
   $('#newvote').html(""
                    +"<div style='display: inline-block; width: calc(100% - 242px); margin-right: 20px; vertical-align: top;'>"
                       +"<input id=polltitle type=text placeholder='Poll or Campaign title or question' style='font-size: 17px;'>"
                       +"<textarea style='font-family: Arial; height: 66px; margin-bottom: 6px;' rows=3 id=polltext placeholder='Description or public note (optional)'></textarea>"
                       +"<div id=options>"
                       +"<input id=option1 type=text placeholder='Option or answer #1'>"
                       +"<input id=option2 type=text placeholder='Option or answer #2'>"
                       +"<input id=option3 type=text placeholder='Option or answer #3'>"
                       +"<input id=option4 type=text placeholder='Option or answer #4'>"
                       +"<input id=option5 type=text placeholder='Option or answer #5'>"
                       +"<input id=option6 type=text placeholder='Option or answer #6'>"
                       +"</div>"

                       +"<button id=addoption>+ more options</button>&nbsp;<button id=rmoption>- less options</button>"
                       +"<br><br><div id=makepolllog></div>"
                    +"</div>"

                    +"<div style='display: inline-block; vertical-align: top;'>"
                       +"<div id=logopreview></div>"
                       +"<div style='display: inline-block; overflow: hidden; white-space: nowrap; width: 222px;'>"
                          +"<input type=file id=polllogo><label data-help='Using a logo image is optional. Choose a small image file from disk. Make sure its width is 220 pixels. File size affects the costs, so you should optimize your image before publishing. Reasonable size is ~ 2 KB. Transparent background is recommended.'"
                             +" for='polllogo' style='width: 202px; font-size: 14px; line-height: 19px;' class=forfile data-label='<i class=\"fa fa-image\"></i> &nbsp;Choose a logo (220px)'><i class='fa fa-image'></i> &nbsp;Choose a logo (220px)</label>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 185px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=refundable data-help='Refund is not guaranteed by the protocol. This setting only indicates whether the publisher (you) promises to refund votes (either losing or all or none) when the poll or campaign is over, if certain criteria is met (specified in public note).'>"
                             +"<option value=0>Non-refundable votes<option value=1>Refundable losing votes<option value=2>Refundable all votes</select>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=suggestvot data-help='Suggest default vote size to encourage users to spend certain amount of total VOT on their voting.'>"
                             +"<option value=1>Suggested vote size 1 VOT<option value=2>Suggested vote size 2 VOT<option value=5>Suggested vote size 5 VOT<option value=custom>Custom suggested vote size...</select>"
                          +"<div style='position: relative;' class=hidden>"
                             +"<span class='fa fa-times nocustom' style='background-color: #ffffff; padding: 6px 9px 6px 9px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; none; color: #777;' data-help='next'></span>"
                             +"<input placeholder='10 VOT' type=text style='width: 170px; padding-right: 40px;' id=suggestvot2 data-help='Suggest default vote size to encourage users to spend certain amount of total VOT on their voting.'>"
                          +"</div>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=shuffle data-help='The order in which options are presented to the user can strongly influence results. Use this setting to specify how everyone sees the options - either in the predefined order, or randomly shuffled.'>"
                              +"<option value=0>Keep options in this order<option value=1>Shuffle options for each user</select>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=endblock data-help='When the duration is specified in weeks or months, the system calculates target block height automatically. Only votes confirmed by the target block or earlier are counted towards the final results.'>"
                              +"<option value="+(totalblocks+bPerDay*7)+">One week duration<option value="+(totalblocks+bPerDay*14)+">Two weeks duration<option value="+(totalblocks+bPerDay*21)+">Three weeks duration<option value="+(totalblocks+bPerDay*30)+">One month duration<option value="+(totalblocks+bPerDay*60)+">Two months duration<option value=custom>Custom final block height...</select>"
                          +"<div style='position: relative;' class=hidden>"
                             +"<span class='fa fa-times nocustom' style='background-color: #ffffff; padding: 6px 9px 6px 9px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; color: #777;' data-help='next'></span>"
                             +"<input placeholder='"+(totalblocks+bPerDay*7)+"' type=text style='width: 170px; padding-right: 40px;' id=endblock2 data-help='Specify target block height. Only votes confirmed by the target block or earlier are counted towards the final results.'>"
                          +"</div>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=countvotes data-help='Either count all votes received, or specify address from which you distribute votes to your users. In the later case, only votes trackable back to your sending address will be counted towards the results.'>"
                              +"<option value=''>Count all votes<option value=custom>Count only votes you distribute...</select>"
                          +"<div style='position: relative;' class=hidden>"
                             +"<span class='fa fa-times nocustom' style='background-color: #ffffff; padding: 6px 9px 6px 9px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; color: #777;' data-help='next'></span>"
                             +"<input placeholder='Your distribution address: t1xyz' type=text style='width: 170px; padding-right: 40px;' id=countvotes2 data-help='Specify address from which you distribute votes to your users. Only votes trackable back to this sending address will be counted towards the results.'>"
                          +"</div>"
                       +"</div><br>"
                       +"<br><div id=polloptionhelp style='opacity: 0; width: 222px; height: 100px;'></div>"
                    +"</div>"
                 );

   $('#polltitle').focus();
   $('#actionbutton').html("<button style='width: 222px;' id=startpoll data-help='Start the poll or campaign by publishing it in the blockchain. This action costs a fee depending on total amount of data published. The biggest part is usually the logo, so keep it small or skip using it to save on fees.'><i class='fa fa-play'></i> &nbsp;Start, <span id=pollcost>10</span> VOT</button>");
   $('#actionbutton button').trigger('mouseenter');
}


function add_poll_option()
{
    var el=$('#options');
    var i=el.find('input').length+1;
    $("<input style='display: none; opacity: 0;' id=option"+i+" type=text placeholder='Option or answer #"+i+"'>").appendTo(el).slideDown(100).fadeTo(200,1);
    if (i>2) $('#rmoption').fadeIn(); else $('#rmoption').fadeOut();
}


function rm_poll_option()
{
    var el=$('#options');
    var i=el.find('input').length;
    if (i<=2) return;
    el.find('input').last().fadeTo(200,0,function(){ $(this).slideUp(100,function(){ $(this).remove(); poll_change.call(this); }); });
    if (i>3) $('#rmoption').fadeIn(); else $('#rmoption').fadeOut();
}

// -----------------------------------------------------------------------------------------

function import_viewing_keys()
{
   main.rpc("z_importviewingkey",[poll_viewkey,"whenkeyisnew"],function(res){if (res) console.log(res);},function(res){if (res) console.log(res)});
}

// -----------------------------------------------------------------------------------------

function poll_data(genAddr, doneFunc)
{
   var options=[];
   $('#options input').each(function(ix,el){ if ($.trim($(el).val())!='') options.push($.trim($(el).val())); });

   var addresses=[];

   var push_new_addresses=function(done)
   {
      if (addresses.length>=options.length) return done();
      if (!genAddr) { addresses.push("t1FakeAddressXxxxxxxxxxxxxxxxxxxxxxX"); push_new_addresses(done); }
      else genNewAddress(false, (addr)=> { addresses.push(addr); push_new_addresses(done); });
   }

   push_new_addresses( ()=>
   {
      var size=$('#suggestvot').val();
      if (size=='custom') size=$('#suggestvot2').val();

      var end=$('#endblock').val();
      if (end=='custom') end=$('#endblock2').val();

      var backtrack=$('#countvotes').val();
      if (backtrack=='custom') backtrack=$('#countvotes2').val();

      var data={
         "title":$('#polltitle').val(),
         "note":$('#polltext').val(),
         "options":options,
         "addresses":addresses,
         "logo_name":$('#logoname').text()||"",
         "logo_src":$('#logopreview img').attr('src')||"",
         "logo_txid":'',
         'backtrack':$.trim(backtrack),
         "refund":num($('#refundable').val(),0,true),
         "size":num(size,8,true),
         "shuffle":num($('#shuffle').val(),0,true),
         "endblock":num(end,0,true)
      }

      doneFunc(data);
   });
}

// -----------------------------------------------------------------------------------------

function upload_file_change()
{
   var t=this;
   var input = $(t);
	var label = input.next();
   var path=input.val();
   var file=path.split(/[\\\/]/).pop();

   var reset=function()
   {
      input.wrap('<form>').closest('form').get(0).reset();
      input.unwrap();
      label.html(label.data('label'));
      $('#logopreview').html('');
   }

   if (!file.match(/[.](png|jpg|gif)$/i)) reset();
	else
      if (t.files && t.files.length>0)
      {
         var reader  = new FileReader();
         reader.addEventListener("load", function ()
         {
            $('#logopreview').html('<img src="'+reader.result+'" width=220 class=hidden style="border: 1px solid transparent; margin-bottom: 10px; max-height: 220px;">');
            $('#logopreview img').off().on('error',reset).on('load',function()
            {
               if (this.naturalWidth>220) { reset(); alert('Selected image is too big. Image width must be equal or less than 220px'); return; }
               if (this.naturalHeight>220) { reset(); alert('Selected image is too big. Image height must be equal or less than 220px'); return; }
               $(this).show();
            });
            poll_change.call(t);
         }, false);
         reader.readAsDataURL(t.files[0]);

         label.html("<i class='fa fa-image'></i> &nbsp;<span id=logoname>"+htmlspecialchars(file)+"</span>");
      }

   poll_change.call(t);
}


function memos_generate(data)
{
   var memos=hexEncode(JSON_toString(data));
   memos=memos.match(/(.{1,510})/g);
   for (var i=0; i<memos.length; i++) memos[i]="F5"+hexEncode(String.fromCharCode(i))+memos[i];
   return memos;
}


function poll_change()
{
   var t=$(this);
   if (t.closest('#newvote').find('input[type="range"]').length>0) return poll_drag();

   // calculate poll size (memos) with fake addresses to estimate fee
   if (t.closest('#newvote').length>0)
   poll_data(false, (data)=>
   {
      var memos=memos_generate(data);
      var fee=memos.length*poll_fee;
      $('#pollcost').text(num(fee,0));
   })
}


function poll_hig(el)
{
   var inp=$('#'+el);
   inp.css({'border-color':'red', 'box-shadow':'rgba(189, 0, 0, 0.4) 0px 0px 7px 1px'});
   setTimeout(function(){ inp.css({'border-color':'', 'box-shadow':'none'}); },1000);
}

function poll_progress_show(msg)
{
   $('#pollprogressmsg').text(msg);
   $('#pollprogress').fadeIn(100);
}

function poll_progress_hide()
{
   $('#pollprogress').fadeOut(100);
}


function poll_start()
{
   // calculate poll size (memos) with fake addresses to estimate fee
   poll_data(false, (data)=>
   {
      if (data.title=='') return poll_hig("polltitle");
      if (data.options.length==1) return poll_hig("option2");
      if (data.options.length==0) return poll_hig("option1");
      if (data.endblock<totalblocks) return poll_hig("endblock2");
      var memos=memos_generate(data);
      var pollfee=memos.length*poll_fee;
      var sendfee=0; // 0.0001

      // this is way too big
      if (memos.length>50) return alert("This poll or campaign is too big. Please optimize your poll size, most likely the logo and try again.");

      // if size is too big, but still usable, warn user for confirmation (long time, high fees)
      if (memos.length>5 && !confirm("This poll or campaign requires "+memos.length+" shielded transactions to be published. It may take "
               +(memos.length*2)+" minutes or more to complete the operation, depending on the speed of your computer. Do you really want to proceed?")) return;

      // find suitable outgoing address with sufficient balance.
      var from="", i;
      if (from=='') for(i in transparent_addresses) if (transparent_addresses[i]>=pollfee+sendfee) { from=i; break; }

      // if not found, alert and quit
      if (from=='') return alert("Cannot find any Transparent address with sufficient balance of "+(pollfee+sendfee)+" VOT. You may need to group your coins to a single Transparent address and try again.");

      // get memos with real addresses
      poll_data(true, (data)=>
      {
         var memos=memos_generate(data);
         var txfee=pollfee/memos.length;
         var params=[];
         for(i=0; i<memos.length; i++) params.push({'address':poll_address,'amount':txfee,'memo':memos[i]});

         var payment_success=function(opid) // payment was accepted for processing, operation is in progress
         {
            poll_progress_show("Publishing, please wait...");
            operations[opid]={'report_poll_tx':true, 'amount':pollfee, 'zbalance': 0, 'creation_time':now()};
            update_operation_status();
            update_transactions();
            update_addresses();
            // payment is going to be processed. After it is sent with a txid,

         }

         main.rpc("z_sendmany",[from,params,0,sendfee], payment_success, function(e){ console.log(e); alert("Problem publishing, please try again. "+e); });
         // mark wallet uncloseable, z_sendmany to poll_address, note operationID, track its success, remember txid for poll, add to polls list
      });
   });
}


function poll_save(txid,data)
{
   polls[txid]=data;
   storage_save("polls",polls);
}


function poll_load(txid,doneFunc,waitmsg)
{
   if (polls[txid]) { poll_progress_hide(); return doneFunc(polls[txid]); }
   if (!waitmsg) waitmsg="Loading data...";
   poll_progress_show(waitmsg);

   main.rpc("gettransaction",[txid],function(e)
   {
       // transaction exists but is unconfirmed
      if (e.txid==txid && e.confirmations==0)
      {
          setTimeout(function(){ poll_load(txid,doneFunc,"Waiting for confirmation..."); },5000);
          return;
      }

      // transaction has a confirming block
      if (e.blockhash)
      main.rpc("getblock",[e.blockhash],function(b)
      {
         if (b.height)
         main.rpc("z_listreceivedbyaddress",[poll_address,-b.height],function(alltxs)
         {
            poll_progress_hide();
            var memos=[], i, ix;
            for (i=0; i<alltxs.length; i++) if (alltxs[i].txid==txid) memos.push(alltxs[i].memo);
            memos.sort(function(a,b){ a=a.substr(2,2); b=b.substr(2,2); if (a>b) return 1; if (b>a) return -1; return 0; });
            for (i=0; i<memos.length; i++) memos[i]=hexDecode(memos[i].substr(4));
            var data=JSON_fromString(memos.join(""));

            // sanity checks
            if (!data.options || data.options.length<2) return; // each poll must have at least two options
            if (!data.addresses || data.addresses.length!=data.options.length) return; // each poll must have as many addresses as options
            if (!data.title) return; // each poll must have title

            // find transaction index in confirming block
            for (ix=0; ix<b.tx.length; ix++) if (b.tx[ix]==txid) break;
            data.height=b.height;
            data.ix=ix;

            // reusable txid for logo
            if (data.logo_txid && data.logo_txid.match(/^[a-z0-9]{64}$/i))
               poll_load(data.logo_txid,function(ret)
               {
                  data.logo_src=ret.logo_src;
                  data.logo_name=ret.logo_name;
                  poll_save(txid,data);
                  doneFunc(data);
               });
            else
            {
               poll_save(txid,data);
               doneFunc(data);
            }
         },poll_progress_hide); else poll_progress_hide();
      },poll_progress_hide); else poll_progress_hide();
   },poll_progress_hide,true);
}


function poll_drag()
{
   // elements
   var t=$(this);
   if (!t.hasClass('polloptiondrag'))
   {
      if ($('.polloptiondrag').length<1) return;
      var random = Math.floor(Math.random()*$('.polloptiondrag').length);
      t=$('.polloptiondrag').eq(random);
   }

   var all=$('.polloptiondrag:not(#'+t.attr('id')+')');

   var max=t.attr('max');
   var current=t.val();
   var rest=max-current;
   var totalvot=num($('#pollsize').val(),8);
   if (totalvot==0) totalvot=num($('#pollsize2').val(),8);
   var precision=4;

   // split rest between all, preserving their current proportions
   var sum=0;
   all.each((ix,el)=>{ sum+=parseInt($(el).val()); });
   all.each(function(ix,el)
   {
      var e=$(el); var n=e.val()*rest/sum; if (isNaN(n)) n=Math.ceil(rest/all.length);
      e.val(Math.floor(n));
      var perc=e.prev().prev();
      perc.text(num(n/max*100,0,true)+"%");
      perc.css('left',((e.width()-32)*n/max+22-perc.width()/2)+'px');
      e.data('amount',num(totalvot*n/max,precision));
      perc.prev().text(e.data('amount')+" VOT");
   });

   sum=0;
   all.each((ix,el)=>{ sum+=parseInt($(el).val()); });
   var perc=t.prev().prev();
   perc.text(num((max-sum)/max*100,0,true)+"%")
   perc.css('left',((t.width()-32)*(max-sum)/max+22-perc.width()/2)+'px');
   t.data('amount',num(totalvot*(max-sum)/max,precision));
   perc.prev().text(t.data('amount')+" VOT");
   t.val(max-sum);
}


function poll_show_withprogress(txid)
{
   poll_progress_show("Loading data...");
   setTimeout(function(){ poll_show(txid); },500);
}


function poll_show(txid)
{
   $('#newvote').html('');
   poll_load(txid,function(data)
   {
      var i;
      var max=100000000;
      var url='http://pollexplorer.votecoin.site/'+data.height+":"+data.ix;
      var title='VoteCoin+Poll+Explorer';

      var options="";
      poll_dashboard(false);

      var ix=[];
      for (i=0; i<data.options.length; i++) if (data.options[i] && data.addresses[i]) ix.push(i);
      if (data.shuffle) array_shuffle(ix);

      for (i=0; i<ix.length; i++)
        options+="<div style='position: relative;' data-backtrack='"+htmlspecialchars(data.backtrack)+"'>"
                    +"<div style='font-size: 12px; position: absolute; right: 0; bottom: 39px; background-color: #e9e9e9; z-index:3; padding: 5px 0 0 5px;'></div>"
                    +"<div style='color: #fff; letter-spacinag: 0; font-size: 9px; pointer-events: none; position: absolute; left: 0; bottom: 18px;' class=polloptionsval></div>"
                    +"<div class=polloptiontitle style='width: calc(100% - 100px); position: relative; top: -1px;'>"+htmlspecialchars(data.options[ix[i]])+"</div>"
                    +"<input id=option"+i+" data-address='"+htmlspecialchars(data.addresses[ix[i]])+"' class=polloptiondrag type=range min=0 max="+max+">"
                 +"</div><br>";

      var votesize_precision=num(data.size,8,true).split(".")[1];
      if (votesize_precision) votesize_precision=votesize_precision.length; else votesize_precision=0;
      $('#newvote').html(""
                    +"<div style='font-size: 27px; margin-bottom: 10px; word-wrap: break-word;'>"+htmlspecialchars(data.title)+"</div>"
                    +"<div style='display: inline-block; width: calc(100% - 242px); margin-right: 20px; vertical-align: top;'>"
                       +"<div>"+options+"</div>"
                       +"<div style='margin-bottom: 6px; margin-top: 20px; margin-bottom: 20px; word-wrap: break-word;'>"+htmlspecialchars(data.note).replace(/\n/g,"<br>")+"</div>"
                    +"</div>"

                    +"<div style='display: inline-block; vertical-align: top; width: 222px; margin-top: 9px;'>"

                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=pollsize data-help='Size of your vote is the total amount of VOT you are willing to spend on this voting.'>"
                             +(
                                data.size!=0?
                                  "<option value='"+num(data.size,votesize_precision)+"'>Size of your vote: "+num(data.size,votesize_precision)+" VOT"
                                  +"<option value='"+num(data.size*2,votesize_precision)+"'>Size of your vote: "+num(data.size*2,votesize_precision)+" VOT"
                                  +"<option value='"+num(data.size*10,votesize_precision)+"'>Size of your vote: "+num(data.size*10,votesize_precision)+" VOT"
                                  :"<option>Size of your vote"
                               )
                              +"<option value=custom>Custom size...</select>"
                          +"<div style='position: relative;' class=hidden>"
                             +"<span class='fa fa-times nocustom' style='background-color: #ffffff; padding: 6px 9px 6px 9px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; none; color: #777;' data-help='next'></span>"
                             +"<input placeholder='"+num(data.size,votesize_precision)+" VOT' type=text style='width: 170px; padding-right: 40px;' id=pollsize2 data-help='Custom vote size.'>"
                          +"</div>"
                       +"</div><br>"

                       +"<div align=center id=endtimer data-endblock='"+num(data.endblock,0)+"'>"
                          +"<div>"
                          +"<div class=end1></div><div class=end2></div><div class=end3></div>"
                          +"</div>"
                          +"<div class=end1b>days</div><div class=end2b>hours</div><div class=end3b>mins</div>"
                       +"</div>"

                       +(data.refund==1?
                          "<div id=helpcontainer><div style='position: relative; top:13px; border-bottom: 1px dashed #666; z-index:1'></div>"
                          +"<div align=center><i class='fa fa-retweet' style='padding: 5px; background-color: #e9e9e9; color: #777; z-index:2; position: relative; top: -2px;'></i></div>"
                          +"<div align=justify style='font-size: 13px; line-height: 17px;'>Organizer of this poll or campaign promises to refund losing votes. This is not enforced by the protocol, so you need to decide if you trust the organizer to keep their promise.</div>"
                       :'')

                       +(data.refund==2?
                          "<div id=helpcontainer><div style='position: relative; top:13px; border-bottom: 1px dashed #666; z-index:1'></div>"
                          +"<div align=center><i class='fa fa-retweet' style='padding: 5px; background-color: #e9e9e9; color: #777; z-index:2; position: relative; top: -2px;'></i></div>"
                          +"<div align=justify style='font-size: 13px; line-height: 17px;'>Organizer of this poll or campaign promises to refund all votes, when certain conditions are met. "
                          +"Remember that this is not enforced by the protocol, so you need to decide if you trust the organizer to keep their promise.</div>"
                       :'')

                       +"<div style='display: inline-block; overflow: hidden; margin-top: 30px;'>"
                         +"<img id=logopreview style='border: 1px solid transparent; width: 220px; max-height: 220px;'>"
                       +"</div>"

                        +"<div style='display: inline-block; overflow: hidden; margin-left: 1px;' align=center>"
                           +'<a href="#" data-url="http://www.facebook.com/sharer/sharer.php?u='+url+'&title='+title+'" class="social fab fa-facebook-f"></a>'
                           +'<a href="#" data-url="http://twitter.com/intent/tweet?status='+title+'+'+url+'" class="social fab fa-twitter"></a>'
                           +'<a href="#" data-url="https://plus.google.com/share?url='+url+'" class="social fab fa-google"></a>'
                           +'<a href="#" data-url="http://www.linkedin.com/shareArticle?mini=true&url='+url+'&title='+title+'&source=votecoin.site" class="social fab fa-linkedin"></a>'
                       +"</div>"

                      +"<br><br><div id=polloptionhelp style='opacity: 0; width: 222px; height: 100px;'></div>"
                    +"</div>"
     );

     $('#voteid').text("#"+data.height+"#"+data.ix);
     $('#actionbutton').html("<button style='width: 222px;' id=dovote data-help='Vote now. This action costs the total amount of VOT listed above.'><i class='fa fa-play'></i> &nbsp;Vote now</button>");

     // if logo image is present, load it
     if (data.logo_src && data.logo_src.match(/^data:/)) $('#logopreview').attr('src',data.logo_src);

     // set default values for all options proportionally
     $('.polloptiondrag').val(max/ix.length);
     poll_drag();
     $('#newvote').css('opacity',0).delay(400).css('opacity',1);
     update_gui_polldate();
     scrollTop();
   });
}


function poll_success(txid)
{
   my_pollids[txid]=true;
   poll_progress_show("Waiting for confirmation...");
   poll_show(txid);
}


function poll_id(txid)
{
   txid=$.trim(txid);

   if (txid.match(/^[0-9a-f]{64}$/i)) // transaction id
   {
      poll_show_withprogress(txid);
      return;
   }

   var bix=txid.match(/^#*([0-9]+)[-@#/:.]([0-9]+)$/);
   if (bix) // block id - tx index
   {
      main.rpc("getblockhash",[parseInt(bix[1])],function(hash){
         if (hash)
         main.rpc("getblock",[hash],function(block){
            var tx=block.tx[parseInt(bix[2])];
            if (tx) poll_show_withprogress(tx);
         });
      });
   }
}

function poll_vote(totalvot,fee,fromAddress)
{
   var i;
   var send=[];
   var options=$('.polloptiondrag');

   for (i=0; i<options.length; i++) if ($(options[i]).data('amount')>0) send.push({'address':$(options[i]).data('address').replace(/[^a-zA-Z0-9]/,""), 'amount':$(options[i]).data('amount')});

   for(i in transparent_addresses) if (transparent_addresses[i]>=totalvot+fee && (!fromAddress || i==fromAddress) )
   {
      poll_progress_show("Vote in progress...");
      main.rpc("z_sendmany",[i,send,0,fee], poll_results);
      return;
   }
   alert("Can't find any transparent address with sufficient balance. You need "+(totalvot+fee)+" VOT");
}


function poll_vote_backtrack()
{
   var totalvot=num($('#pollsize').val(),8);
   if (totalvot==0) totalvot=num($('#pollsize2').val(),8);
   if (totalvot==0) return alert("Please specify your total vote size");
   var fee=0; // 0.0001

   var backtrack=$('.polloptiondrag').first().parent().data('backtrack');
   if (backtrack!='')
   {
      poll_progress_show("Searching for sending address...");
      find_trackable_address(backtrack,totalvot+fee,function(addr)
      {
         if (!addr) { poll_progress_hide(); setTimeout(function(){ alert("This voting only accepts coins distributed by the organizer. Such coins were not found in your wallet. Required is "+num(totalvot+fee,8,true)+" VOT, which you receive from "+backtrack);},500); }
         else poll_vote(totalvot,fee,addr);
      })
   }
   else
      poll_vote(totalvot,fee);
}


function poll_results(txid)
{
   poll_progress_show("Loading results...");
   setTimeout(function() // just for effect
   {
      $.get("http://pollexplorer.votecoin.site/api/",{"method":"results","txid":txid},function(res)
      {
         res=JSON_fromString(res);

         var labels="";
         var data=[];
         var ix,i,ii=0;
         var total=0;
         var items=0;
         var col,val;

         var chartColors=[];
         var borders=[];
         var colors=['#ff755c','#ff4181','#3b8bc0','#4eb9ff','#85c250','#c9d467','#ffce47','#ffb14e'];
//         var colors=[ '#61c478','#4da338','#76ce38','#d9ec38','#fbe739','#f3af2f','#ee7b28','#ea3a22','#cf4384','#bb6bce','#935bcd','#8b7aeb','#899ee8','#3982d2','#a6d9fd','#75b6d2','#93dadc' ];


         for(i in res) { total+=parseFloat(res[i]); items++; }

         for(i in res)
         {
            ix=polls[txid]['addresses'].indexOf(i);
            val=num(res[i]/total*100,0);
            col=colors[Math.floor(ii*(colors.length/items)) % colors.length];
            labels+="<div id=chartlabel"+ii+">"
                       +"<div style='width: 15px; height: 15px; background-color: "+col+"; margin-right: 5px; position: relative; top: 2px; display: inline-block'></div>"
                       +"<div style='display: inline-block; height: 15px; line-height: 15px;'>"+num(res[i],8,true)+" VOT ("+val+"%)</div>"
                       +"<div style='font-size: 12px; line-height: 15px; margin-top: 3px;'>"+htmlspecialchars(polls[txid]['options'][ix])+"</div>"
                   +"</div><br>";
            data.push(val);
            chartColors.push(col);
            borders.push('#e9e9e9');
            ii++;
         }

// if (items==0) no votes received, print message instead
         $('#newvote').html(''
            +'<div style="font-size: 27px; margin-bottom: 10px; word-wrap: break-word;">'+polls[txid]['title']+'</div>'
            +'<div style="float: left; width: calc(100% - 340px); margin: 50px; margin-top: 20px; "><canvas id="votechart" width="400" height="400"></canvas></div>'
            +'<div style="float: left; width: 222px; margin-left: 18px; word-wrap: break-word;" id=chartlabels>'
               +labels
               +(polls[txid].endblock>blocks?
               "<div align=center id=endtimer data-endblock='"+num(polls[txid].endblock,0)+"' style='margin-top: 30px;'>"
                  +"<div>"
                  +"<div class=end1></div><div class=end2></div><div class=end3></div>"
                  +"</div>"
                  +"<div class=end1b>days</div><div class=end2b>hours</div><div class=end3b>mins</div>"
               +"</div>"
               :"")
            +'</div>'

         );
         scrollTop();
         update_gui_polldate();

         var ctx = document.getElementById("votechart");
         var myPie = new Chart(ctx,
         {
           type: 'doughnut',
           options: {
              animation: {animateRotate:false, animateScale:true}, cutoutPercentage: 50, title: { display: false}, tooltips: {enabled:false}, legend: { display: false } },
              data: { datasets: [{ label: "", data: data, backgroundColor: chartColors, borderColor: borders, borderWidth: 1 }] }
         });

         ctx.onmousemove = function(evt)
         {
            var el = myPie.getElementsAtEvent(evt);
            var ix;
            if (el[0]) ix=el[0]._index;
            if (typeof ix != "undefined")
            {
               $('#chartlabels').children().removeClass('hovered');
               $('#chartlabel'+ix).addClass('hovered');
               // highlight index ix!
            }
         }

         poll_progress_hide();
         poll_dashboard(false);
         $('#actionbutton').html("<button style='width: 222px;' id=vote>Voting still active</button>");

      }).fail(poll_progress_hide);
   },500);
}
