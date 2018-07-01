/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/

var z_track = storage_load('z_track',1);
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
      $('#rebroadcastclicked').text("Rebroadcasted "+mempool.length+" transactions.").css('opacity',0).fadeTo(500,1);
      setTimeout(function(){ $('#rebroadcastclicked').fadeTo(500,0); },3000);

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

// ------------------------------------------------------------------------------

function cleanup()
{
   transparent_addresses={};
   storage_save('taddresses',transparent_addresses);
   shielded_addresses={};
   storage_save('zaddresses',shielded_addresses);

   operations={};
   storage_save('operations',operations);

   transactions=[];
   storage_save('transactions',transactions);
   reset_transactions_list=true;

   $('#cleanupclicked').text("Cleanup and refresh complete.").css('opacity',0).fadeTo(500,1);
   setTimeout(function(){ $('#cleanupclicked').fadeTo(500,0); },3000);
}
