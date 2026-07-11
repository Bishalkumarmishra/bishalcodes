const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false, // Headless
    transparent: true,
    frame: false,
    webPreferences: {
      offscreen: true // Offscreen rendering to prevent any window flickering
    }
  });

  const svgPath = path.join(__dirname, '../desktop-calendar-app/icon-debug.svg');
  win.loadFile(svgPath);

  win.webContents.once('did-finish-load', () => {
    // Wait a brief moment to ensure fonts and layout shape are fully processed by Chromium
    setTimeout(async () => {
      try {
        const image = await win.capturePage();
        const pngBuffer = image.toPNG();
        
        const appDir = path.join(__dirname, '../desktop-calendar-app');
        fs.writeFileSync(path.join(appDir, 'icon.png'), pngBuffer);
        fs.writeFileSync(path.join(appDir, 'logo-icon.png'), pngBuffer);
        fs.writeFileSync(path.join(appDir, 'tray-icon.png'), pngBuffer);
        
        console.log("Successfully captured and saved pixel-perfect Chromium PNG icons!");
        app.quit();
      } catch (err) {
        console.error("Failed to capture screen using Electron:", err);
        app.exit(1);
      }
    }, 500);
  });
});
