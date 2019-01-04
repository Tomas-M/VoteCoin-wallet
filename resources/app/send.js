/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/

function genNewAddress(shielded, doneFunc)
{
    var prefix="";
    if (shielded) prefix="z_";
    main.rpc(prefix+"getnewaddress",(shielded?["sapling"]:""),function(addr)
    {
        if (shielded)
        {
           if (typeof shielded_addresses[addr] != "undefined") return genNewAddress(shielded, doneFunc);
           shielded_addresses[addr]=0;
           storage_save("zaddresses",shielded_addresses);
        }
        else
        {
           if (typeof transparent_addresses[addr] != "undefined") return genNewAddress(shielded, doneFunc);
           transparent_addresses[addr]=0;
           storage_save("taddresses",transparent_addresses);
        }

        doneFunc(addr);
    },function(e){ alert("Could't generate address. Please make sure your wallet is not busy and try again."); })
}

function setLabel(addr,label)
{
   labels[addr]=label;
   storage_save("labels",labels);
   update_gui();
}

function getLabel(addr,allowEmpty)
{
   if (labels[addr]) return labels[addr];
   if (allowEmpty) return '';
   return addr;
}


function maxSendAmount()
{
   var i;
   var amount=0;
   var fee=parseFloat($('#fee').val()); if (isNaN(fee)) fee=0;
   var from=$('#choosefrom').val();

   if (from=='t') for(i in transparent_addresses) amount+=transparent_addresses[i];
   else if (from=='z') { for(i in shielded_addresses) if (shielded_addresses[i]>amount) amount=shielded_addresses[i]; }
   else if (isTransparent(from)) amount=transparent_addresses[from];
   else amount=shielded_addresses[from];

   amount=amount-fee;
   $('#amount').val(num(amount,8,true));
}


function isTransparent(addr) { return addr.substr(0,1)=='t'; }
function isShielded(addr) { return !isTransparent(addr); }
function reset_sendform() {} // TODO

function sendpayment()
{
     var i;
     var from=$('#choosefrom').val();
     var to=$('#sendto').val();
     var amount=parseFloat($('#amount').val()); if (isNaN(amount)) amount=0;
     var fee=parseFloat($('#fee').val()); if (isNaN(fee)) fee=0;
     var memo=hexEncode($.trim($('#memo').val()));
     var zbalance=0;

     function payment_failure(err)
     {
        if (err.error) err=err.error;
        if (err.message) err=err.message;
        operations[now(true)]={'amount':amount, 'creation_time':now(), 'finished':true, 'status':"failed", 'error':{'message':err}}
     }

     function payment_success(res)
     {
        console.log(res);
        if (res.match(/^opid-/)) { operations[res]={'amount':amount, 'zbalance': zbalance, 'creation_time':now()}; update_operation_status(); }
        else operations[now(true)]={'amount':amount, 'zbalance': zbalance, 'txid':res, 'creation_time':now(), 'finished':true, 'status':"success"}
        update_transactions();
        update_addresses();
        reset_sendform();
     }

     if (amount==0) return payment_failure("Amount must be greater than zero");
     var param={'address':to,'amount':amount};
     if (memo) param['memo']=memo;

     if (from=='t') // auto-select transparent FROM address
     {
        for(i in transparent_addresses) if (transparent_addresses[i]>=amount+fee)
        {
           main.rpc("z_sendmany",[i,[param],0,fee], payment_success,payment_failure);
           return;
        }
        payment_failure("Can't find any transparent address with sufficient balance.");
     }
     else
     if (from=='z') // auto-select shielded FROM address
     {
        for(i in shielded_addresses) if (shielded_addresses[i]>=amount+fee)
        {
           zbalance=shielded_addresses[i];
           main.rpc("z_sendmany",[i,[param],1,fee], payment_success,payment_failure);
           return;
        }
        payment_failure("Can't find any transparent address with sufficient balance.");
     }
     else // one particular transparent or shielded address selected, try the payment as is
     {
         zbalance=shielded_addresses[from];
         main.rpc("z_sendmany",[from,[param],isTransparent(from)?0:1,fee], payment_success,payment_failure);
     }
}
