/*

   Example usage, create new keys:

      var crypto=new CryptoGraphy();
      await crypto.ready;
      console.log(base58.encode(await crypto.sign("text to signature");))
      console.log(JSON.stringify(await crypto.exportKeys()));
      ...

   Another example, initialize with existing keys:

      var crypto=new CryptoGraphy(
      {
        "sign":"2EPbyvKQKUaUPMF7Mm94FjEzvs5tsLWfesyc97W1dqYeeZFEG2k....shortened....QrX9c",
        "verify":"NkRWY4nhgQyYxr4PWqtzdLFK9A12hXJjcTqRjYkTjpNj3nG8S....shortened....jcYug",
        "encrypt":"2TuPVgMCHJy5atawrsADEzjP7MCVbyyCA89UW6Wvjp9HrBus....shortened....uha2c",
        "decrypt":"riiewRJm2wpE3rWTs1ikUc83so8ZXMX8vp9dUTnRgMC8GyfL....shortened....rkBz3"
      });
      await crypto.ready;
      console.log(JSON.stringify(await crypto.exportKeys()));
      ...

   Note, your calling function must be defined as async,
   in order to be able to use await

*/


// When called without argument, new keys are initialized. When called with an arguement,
// it is treated as keys for import, and the specified keys are imported
//
var CryptoGraphy=function(keysForImport)
{
   // current keyspairs for encoding and signing
   this.keys = {};

   // Defined key parameters
   this.keyParamsSign = function() { return {name: "ECDSA", namedCurve: "P-256", hash: {name: "SHA-256"}} },
   this.keyParamsEncrypt = function() { return {name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: "SHA-256"}} },

   // Generate new keys for signing/encoding
   this.newSignKeys = async function() { return window.crypto.subtle.generateKey( this.keyParamsSign(), true, ["sign", "verify"]); },
   this.newEncodeKeys = async function() { return window.crypto.subtle.generateKey( this.keyParamsEncrypt(), true, ["encrypt", "decrypt"]); },

   // ---------------------------------------------------------------------------------------------------------------------------------------
   // ---------------------------------------------------------------------------------------------------------------------------------------

   // Processing functions to sign, verify, encrypt and decrypt
   this.encrypt = async function(data)
   {
      if (typeof data == 'string') data=bufferFromString(data);
      return await crypto.subtle.encrypt(this.keyParamsEncrypt(), this.keys.encrypt, data);
   },

   this.decrypt = async function(data)
   {
      if (typeof data == 'string') data=base58.decode(data);
      return crypto.subtle.decrypt(this.keyParamsEncrypt(), this.keys.decrypt, data);
   },

   this.sign = async function(data)
   {
      if (typeof data == 'string') data=bufferFromString(data);
      return await crypto.subtle.sign(this.keyParamsSign(), this.keys.sign, data);
   },

   this.verify = async function(signature, data)
   {
      if (typeof signature == 'string') signature=base58.decode(signature);
      if (typeof data == 'string') data=bufferFromString(data);
      return window.crypto.subtle.verify(this.keyParamsSign(), this.keys.verify, signature, data);
   },

   // ---------------------------------------------------------------------------------------------------------------------------------------
   // ---------------------------------------------------------------------------------------------------------------------------------------

   this.genKeys = async function()
   {
      var sig=await this.newSignKeys();
      this.keys.sign=sig.privateKey;
      this.keys.verify=sig.publicKey;

      var enc=await this.newEncodeKeys();
      this.keys.encrypt=enc.publicKey;
      this.keys.decrypt=enc.privateKey;

      return this.keys;
   },

   // ---------------------------------------------------------------------------------------------------------------------------------------
   // ---------------------------------------------------------------------------------------------------------------------------------------

   // Export key to string in supported format
   // Automatically detects key type
   this.exportKey = async function(key)
   {
      var buffer;
      try {
         if (key.type=='private') buffer=await window.crypto.subtle.exportKey("pkcs8", key);
         if (key.type=='public')
         {
            if (key.algorithm.name=="ECDSA") buffer=await window.crypto.subtle.exportKey("raw", key); // shortest form of the key
            else buffer=await window.crypto.subtle.exportKey("spki", key);
         }
         return base58.encode(new Uint8Array(buffer));
      }
      catch(err) // fallback to jwk, for firefox which does not support pkcs8 for ECDSA
      {
         return base58.encode(JSON_toString(await window.crypto.subtle.exportKey("jwk", key)));
      }
   },

   // Import key from string
   // Usages are: sign, verify, encrypt, decrypt
   this.importKey = async function(keyStr, usage)
   {
      var key=base58.decode(keyStr);
      var params=( usage.match(/sign|verify/) ? this.keyParamsSign() : this.keyParamsEncrypt() );
      var format=( usage.match(/verify/) ? "raw" : (usage.match(/sign|decrypt/) ? "pkcs8" : "spki") );

      if (key[0]==123) // json (jwk) starts with {
      {
         key=JSON_fromString(String.fromCharCode.apply(null, new Uint8Array(key)));
         return window.crypto.subtle.importKey("jwk", key, params, true, [usage]);
      }
      else // base58 format
      {
         return window.crypto.subtle.importKey(format, key, params, true, [usage]);
      }
   },

   this.exportKeys = async function() { var ret={}; for (k in this.keys) ret[k]=await this.exportKey(this.keys[k]); return ret; },
   this.importKeys = async function(keys) { if (typeof keys == "string") keys=JSON_fromString(keys); for (k in keys) this.keys[k]=await this.importKey(keys[k],k); }

   if (keysForImport) this.ready=this.importKeys(keysForImport);
   else this.ready=this.genKeys();
}
