
function importBtnClick()
{
   var key=$.trim($('#privimp').val());
   if (key=='') { alert("Please enter private key first"); return; }
   if (!confirm("Importing of the private key requires VoteCoin wallet to rescan the entire blockchain to find any previous transactions involving the newly imported address. This may take several minutes or longer. Are you sure to proceed now?")) return;

   gui_show('progress');

   if (key.substr(0,2)=='SK') main.rpc('z_importkey',[key],function(res){ console.log(res); },function(res){ console.log(res); });
   else main.rpc('importprivkey',[key,'',true],function(res){ console.log(res); },function(res){ console.log(res); });

   setTimeout(function()
   {
      $('#progress').show();
      $('#progressmessage').html("<div style='margin-bottom: 40px; margin-top: 40px'>"
                                   +"<span class='fa fa-cog' style='color: #ddd; animation:spin 5s linear infinite; font-size: 150px;'></span>"
                                +"</div>"
                                +"VoteCoin wallet is rescanning, please wait...");

      isInitialized=false;
      wait_for_wallet().then(()=>
      {
         isInitialized=true;
         $('#privimp').val('');
         update_transactions();
         update_addresses();
         gui_show('dashboard');
      });
   }, 300);
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
