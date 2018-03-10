/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/

function getTransaction(txid, doneFunc)
{
   main.rpc("getrawtransaction",[txid,1],function(tx)
   {
      var i;
      var ins=[];
      var outs=[];

      for (i=0; i<tx.vout.length; i++)
         if (tx.vout[i].scriptPubKey && tx.vout[i].scriptPubKey.addresses.length==1)
            outs[i]=tx.vout[i].scriptPubKey.addresses[0];

      for (i=0; i<tx.vin.length; i++) if (tx.vin[i].txid) ins.push({'txid':tx.vin[i].txid, 'vout':tx.vin[i].vout});

      doneFunc({'txid':txid, 'vin':ins, 'vout':outs});
   });
}


function inputsOfinputs(vins, quitOnEmptyInput, doneFunc)
{
   var ret=[];
   var copy=vins.slice(0);

   var inputOne=function(doneFunc, quitOnEmptyInput)
   {
      var tx=copy.pop();
      if (!tx) return doneFunc(ret); // we are at the end
      getTransaction(tx.txid, function(tr)
      {
         if (tr.vin.length==0 && quitOnEmptyInput) return doneFunc(false); // failure
         for (var i=0; i<tr.vin.length; i++) ret.push(tr.vin[i]);
         inputOne(doneFunc, quitOnEmptyInput);
      })
   }
   inputOne(doneFunc, quitOnEmptyInput);
}


function inputAddresses(vins, doneFunc)
{
   var ret=[];
   var copy=vins.slice(0);

   var inputOne=function(doneFunc)
   {
      var tx=copy.pop();
      if (!tx) return doneFunc(ret); // we are at the end
      if (tx.address) return inputOne(doneFunc); // continue with next tx if address is already known
      getTransaction(tx.txid, function(tr)
      {
         ret.push({'txid':tx.txid, 'vout':tx.vout, 'address':tr.vout[tx.vout]});
         inputOne(doneFunc);
      })
   }
   inputOne(doneFunc);
}


function detectTrackableInputs(vins, backtrack_address, doneFunc)
{
   inputsOfinputs(vins,true,function(ins)
   {
      if (ins===false) return doneFunc(false);
      inputAddresses(ins, function(addresses)
      {
         var remaining=[];
         if (addresses.length==0) return doneFunc(false);

         for (var i=0; i<addresses.length; i++)
         {
            if (!addresses[i].address) return doneFunc(false);
            if (addresses[i].address!=backtrack_address) remaining.push(addresses[i]);
         }
         if (remaining.length==0) doneFunc(true);
         else detectTrackableInputs(remaining, backtrack_address, doneFunc);
      });
   });
}


function find_trackable_address(backtrack_address, minBalance, doneFunc)
{
   main.rpc("listunspent",[1],function(list)
   {
      // create a list of unspent transactions
      var addresses={};
      var i;

      for (i=0; i<list.length; i++) if (list[i].spendable && list[i].address)
      {
         addresses[list[i].address]=addresses[list[i].address] || [];
         addresses[list[i].address].push({'txid':list[i].txid,'vout':list[i].vout});
      }

      var keys=Object.keys(addresses);
      var inputOne=function(doneFunc)
      {
         var address=keys.pop();
         if (!address) return doneFunc(); // nothing found, call doneFunc without argument
         detectTrackableInputs(addresses[address], backtrack_address, function(ret)
         {
            if (ret===false) inputOne(doneFunc); // try next address
            else if (transparent_addresses[address]>=minBalance) doneFunc(address); // found address with sufficient balance
            else inputOne(doneFunc); // try next address
         });
      }
      inputOne(doneFunc);

   },e=>console.log(e));
}
