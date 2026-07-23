const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 800, height: 600, webPreferences: { webviewTag: true } });
  win.loadURL('data:text/html,<webview id="wv" src="file://' + __dirname.replace(/\\/g, '/') + '/browser-settings.html" style="width:100%;height:100%"></webview><script>document.getElementById("wv").addEventListener("did-fail-load", (e) => console.log("Fail:", e.errorCode, e.errorDescription));</script>');
  setTimeout(() => app.quit(), 3000);
});