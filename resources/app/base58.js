/*

   This is base58 encode/decode implementation for JavaScript
   Encoder accepts as input either UTF-8 string or ArrayBuffer/Uint8Array, and returns ASCII string
   Decoder accepts as input only ASCII string, and returns Uint8Array

   Example usage:

      var coded=base58.encode("test");                     // returns "3yZe7d"
      var decoded=base58.decode("3yZe7d");                 // returns Uint8Array(4)�[116, 101, 115, 116]
      var str=stringFromBuffer(base58.decode("3yZe7d"));   // returns "test"

*/

// buffer-string conversion functions
function bufferFromString(str) { return new TextEncoder("utf-8").encode(str); };
function stringFromBuffer(buf) { return new TextDecoder("utf-8").decode(buf); };

var base58=
{
   'alphabet58': "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",

   'encode': function(source)
   {
      if (typeof source=='string') source=bufferFromString(source); // handle string input
      if (typeof source.length == 'undefined') source=new Uint8Array(source); // handle arraybuffer input

      var alphabet=this.alphabet58;
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
   },

   'decode': function(string)
   {
      if (!string || typeof string!='string') return new Uint8Array();
      var alphabet=this.alphabet58;
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

}
