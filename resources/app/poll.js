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
      var html=$(e.target).data('help')||"";
      if (html) html="<div id=helpcontainer><div style='position: relative; top:13px; border-bottom: 1px dashed #666; z-index:1'></div><div align=center><i class='fa fa-info-circle' style='padding: 5px; background-color: #e9e9e9; color: #777; z-index:2; position: relative;'></i></div><div align=justify style='font-size: 14px;'>"+html+"</div></div>";
      else return;
      $('#polloptionhelp').html(html);
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
                       +"<input id=polltitle type=text placeholder='Poll or campaign title or question' style='font-size: 17px;'>"
                       +"<textarea style='font-family: Arial; height: 66px; margin-bottom: 6px;' rows=3 id=polltext placeholder='Description or public note (optional)'></textarea>"
                       +"<div id=options>"
                       +"<input id=option1 type=text placeholder='Option or answer 1'>"
                       +"<input id=option2 type=text placeholder='Option or answer 2'>"
                       +"<input id=option3 type=text placeholder='Option or answer 3'>"
                       +"<input id=option4 type=text placeholder='Option or answer 4'>"
                       +"<input id=option5 type=text placeholder='Option or answer 5'>"
                       +"</div>"

                       +"<button id=addoption>+ more options</button>"
                       +"&nbsp;<button id=rmoption>- less options</button>"
                    +"</div>"

                    +"<div style='display: inline-block; vertical-align: top;'>"
                       +"<div id=logopreview></div>"
                       +"<div style='display: inline-block; overflow: hidden; white-space: nowrap; width: 222px;'>"
                          +"<input type=file id=polllogo><label data-help='Using a logo image is optional. Choose a small image file from disk. Make sure its width is 220 pixels. File size affects the costs, so you should optimize your image before publishing. Reasonable size is ~ 2 KB. Transparent background is recommended.'"
                             +" for='polllogo' style='width: 202px; font-size: 14px; line-height: 19px;' class=forfile data-label='<i class=\"fa fa-image\"></i> &nbsp;Choose a logo (220px)'><i class='fa fa-image'></i> &nbsp;Choose a logo (220px)</label>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 185px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=refundable data-help='Refund is not guaranteed by the protocol. This setting only indicates whether the publisher (you) promises to refund votes (either losing or all or none) when the poll or campaign is over.'>"
                             +"<option value=0>Non-refundable votes<option value=1>Refundable losing votes<option value=2>Refundable all votes</select>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=minimumvot data-help='Minimum vote size is not a consensus rule but a local wallet rule, to encourage users to spend certain amount on each vote.'>"
                             +"<option value=0>Accept votes of all sizes<option value=1>Minimum vote size 1 VOT<option value=10>Minimum vote size 10 VOT<option disabled>Custom minimum vote size</select>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=shuffle data-help='The order in which options are presented to the user can strongly influence results. Use this setting to specify how everyone sees the options - either in the predefined order, or randomly shuffled.'>"
                              +"<option value=0>Keep options in this order<option value=1>Shuffle options for each user</select>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=endblock data-help='When the duration is specified in weeks or months, the system calculates target block height automatically. Only votes confirmed by the target block or earlier are counted towards the final results.'>"
                              +"<option value="+(totalblocks+bPerDay*7)+">One week duration<option value="+(totalblocks+bPerDay*14)+">Two weeks duration<option value="+(totalblocks+bPerDay*21)+">Three weeks duration<option value="+(totalblocks+bPerDay*30)+">One month duration<option value="+(totalblocks+bPerDay*60)+">Two months duration<option disabled>Custom final block height</select>"
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
   main.rpc("z_importviewingkey",[poll_viewkey,"whenkeyisnew"],function(res){console.log(res);},function(res){console.log(res)});
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
      else main.rpc("getnewaddress",[], (addr)=> { addresses.push(addr); push_new_addresses(done); });
   }

   push_new_addresses( ()=>{
      var data={
         "title":$('#polltitle').val(),
         "note":$('#polltext').val(),
         "opt":options,
         "adr":addresses,
         "logoname":$('#logoname').text()||"",
         "logoimg":$('#logopreview img').attr('src')||"",
         "logotx":false,
         "refund":num($('#refundable').val(),0,true),
         "min":num($('#minimumvot').val(),0,true),
         "shuffle":num($('#shuffle').val(),0,true),
         "end":num($('#endblock').val(),0,true)
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


function start_poll()
{
   // calculate poll size (memos) with fake addresses to estimate fee
   poll_data(false, (data)=>
   {
      var memos=memos_generate(data);
      var fee=memos.length*poll_fee;
      // if size is too big, warn user for confirmation (long time, high fees)
      if (memos.length>5 && !confirm("This poll or campaign requires "+memos.length+" transactions to publish. It may take "
                              +(memos.length*2)+" minutes or more to complete the operation. Do you really want to proceed?")) return;
   });

   // find suitable outgoing address with sufficient balance
   // if not found, alert and quit
   // get memos with real addresses
   // mark wallet uncloseable, z_sendmany to poll_address, note operationID, track its success, remember txid for poll, add to polls list
}

/*

main.rpc("gettransaction",["a201d624fc83fba51ce0bd6efa9f6c91d7589faaf4dc9fc52f9f60b7ea45dc51"],function(e){
   main.rpc("getblock",[e.blockhash],function(b){
      main.rpc("z_listreceivedbyaddress",["zccCAFqtwd6wigJMcHny7FgsYq1kLWfvr4F6VJZfQji378qaPeE5SkJhTPZ1J38TwZoUhk3MND335Aw9KazBNuvUHwpRnXs",-b.height],function(c){
         console.log(c);
      });
   });
});
*/
