
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
         var out="# Private keys for Transparent addresses\n\n";
         for (i=0; i<addresses.length; i++)
         {
            if (addresses[i].privkey) out+=addresses[i].privkey+" # addr="+addresses[i].address+" # "+num(addresses[i].balance,8)+" VOT \n";
            else out+="\n# Private keys for Shielded addresses\n\n";
         }
         $('#privkeys').val(out);
         return;
      }

      var addr=addresses[n];
      if (addr.address.substr(0,1)=='z') main.rpc("z_exportkey",[addr.address],function(res){ addresses[n].privkey=res; update_export_address(n+1); });
      else if (addr.address.substr(0,1)=='t') main.rpc("dumpprivkey",[addr.address],function(res){ addresses[n].privkey=res; update_export_address(n+1); });
      else update_export_address(n+1);
   }

   for (i in transparent_addresses) addresses.push({'address':i, 'balance':transparent_addresses[i]});
   addresses.push({'address':''});
   for (i in shielded_addresses) addresses.push({'address':i, 'balance':shielded_addresses[i]});

   update_export_address(0);
}
