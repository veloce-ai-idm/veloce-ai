const { app, BrowserWindow, ipcMain } = require('electron');
app.whenReady().then(() => {
  const win = new BrowserWindow({ 
    width: 800, height: 600, 
    webPreferences: { 
      contextIsolation: true, 
      preload: require('path').join(__dirname, 'preload.js') 
    } 
  });
  
  win.loadURL('data:text/html,<html><body><iframe id="frm" src="file://' + __dirname.replace(/\\/g, '/') + '/browser-settings.html" style="width:100%;height:100%"></iframe></body></html>');
  setTimeout(() => app.quit(), 3000);
});