/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/

// alphabet for base58 encode-decode
alphabet="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";


function genSignKeys()
{
   return new Promise((resolve, reject) =>
   {
      window.crypto.subtle.generateKey( {name: "ECDSA", namedCurve: "P-256"}, true, ["sign", "verify"])
      .then((key)=>resolve(key))
      .catch((err)=>reject(err));
   })
}


function genEncodeKeys()
{
   return new Promise((resolve, reject) =>
   {
      window.crypto.subtle.generateKey( {name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: "SHA-256"}}, true, ["encrypt", "decrypt"])
      .then((key)=>resolve(key))
      .catch((err)=>reject(err));
   })
}


function exportKeyBase58(key)
{
   return new Promise((resolve, reject) =>
   {
      window.crypto.subtle.exportKey("raw", key)
      .then(keyArray => resolve(base58_encode(new Uint8Array(keyArray))))
      .catch(err => reject());
   });
}


function importKeyBase58(keyStr)
{
   return window.crypto.subtle.importKey("raw", base58_decode(keyStr), {name: "ECDSA", namedCurve: "P-256"}, true, ["verify"]);
}


function exportKeyJWK(key)
{
   return window.crypto.subtle.exportKey("jwk", key);
}


function importKeyJWK(jwk)
{
   var options=[];
   var parameters={};

   if (jwk.kty=="RSA")
   {
      parameters.name=jwk.alg.replace(/-[0-9]+/,'');
      parameters.hash={name: "SHA-"+jwk.alg.replace(/.*-/,'')};
   }

   if (jwk.kty=="EC")
   {
      parameters.name="ECDSA";
      parameters.namedCurve=jwk.crv;
   }

   return window.crypto.subtle.importKey("jwk",jwk,parameters,true,jwk.key_ops);
}


function exportKeys()
{
   return new Promise((resolve, reject) =>
   {
      exportKeyBase58(cryptokey.verifyPublic)
      .then(e=>{cryptokey.verifyPublic.base58=e; return exportKeyJWK(cryptokey.signPublic)})
      .then(e=>{cryptokey.signPublic.jwk=e; return exportKeyJWK(cryptokey.signPrivate)})
      .then(e=>{cryptokey.signPrivate.jwk=e; return exportKeyJWK(cryptokey.encodePublic)})
      .then(e=>{cryptokey.encodePublic.jwk=e; return exportKeyJWK(cryptokey.encodePrivate)})
      .then(e=>{cryptokey.encodePrivate.jwk=e; resolve(); })
      .catch((err)=>reject(err));
   })
}


function importKeys(keys)
{
   return new Promise((resolve,reject)=>
   {
      if (!keys) resolve();
      importKeyJWK(keys.signPublic.jwk)
      .then(e=>{ cryptokey.signPublic=e; return importKeyJWK(keys.signPrivate.jwk)})
      .then(e=>{ cryptokey.signPrivate=e; return importKeyJWK(keys.encodePublic.jwk)})
      .then(e=>{ cryptokey.encodePublic=e; return importKeyJWK(keys.encodePrivate.jwk)})
      .then(e=>{ cryptokey.encodePrivate=e; return importKeyBase58(keys.verifyPublic.base58)})
      .then(e=>{ cryptokey.verifyPublic=e; resolve(); })
      .catch((err)=>reject(err));
   });
}


function base58_encode(source)
{
   var ALPHABET_MAP = {};
   var BASE = alphabet.length;
   var LEADER = alphabet.charAt(0);
   for (var z=0; z<alphabet.length; z++) ALPHABET_MAP[alphabet.charAt(z)] = z;

   if (source.length === 0) return '';
   var carry;

   var digits = [0];
   for (var i = 0; i < source.length; ++i)
   {
       for (var j = 0, carry = source[i]; j < digits.length; ++j)
       {
          carry += digits[j] << 8;
          digits[j] = carry % BASE;
          carry = (carry / BASE) | 0;
        }

        while (carry > 0)
        {
           digits.push(carry % BASE);
           carry = (carry / BASE) | 0;
        }
   }

   var string = '';

   // deal with leading zeros
   for (var k = 0; source[k] === 0 && k < source.length - 1; ++k) string += alphabet[0];
   // convert digits to a string
   for (var q = digits.length - 1; q >= 0; --q) string += alphabet[digits[q]];

   return string;
}


function base58_decode(string)
{
   var ALPHABET_MAP = {};
   var BASE = alphabet.length;
   var LEADER = alphabet.charAt(0);
   for (var z=0; z<alphabet.length; z++) ALPHABET_MAP[alphabet.charAt(z)] = z;

   var bytes = [0];
   for (var i = 0; i < string.length; i++)
   {
      var value = ALPHABET_MAP[string[i]];
      if (value === undefined) return;

      for (var j = 0, carry = value; j < bytes.length; ++j)
      {
         carry += bytes[j] * BASE;
         bytes[j] = carry & 0xff;
         carry >>= 8;
      }

      while (carry > 0)
      {
         bytes.push(carry & 0xff);
         carry >>= 8;
      }
  }

   // deal with leading zeros
   for (var k = 0; string[k] === LEADER && k < string.length - 1; ++k) bytes.push(0);

   return new Uint8Array(bytes.reverse());
}


function init_keys(doneFunc)
{
   genSignKeys().then( keypair =>
   {
      cryptokey.signPublic=keypair.publicKey;
      cryptokey.signPrivate=keypair.privateKey;
      cryptokey.verifyPublic=cryptokey.signPublic;

      genEncodeKeys().then( keypair =>
      {
         cryptokey.encodePublic=keypair.publicKey;
         cryptokey.encodePrivate=keypair.privateKey;

         exportKeys().then(key => { doneFunc(); }).catch(err=>console.log("Cannot create export for sign/encode keys"));
      }).catch(err => console.log("Unable to create encoding/decoding keypair"));
   }).catch(err => console.log("Unable to generate sign/verify keypair"))
}

var cryptokey=storage_load('cryptokey',false);
if (cryptokey) importKeys(cryptokey).then(e=>exportKeys());
else
{
   cryptokey={};
   // signing keypair (private and public keys)
   cryptokey.signPublic=false;
   cryptokey.signPrivate=false;
   cryptokey.verifyPublic=false;
   // encryption keypair (public and private keys)
   // is used to encrypt messages for others, currently not used in VoteCoin
   cryptokey.encodePublic=false;
   cryptokey.encodePrivate=false;
   init_keys(function(){ storage_save('cryptokey',cryptokey); });
}
