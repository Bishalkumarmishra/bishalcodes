const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let trayContextMenu;
let isWidgetMode = false;
let isAlwaysOnTop = false;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 660,
    minWidth: 350,
    minHeight: 450,
    frame: false,
    transparent: true,
    show: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });
}

function createTray() {
  // Use a fallback built-in tray icon or blank if icon is missing
  const trayIcon = path.join(__dirname, 'tray-icon.png');
  tray = new Tray(trayIcon);
  
  trayContextMenu = Menu.buildFromTemplate([
    { label: 'Nepali Calendar Desktop', enabled: false },
    { type: 'separator' },
    { label: 'Show Full Dashboard', click: () => { toggleWindowMode(false); } },
    { label: 'Show Floating Widget', click: () => { toggleWindowMode(true); } },
    { type: 'separator' },
    { 
      label: 'Always on Top', 
      type: 'checkbox', 
      checked: isAlwaysOnTop,
      click: (menuItem) => {
        isAlwaysOnTop = menuItem.checked;
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(isAlwaysOnTop, 'screen-saver');
          mainWindow.webContents.send('always-on-top-changed', isAlwaysOnTop);
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit App', click: () => { app.isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('Nepali Calendar & Date Converter');
  tray.setContextMenu(trayContextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

let widgetWindow;

function createWidgetWindow() {
  widgetWindow = new BrowserWindow({
    width: 280,
    height: 70,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  widgetWindow.loadFile('widget.html');
  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });
}

function positionWidgetWindow() {
  if (!widgetWindow) return;
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const { x, y } = primaryDisplay.workArea;
  const [winWidth, winHeight] = widgetWindow.getSize();
  // Position bottom right with 10px margin
  widgetWindow.setPosition(x + width - winWidth - 10, y + height - winHeight - 10);
}

function toggleWindowMode(widgetMode) {
  if (!mainWindow) return;
  isWidgetMode = widgetMode;

  if (isWidgetMode) {
    if (!widgetWindow) createWidgetWindow();
    positionWidgetWindow();
    widgetWindow.show();
  } else {
    if (widgetWindow) widgetWindow.hide();
  }
}

// Auto start logic
app.setLoginItemSettings({
  openAtLogin: true,
  args: ['--hidden']
});

app.whenReady().then(() => {
  createMainWindow();
  createWidgetWindow();
  createTray();

  const isHidden = process.argv.includes('--hidden');
  if (isHidden) {
    // If started automatically on boot, wait 3 seconds and show widget
    setTimeout(() => {
      toggleWindowMode(true);
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC communication
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('close-window', () => {
  // If we close, just hide to tray instead of quitting
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('toggle-widget-mode', (event, targetMode) => {
  toggleWindowMode(targetMode);
});

ipcMain.on('close-widget', () => {
  if (widgetWindow) widgetWindow.hide();
  isWidgetMode = false;
  if (mainWindow) mainWindow.webContents.send('window-mode-changed', false);
});

ipcMain.on('open-dashboard', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('set-always-on-top', (event, alwaysTop) => {
  isAlwaysOnTop = alwaysTop;
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(alwaysTop, 'screen-saver');
  }
  // Sync menu state
  if (tray && trayContextMenu) {
    const item = trayContextMenu.items.find(i => i.label === 'Always on Top');
    if (item) {
      item.checked = alwaysTop;
      tray.setContextMenu(trayContextMenu);
    }
  }
});

// Advanced Event & Sync IPC handlers
const http = require('http');
const { nativeImage, Notification } = require('electron');

let oauthServer = null;

function startLocalOAuthServer(port, type) {
  if (oauthServer) {
    try {
      oauthServer.close();
    } catch(e) {}
  }
  
  oauthServer = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      
      if (url.pathname === '/google-callback') {
        const code = url.searchParams.get('code');
        if (code && mainWindow) {
          mainWindow.webContents.send('google-auth-success', code);
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Google Authentication Successful!</h1><p>You can close this window now and return to the Nepali Calendar app.</p>');
        
        setTimeout(() => {
          if (oauthServer) {
            oauthServer.close();
            oauthServer = null;
          }
        }, 1000);
      } else if (url.pathname === '/outlook-callback') {
        const code = url.searchParams.get('code');
        if (code && mainWindow) {
          mainWindow.webContents.send('outlook-auth-success', code);
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Outlook Authentication Successful!</h1><p>You can close this window now and return to the Nepali Calendar app.</p>');
        
        setTimeout(() => {
          if (oauthServer) {
            oauthServer.close();
            oauthServer = null;
          }
        }, 1000);
      } else {
        res.writeHead(404);
        res.end();
      }
    } catch (e) {
      console.error("Error in OAuth local server", e);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  oauthServer.listen(port, () => {
    console.log(`Local OAuth server listening on port ${port} for ${type}`);
  });
}

ipcMain.on('start-google-auth', () => {
  startLocalOAuthServer(48281, 'Google');
});

ipcMain.on('start-outlook-auth', () => {
  startLocalOAuthServer(48281, 'Outlook');
});

ipcMain.on('update-tray-icon', (event, dataUrl) => {
  if (tray) {
    const img = nativeImage.createFromDataURL(dataUrl);
    tray.setImage(img);
  }
});

ipcMain.on('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: title || 'नेपाली क्यालेन्डर',
      body: body || '',
      icon: path.join(__dirname, 'logo-icon.png')
    });
    
    notif.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    
    notif.show();
  }
});

