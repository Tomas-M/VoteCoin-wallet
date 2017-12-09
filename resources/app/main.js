const electron = require('electron');
const {app, dialog, ipcMain, Menu} = require('electron');
const BrowserWindow = electron.BrowserWindow; 
const http = require('http')
const https = require('https');
const path = require('path')
const url = require('url')
const spawn = require('child_process').spawn;
const process = require('process');
const fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let server;
let canQuit=true;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 1200, height: 700, icon: path.join(__dirname, 'votecoin.ico')})

  win.setMenu(null);

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

function walletStop()
{
   console.log('wallet stop');
   rpc("stop",[],function(){ canQuit=true; app.quit(); },true);
}

function walletStart()
{
   console.log('wallet start');
   server = spawn(app.getAppPath()+'/votecoind.exe', [], {detached:true, stdio:'ignore', cwd:app.getAppPath()} );
   canQuit=false;
}

app.on('before-quit', (event) =>
{
   console.log("beforequit");
   if (!canQuit)
   {
      event.preventDefault();
      walletStop();
   }
})



function rpc(method,params,doneFunc,errorFunc)
{
   var username="admin";
   var password="gWVQGBlFkJSE3f77T3";
   if (!params) params=[];
   var data={"method":method, params, id:Math.floor(Math.random()*10000)};
   data=JSON.stringify(data);

   var options = {
     host: "127.0.0.1",
     port: 1234,
     path: "/",
     method: 'POST',
     headers: {
        'Authorization': 'Basic '+Buffer.from(username+':'+password).toString('base64'),
        'Content-Type': 'application/json',
        'Connection': 'Close',
        'Content-Length': Buffer.byteLength(data)
     }
   }

   var error=function(data)
   {
      if (errorFunc===true) setTimeout(function(){ rpc(method,params,doneFunc,errorFunc); },1000);
      else if (errorFunc) errorFunc(data);
   }

   // The Request
   var request = http.request(options, function(response)
   {
      var result="";

      response.on('data', function(chunk)
      {
         if (chunk)
         {
            var data = chunk.toString('utf8');
            result+=data;
         }
       });

       response.on('end',function(e)
       {
            try { result=JSON.parse(result); } catch(e){ console.log("error parsing json response: ",e); }
            console.log(result);
            if (result.error) error(result);
            else if (doneFunc) doneFunc(result);
       });

    }).on("error", function(e) {
        error(data);
    });

    //optionally Timeout Handling
    request.on('socket', function(socket)
    {
       socket.setTimeout(5000);
       socket.on('timeout', function() { request.abort(); });
    });

   request.write(data);
   request.end();
}


function downloadFile(host,port,path,targetFile,size,progressFunc,doneFunc)
{
   var file = fs.createWriteStream(targetFile);
   var bytes=0;
   var options = { host: host, port: port, path: path, method: 'GET', headers: {'Connection': 'Close'} }
   var request = https.get(options, function(response)
   {
       response.on('data', function(chunk) { if (chunk) { file.write(chunk); bytes+=chunk.length; progressFunc(path,size,bytes); } });
       response.on('end', function(){ file.end(); if (doneFunc) doneFunc(); });
   }).on("error", function(e) { console.log(e); });
}

// download all files if size does not match

var downloads=
[
   {host:'s3.amazonaws.com',port:443,path:"/zcashfinalmpc/sprout-verifying.key",target:app.getAppPath()+'/zkSNARK/sprout-verifying.key', size: 1449},
   {host:'s3.amazonaws.com',port:443,path:"/zcashfinalmpc/sprout-proving.key",target:app.getAppPath()+'/zkSNARK/sprout-proving.key', size: 910173851}
]

function download_all_files(progressFunc,doneFunc)
{
   var current=downloads.shift();
   if (!current) doneFunc(); // we are done downloading all files
   else
   {
       console.log('Download '+current.target);
       if (fs.existsSync(current.target) && fs.statSync(current.target).size==current.size) { download_all_files(progressFunc,doneFunc); return; } 
       else downloadFile(current.host,current.port,current.path,current.target,current.size,progressFunc,function(){ download_all_files(progressFunc,doneFunc); });
   }
}

exports.rpc=rpc;
exports.walletStart=walletStart;
exports.download_all_files=download_all_files;
