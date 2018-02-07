
function importBtnClick()
{
   var key=$.trim($('#privimp').val().replace(/#.*/,""));
   if (key=='') { alert("Please enter private key first"); return; }
   if (!confirm("Importing of the private key requires VoteCoin wallet to rescan the entire blockchain to find any previous transactions involving the newly imported address. This may take several minutes or longer. Are you sure to proceed now?")) return;

   gui_show('progress');

   okfunc=function()
   {
      isInitialized=false;
      setTimeout(function()
      {
         $('#progress').show();
         $('#progressmessage').html("<div style='margin-bottom: 40px; margin-top: 40px'>"
                                      +"<span class='fa fa-cog' style='color: #ddd; animation:spin 5s linear infinite; font-size: 150px;'></span>"
                                   +"</div>"
                                   +"VoteCoin wallet is rescanning, please wait...");

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

   // try to import as transparent key first
   main.rpc('importprivkey',[key,'',true],function(res){ okfunc(); },function(res)
   {
      // importprivkey goes to failuire if it succeeded, and original request string is passed as param
      if (res && res.error && res.error.message) alert(res.error.message);
      else try { res=JSON.parse(res); if (res.method=="importprivkey") okfunc(); } catch(e){ }
      return;

      // if importing key as a transparent key failed, try to import it as shielded key
      main.rpc('z_importkey',[key],function(res){ okfunc(); },function(res){
         gui_show('backup');
         alert(res.error.message);
      });
   });
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
            else out+="\n# Private keys for Shielded addresses are not supported yet\n\n";
//            else out+="\n# Private keys for Shielded addresses\n\n";
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
// we are not going to support exporting of shielded priv keys since importing back makes troubles yet, blame zcash!
//   for (i in shielded_addresses) addresses.push({'address':i, 'balance':shielded_addresses[i]});

   update_export_address(0);
}
