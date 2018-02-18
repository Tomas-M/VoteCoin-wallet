/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/

function hexEncode(str)
{
    var strBuffer = new TextEncoder('utf-8').encode(str);
    var strArray = Array.from(new Uint8Array(strBuffer));
    return strArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
}

function hexDecode(hex)
{
	 if (hex=='' || typeof hex == "undefined") return '';
    hex=hex.replace(/0+$/,"");
    if (hex.substr(0,2).toUpperCase().match(/^F5|^F6/)) return '';

	 var byteArray=hex.match(/(.{1,2})/g).map(h=>parseInt(h, 16));
	 return new TextDecoder('utf-8').decode(new Uint8Array(byteArray));
}
