
var z_track = storage_load('z_track');
$('#ztrack').prop('checked',z_track);

function ztrack_toggle()
{
   z_track=$('#ztrack').is(':checked')?1:0;
   storage_save('z_track',z_track);
}



// ------------------------------------------------------------------------------

function resend_mempool_transactions()
{
   // get all transaction IDs from mempool
   main.rpc("getrawmempool", [], (mempool)=>
   {
      $('#rebroadcastclicked').text("Rebroadcasted "+mempool.length+" transactions. "+humanReadableDate(now()));

      for (var i=0; i<mempool.length; i++)
      {
         // get raw trasnaction data
         main.rpc("getrawtransaction", [mempool[i]], (raw)=>
         {
            // resend transaction
            main.rpc("sendrawtransaction", [raw], (ret)=> { });
         });
      }
   });
}
