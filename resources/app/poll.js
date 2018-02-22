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

function show_new_poll(ev)
{
   var btn=$(this);
   if (btn.data('prevtext')) // clicking on Cancel button
   {
      btn.html(btn.data('prevtext')).removeClass('cancel');
      btn.data('prevtext','');

      $('#pollfilter').show();
      $('#votelist').show();
      $('#newvote').hide();
   }
   else // clicking on New poll button
   {
      btn.data('prevtext',btn.html());
      btn.html('<span class="fa fa-times"></span> Cancel').addClass('cancel');
      var bPerDay=1440/2.5; // average blocks per day

      $('#pollfilter').hide();
      $('#votelist').hide();
      $('#newvote').show();
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
                       +"<div><button style='width: 222px;' id=startpoll data-help='Start the poll or campaign by publishing it in the blockchain. This action costs a fee depending on total amount of data published. The biggest part is usually the logo, so keep it small or skip using it to save on fees.'><i class='fa fa-play'></i> &nbsp;Start, <span id=pollcost>10</span> VOT</button></div>"
                       +"<br><div id=polloptionhelp style='opacity: 0; width: 222px; height: 100px;'></div>"
                    +"</div>"
                 );
      $('#polltitle').focus();
   }
}


function add_poll_option()
{
    var el=$('#options');
    var i=el.find('input').length+1;
    $("<input style='display: none; opacity: 0;' id=option"+i+" type=text placeholder='Option or answer "+i+"'>").appendTo(el).slideDown(100).fadeTo(200,1);
    if (i>2) $('#rmoption').fadeIn(); else $('#rmoption').fadeOut();
}


function rm_poll_option()
{
    var el=$('#options');
    var i=el.find('input').length;
    if (i<=2) return;
    el.find('input').last().fadeTo(200,0,function(){ $(this).slideUp(100,function(){ $(this).remove(); poll_change(); }); });
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
         "opt":options,
         "adr":addresses,
         "logoname":$('#logoname').text()||"",
         "logoimg":$('#logopreview img').attr('src')||"",
         "logotx":'',
         'backtrack':$.trim(backtrack),
         "refund":num($('#refundable').val(),0,true),
         "size":num(size,0,true),
         "shuffle":num($('#shuffle').val(),0,true),
         "end":num(end,0,true)
      }

      doneFunc(data);
   });
}

// -----------------------------------------------------------------------------------------

function upload_file_change()
{
   var input = $(this);
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
      if (this.files && this.files.length>0)
      {
         var reader  = new FileReader();
         reader.addEventListener("load", function () { $('#logopreview').html('<img src="'+reader.result+'" width=220 class=hidden style="border: 1px solid transparent; margin-bottom: 10px;">');  $('#logopreview img').off().on('error',reset).on('load',function(){$(this).show();}); poll_change(); }, false);
         reader.readAsDataURL(this.files[0]);

         label.html("<i class='fa fa-image'></i> &nbsp;<span id=logoname>"+htmlspecialchars(file)+"</span>");
      }

   poll_change();
}


function memos_generate(data)
{
   var memos=JSON_toString(data);
   memos=memos.match(/(.{1,510})/g);
   for (var i=0; i<memos.length; i++) memos[i]="F5"+hexEncode(String.fromCharCode(i))+hexEncode(memos[i]);
   return memos;
}


function poll_change()
{
   // calculate poll size (memos) with fake addresses to estimate fee
   poll_data(false, (data)=>
   {
      var memos=memos_generate(data);
      var fee=memos.length*poll_fee;
      $('#pollcost').text(fee);
   })
}


function poll_hig(el)
{
   var inp=$('#'+el);
   inp.css({'border-color':'red', 'box-shadow':'rgba(189, 0, 0, 0.4) 0px 0px 7px 1px'});
   setTimeout(function(){ inp.css({'border-color':'', 'box-shadow':'none'}); },1000);
}


function start_poll_log(msg,ico)
{
   $('#makepolllog').append("<div><i class='fa fa-"+ico+"'></i> "+msg+"</div>");
}


function start_poll()
{
   // calculate poll size (memos) with fake addresses to estimate fee
   poll_data(false, (data)=>
   {
      if (data.title=='') return poll_hig("polltitle");
      if (data.opt.length==1) return poll_hig("option2");
      if (data.opt.length==0) return poll_hig("option1");
      if (data.end<totalblocks) return poll_hig("endblock2");
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
      if (from=='') for(i in shielded_addresses) if (shielded_addresses[i]>=pollfee+sendfee) { from=i; break; }

      // if not found, alert and quit
      if (from=='') return alert("Cannot find any address with sufficient balance of "+(pollfee+sendfee)+" VOT. You may need to group your coins to a single address.");
      var zbalance=shielded_addresses[from]||0;

      // get memos with real addresses
      poll_data(true, (data)=>
      {
         var memos=memos_generate(data);
         var txfee=pollfee/memos.length;
         var params=[];
         for(i=0; i<memos.length; i++) params.push({'address':poll_address,'amount':txfee,'memo':memos[i]});

         var payment_success=function(opid) // payment was accepted for processing, operation is in progress
         {
            operations[opid]={'report_poll_tx':true, 'amount':txfee, 'zbalance': zbalance, 'creation_time':now()};
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

/*

main.rpc("gettransaction",["c2f2185704ffd8c756d8858b35128d86d7ba094af66fd175ec87d8a9be71d84c"],function(e){
   main.rpc("getblock",[e.blockhash],function(b){
      main.rpc("z_listreceivedbyaddress",[poll_address,-b.height],function(c){
         console.log(c);
      });
   });
});
*/
