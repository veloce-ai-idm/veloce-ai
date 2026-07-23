const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('chrome://settings').catch(e => console.error(e));
  setTimeout(() => app.quit(), 3000);
});