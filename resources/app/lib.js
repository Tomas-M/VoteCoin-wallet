/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/

function JSON_fromString(str)
{
   var ret={};
   try { ret=JSON.parse(str); } catch (e) { console.log(e); };
   return ret;
}

function JSON_toString(obj)
{
   return JSON.stringify(obj);
}

function storage_save(key,val) { return main.storage_save(key,JSON_toString(val)); }
function storage_load(key,default_value)
{
   var ret=JSON_fromString(main.storage_load(key,JSON_toString(default_value)));
   if (typeof ret != typeof default_value || ret.constructor != default_value.constructor) { console.log('wrong data type, resetting',key); ret=default_value; }
   return ret;
}


// -----------------------------------------------------------------------------------------

function settext(element,t,active)
{
   var el=$('#'+element);
   if (active) el.addClass('active'); else el.removeClass('active');
   if (el.text()==t) return false;
   el.text(t);
   return true;
}

function sethtml(element,h)
{
   var el=$('#'+element);
   if (el.data('rawhtml')==h) return false;
   el.html(h);
   el.data('rawhtml',h);
   return true;
}

function num(n,precision,strip)
{
   if (!precision) precision=0;
   if (typeof n == "string") n=n.replace(/,/,'.');
   n=parseFloat(n);
   if (isNaN(n)) n=0;
   n=n.toFixed(precision);
   if (strip && precision>0) n=n.replace(/0+$/,"").replace(/[.]$/,"");
   return n;
}

function htmlspecialchars(text)
{
   if (typeof text == "undefined") return '';
   text=text+"";
   var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
   return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function humanReadableDate(d)
{
   return (new Date(d*1000)).toLocaleString();
}

function UCfirst(str)
{
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function now(miliseconds)
{
   var n=Date.now();
   if (miliseconds) return n;
   else return Math.floor(n/1000);
}

function timeAgo(t)
{
   function plural(n) { if (n>1 || n==0) return "s"; else return ""; }
   var length=now()-t;

   var days=length/60/60/24;
   var hours=(days-Math.floor(days))*24;
   var minutes=(hours-Math.floor(hours))*60;

   var weeks=Math.floor(days/7);
   var months=Math.floor(days/30);
   var years=Math.floor(days/365);

   days=Math.floor(days);
   hours=Math.floor(hours);
   minutes=Math.floor(minutes);

   if (years>0) return years+" year"+plural(years)+" ago";
   if (months>0) return months+" month"+plural(months)+" ago";
   if (weeks>0) return weeks+" week"+plural(weeks)+" ago";
   if (days>0) return days+" day"+plural(days)+" ago";
   if (hours>0) return hours+" hour"+plural(hours)+" ago";
   if (minutes>0) return minutes+" minute"+plural(minutes)+" ago";
   return "a while ago";
}

// -----------------------------------------------------------------------------------------

function sortByKeys(ar,sortkeys,desc)
{
   var keys=[];
   var x,y,i,j;
   if (desc) desc=-1; else desc=1;

   return ar.sort( function(a, b)
   {
      for (i=0; i<sortkeys.length; i++)
      {
         x=undefined; y=undefined;
         keys=sortkeys[i].split("|");
         for (j=0; j<keys.length; j++) { if (!x) x=a[keys[j]]; }
         for (j=0; j<keys.length; j++) { if (!y) y=b[keys[j]]; }
         if (x<y) return -1*desc;
         if (x>y) return 1*desc;
      }
      return 0;
   });
}

function makeOrderedArray(obj,sortkeys,idname)
{
   var res=[]; var el;
   for (var i in obj)
   {
      el=obj[i];
      if (idname) el[idname]=i;
      res.push(el);
   }
   return sortByKeys(res,sortkeys);
}

function array_shuffle(array)
{
   var count = array.length, rand, temp;
   while(count)
   {
      rand=Math.random() * count-- | 0;
      temp=array[count];
      array[count]=array[rand];
      array[rand]=temp;
   }
   return array;
}


// -----------------------------------------------------------------------------------------

function audio_notify()
{
   if ($('#sound').html()=='')
   {
      $('#sound').html('<audio autoplay="autoplay"><source src="notify.mp3" type="audio/mpeg" /></audio>');
      setTimeout(function(){ $('#sound').html(''); },3000); // prevents replaying the notification in the next 3 seconds
   }
}

function num_precision(r)
{
   var p=num(r,8,true).split(".")[1];
   if (p) p=p.length; else p=0;
   return p;
}

// -----------------------------------------------------------------------------------------

function sha256(str)  // returns PROMISE, call like this: sha256("string").then(result=>...)
{
   var buffer = new TextEncoder("utf-8").encode(str);
   return crypto.subtle.digest("SHA-256", buffer).then(function (hash) {
      return btoa(String.fromCharCode(...new Uint8Array(hash)));
  });
}

// -----------------------------------------------------------------------------------------

Chart.plugins.register({
   afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;

      chart.data.datasets.forEach(function(dataset, i) {
         var meta = chart.getDatasetMeta(i);
         if (!meta.hidden) {
            meta.data.forEach(function(element, index) {
               // Draw the text in black, with the specified font
               ctx.fillStyle = 'rgb(50, 50, 50)';

               var fontSize = 14;
               var fontStyle = 'bold';
               var fontFamily = 'Roboto';
               ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);

               // Just naively convert to string for now
               var dataString = dataset.data[index].toString()+"%";

               // Make sure alignment settings are correct
               ctx.textAlign = 'center';
               ctx.textBaseline = 'middle';

               var padding = 5;
               var position = element.tooltipPosition();
               if (dataset.data[index]>=4) ctx.fillText(dataString, position.x, position.y );
            });
         }
      });
   }
});

// nasty hack to skip changing chart border color if background is used
Chart.helpers.getHoverColor2=Chart.helpers.getHoverColor;
Chart.helpers.getHoverColor=function(col){ if (col=='#e9e9e9') return col; else return Chart.helpers.getHoverColor2(col); }
