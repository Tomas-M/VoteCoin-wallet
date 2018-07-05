/*
    Copyright (c) 2017 VoteCoin team, all rights reserved
    See LICENSE file for more info
*/

const electron = require('electron');
const {app, dialog, ipcMain, Menu} = require('electron');
const BrowserWindow = electron.BrowserWindow;
const http = require('./redirect.js').http;
const https = require('./redirect.js').https;
const path = require('path')
const url = require('url')
const spawn = require('child_process').spawn;
const process = require('process');
const fs = require('fs');
const crypto = require("crypto");
const os = require('os');

// global variables, will be needed later
var wallet_password="";
var wallet_user="";
var wallet_port="";
var wallet_startup_params=['-experimentalfeatures','-zmergetoaddress','-txindex'];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let splash;
let server;
let canQuit=true;
let showExitPrompt=false;
let lastRPCerr='';

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 1200, height: 720, icon: path.join(__dirname, 'votecoin.ico')})

  if (process.platform === 'darwin')
  {
    var menuTemplate = [];
    menuTemplate.push({
      label: 'Edit',
      submenu: [
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'delete'},
        {role: 'selectall'},
        {role: 'quit'}
      ]}
    );

    const applicationMenu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(applicationMenu)
    win.setMenu(applicationMenu);
  }
  else win.setMenu(null);

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on('close', (e) =>
  {
     if (showExitPrompt)
     {
         e.preventDefault() // Prevents the window from closing
         dialog.showMessageBox({type: 'warning', buttons: [], title: 'Warning', message: 'Please wait for all outgoing payments to complete. This can take few minutes.' });
      }
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}


var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory)
{
   // Someone tried to run a second instance, we should focus our window.
   if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
   if (splash) { if (splash.isMinimized()) splash.restore(); splash.focus(); }
});

if (shouldQuit) { app.quit(); return; }

// register default protocol client
app.setAsDefaultProtocolClient("votecoin");
app.setAsDefaultProtocolClient("vote");

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

// -----------------------------------------------------------------------------------

function mkdir(path)
{
   try { fs.mkdirSync(path); } catch(e) {}
   return path;
}

function daemon_exe()
{
   if (process.platform == 'win32') return "votecoind.exe";
   if (process.platform == 'linux') return "votecoind.ux";
   if (process.platform == 'darwin') return "votecoind.mac";
}

function daemon_path()
{
   if (process.platform == 'win32') return mkdir(app.getAppPath());
   if (process.platform == 'linux') return mkdir(app.getAppPath());
   if (process.platform == 'darwin') return mkdir(app.getAppPath());
}

function daemon_data_path()
{
   if (process.platform == 'win32') return mkdir(app.getAppPath()+"/VoteCoin");
   if (process.platform == 'linux') return mkdir(os.homedir()+"/.votecoin");
   if (process.platform == 'darwin') return mkdir(os.homedir()+"/Library/Application Support/VoteCoin");
}

function settings_path()
{
   if (process.platform == 'win32') return mkdir(app.getAppPath()+"/settings");
   if (process.platform == 'linux') return mkdir(os.homedir()+"/.votecoin/settings");
   if (process.platform == 'darwin') return mkdir(os.homedir()+"/Library/Application Support/VoteCoin/settings");
}

function zksnark_path()
{
   if (process.platform == 'win32') return mkdir(app.getAppPath()+"/zkSNARK");
   if (process.platform == 'linux') return mkdir(os.homedir()+"/.zcash-params");
   if (process.platform == 'darwin') return mkdir(os.homedir()+"/Library/Application Support/ZcashParams");
}


function walletStop()
{
   console.log('wallet stop');

   splash = new BrowserWindow({width: 400, height: 100, icon: path.join(__dirname, 'votecoin.ico')});
   splash.setMenu(null);
   splash.loadURL(url.format({
     pathname: path.join(__dirname, 'wait.html'),
     protocol: 'file:',
     slashes: true
   }));

   // if user forces splash close, quit. User's responsibility
   splash.on('closed',function(){ canQuit=true; app.quit(); })

   rpc("stop",[],function(){ canQuit=true; app.quit(); },true);
}

function walletStart()
{
   console.log('wallet start');
   canQuit=false;
   try { fs.chmodSync(daemon_path()+'/'+daemon_exe(),0755); } catch(e) { console.log(e); }
   server = spawn(daemon_path()+'/'+daemon_exe(), wallet_startup_params, {detached:true, stdio:'ignore', cwd:daemon_path()} )
               .on('exit',code=>
               {
                  if (code!=0)
                  {
                     // check log for possible rescan
                     var logfile=daemon_data_path()+"/debug.log";
                     try {
                        var log=fs.readFileSync(logfile).toString().split("\n").slice(-300).join("\n");
                        if (log.match(/ERROR:/g).length>3 && log.match(/Shutdown: done/g).length>3)
                        {
                           try { fs.unlinkSync(logfile+".log"); } catch(e) {}
                           try { fs.renameSync(logfile,logfile+".log"); } catch(e) {}
                           wallet_startup_params.push(['-reindex']);
                        }
                     } catch (e) {}
                  }
                  if (!win) { canQuit=true; }
               });
}

app.on('before-quit', (event) =>
{
   console.log("beforequit");
   if (!canQuit)
   {
      event.preventDefault();
      walletStop();
   }
});



function rpc(method,params,doneFunc,errorFunc,hideErrorMessage)
{
   if (!params) params=[];
   var data={"method":method, params, id:Math.floor(Math.random()*10000)};
   data=JSON.stringify(data);

   var options = {
     host: "127.0.0.1",
     port: wallet_port,
     path: "/",
     method: 'POST',
     headers: {
        'Authorization': 'Basic '+Buffer.from(wallet_user+':'+wallet_password).toString('base64'),
        'Content-Type': 'application/json',
        'Connection': 'Close',
        'Content-Length': Buffer.byteLength(data)
     }
   }

   var error=function(data)
   {
      if (data && data.error && data.error.message && !hideErrorMessage) lastRPCerr=data.error.message;
      walletStart(); // rpc error encountered means wallet is not running. Start it. If wallet was started, no problem
      if (errorFunc===true) setTimeout(function(){ rpc(method,params,doneFunc,errorFunc,hideErrorMessage); },1000);
      else if (errorFunc) errorFunc(data);
   }

   // The Request
   var request = http.request(options, function(response)
   {
      var result="";
      lastRPCerr="";

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
            try { result=JSON.parse(result); } catch(e){ lastRPCerr=result; console.log("error parsing json response: ",e); console.log(result); result=false; }
            if (!result || result.error) error(result);
            else if (doneFunc) { doneFunc(result.result); }
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
   {host:'z.cash',port:443,path:"/downloads/sprout-verifying.key",target:zksnark_path()+'/sprout-verifying.key', size: 1449},
   {host:'z.cash',port:443,path:"/downloads/sprout-proving.key",target:zksnark_path()+'/sprout-proving.key', size: 910173851}
]

function download_all_files(progressFunc,doneFunc)
{
   var current=downloads.shift();
   if (!current) doneFunc(); // we are done downloading all files
   else
   {
       console.log('Download '+current.target);
       if (fs.existsSync(current.target) && fs.statSync(current.target).size==current.size) { download_all_files(progressFunc,doneFunc); return; }
       else downloadFile(current.host,current.port,current.path,current.target,current.size,progressFunc,function(){ downloads.push(current); download_all_files(progressFunc,doneFunc); });
   }
}

function init_rpc_password()
{
   var confpath=daemon_data_path()+'/votecoin.conf';
   if (!fs.existsSync(confpath))
   {
      wallet_user="admin";
      wallet_password=crypto.randomBytes(20).toString('hex')
      wallet_port=6660;
      fs.writeFileSync(confpath, "rpcport="+wallet_port+"\nrpcuser="+wallet_user+"\nrpcpassword="+wallet_password+"\nbanscore=500\nbantime=60\nrpcworkqueue=80");
   }
   else
   {
      var data=fs.readFileSync(confpath).toString();
      wallet_user=data.match(/^rpcuser=(.+)/m)[1];
      wallet_password=data.match(/^rpcpassword=(.+)/m)[1];
      wallet_port=data.match(/^rpcport=([0-9]+)/m)[1];
   }
}

function setTransactionInProgress(e)
{
   showExitPrompt=!!e;
}

function getLastRPCerrorMessage()
{
   return lastRPCerr;
}

function openDevelTools()
{
   win.webContents.openDevTools();
}

// -----------------------------------------------------------------------------------------

function storage_keyfile(key)
{
   return settings_path()+"/"+key.replace(/[^a-zA-Z0-9]/,"_")+".json";
}

function storage_save(key,valStr)
{
   // first, read currently stored value
   var val="";
   try { val=fs.readFileSync(storage_keyfile(key)).toString(); } catch(e) { }
   if (val==valStr) return; // quit if new value is already stored
   fs.writeFileSync(storage_keyfile(key),valStr);
}

function storage_load(key,default_value)
{
   var val;
   try { val=fs.readFileSync(storage_keyfile(key)).toString(); } catch(e) { }
   if (typeof val == "undefined" || val == null) { val=default_value; storage_save(key,val); }
   return val;
}

// -----------------------------------------------------------------------------------------


init_rpc_password();

exports.rpc=rpc;
exports.walletStart=walletStart;
exports.download_all_files=download_all_files;
exports.setTransactionInProgress=setTransactionInProgress;
exports.openDevelTools=openDevelTools;
exports.getLastRPCerrorMessage=getLastRPCerrorMessage;
exports.storage_save=storage_save;
exports.storage_load=storage_load;
exports.daemon_data_path=daemon_data_path;
