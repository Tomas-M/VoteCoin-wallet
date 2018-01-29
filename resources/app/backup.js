
function importBtnClick()
{
   alert('not implemented yet')
}


function exportBtnClick()
{
   var i;
   var addresses=[];

   update_export_address=function(n)
   {
      if (n>=addresses.length)
      {
         var out='';
         for (i=0; i<addresses.length; i++) out+=addresses[i].privkey+" # addr="+addresses[i].address+" # "+num(addresses[i].balance,8)+" VOT \n";
         $('#privkeys').val(out);
         return;
      }

      var addr=addresses[n];
      if (addr.address.substr(0,1)=='z') main.rpc("z_exportkey",[addr.address],function(res){ addresses[n].privkey=res; update_export_address(n+1); });
      else main.rpc("dumpprivkey",[addr.address],function(res){ addresses[n].privkey=res; update_export_address(n+1); });
   }

   for (i in transparent_addresses) addresses.push({'address':i, 'balance':transparent_addresses[i]});
   for (i in shielded_addresses) addresses.push({'address':i, 'balance':shielded_addresses[i]});

   update_export_address(0);
}
