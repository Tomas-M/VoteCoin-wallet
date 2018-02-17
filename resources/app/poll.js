
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
                       +"<input id=polltitle type=text placeholder='Poll title or question' style='font-size: 17px;'>"
                       +"<textarea style='font-family: Arial; height: 66px; margin-bottom: 6px;' rows=3 id=polltext placeholder='Poll description or public note (optional)'></textarea>"
                       +"<div id=options>"
                       +"<input id=option1 type=text placeholder='Option or answer 1'>"
                       +"<input id=option2 type=text placeholder='Option or answer 2'>"
                       +"<input id=option3 type=text placeholder='Option or answer 3'>"
                       +"</div>"

                       +"<button id=addoption>+ more options</button>"
                       +"&nbsp;<button id=rmoption>- less options</button>"
                    +"</div>"

                    +"<div style='display: inline-block; vertical-align: top;'>"
                       +"<div id=logopreview></div>"
                       +"<div style='display: inline-block; overflow: hidden; white-space: nowrap; width: 222px;'>"
                          +"<input type=file id=polllogo><label for='polllogo' style='width: 202px; font-size: 14px; line-height: 19px;' class=forfile data-label='<i class=\"fa fa-image\"></i> &nbsp;Choose a logo (220px)'><i class='fa fa-image'></i> &nbsp;Choose a logo (220px)</label>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 185px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=refundable><option value=0>Non-refundable votes<option value=1>Refundable losing votes<option value=2>Refundable all votes</select>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=minimumvot><option value=0>Accept votes of all sizes<option value=1>Minimum vote size 1 VOT<option value=10>Minimum vote size 10 VOT<option disabled>Custom minimum vote size</select>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=shuffle><option value=0>Keep options in this order<option value=1>Shuffle options for each user</select>"
                       +"</div><br>"
                       +"<div style='position: relative; display: inline-block; overflow: hidden;'>"
                          +"<span class='fa fa-caret-down' style='background-color: #ffffff; padding: 6px 10px 6px 12px; position: absolute; top: 5px; left: 187px; border-left: 1px solid #ddd; pointer-events: none; color: #777;'></span>"
                          +"<select style='width: 222px;' id=endblock><option value="+(totalblocks+bPerDay*7)+">One week duration<option value="+(totalblocks+bPerDay*14)+">Two weeks duration<option value="+(totalblocks+bPerDay*21)+">Three weeks duration<option value="+(totalblocks+bPerDay*30)+">One month duration<option value="+(totalblocks+bPerDay*60)+">Two month duration<option disabled>Custom final block height</select>"
                       +"</div><br>"
                       +"<button style='width: 222px;'><i class='fa fa-play'></i> &nbsp;Start poll, <span id=pollcost>1110</span> VOT</button>"
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
    el.find('input').last().fadeTo(200,0,function(){ $(this).slideUp(100,function(){ $(this).remove()}); });
    if (i>3) $('#rmoption').fadeIn(); else $('#rmoption').fadeOut();
}


function poll_add_from_blockchain(txid,memo)
{
   console.log(txid,memo);
   storage_save('polls',polls);
}


function import_viewing_keys()
{
   main.rpc("z_importviewingkey",[poll_viewkey,"whenkeyisnew"],function(res){console.log(res);},function(res){console.log(res)});
}

function list_polls_received()
{
   main.rpc("z_listreceivedbyaddress",[poll_address,0],(res)=>
   {
      for (var i=0; i<res.length; i++)
         if (res[i].amount>=poll_fee)
            poll_add_from_blockchain(res[i].txid,res[i].memo);
   },function(ret){console.log(ret);});
}


function poll_data(genAddr)
{
   var options=[];
   $('#options input').each(function(ix,el){ if ($.trim($(el).val())!='') options.push($.trim($(el).val())); });

   var addresses=[];

   var push_new_addresses=function(doneFunc)
   {
      if (addresses.length>=options.length) return doneFunc();
      if (!genAddr) { addresses.push("t1FakeAddressXxxxxxxxxxxxxxxxxxxxxxX"); push_new_addresses(doneFunc); }
      else main.rpc("getnewaddress",[], (addr)=> { addresses.push(addr); push_new_addresses(doneFunc); });
   }

   push_new_addresses( ()=>{
      var data={
         "title":$('#polltitle').val(),
         "note":$('#polltext').val(),
         "opt":options,
         "adr":addresses,
         "logo":$('#logopreview img').attr('src')||"",
         "refund":num($('#refundable').val(),0,true),
         "min":num($('#minimumvot').val(),0,true),
         "shuffle":num($('#shuffle').val(),0,true),
         "end":num($('#endblock').val(),0,true)
      }

      console.log(data);
   });
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
