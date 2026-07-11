const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray;
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
  
  const contextMenu = Menu.buildFromTemplate([
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
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit App', click: () => { app.isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('Nepali Calendar & Date Converter');
  tray.setContextMenu(contextMenu);

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
    width: 320,
    height: 85,
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

function toggleWindowMode(widgetMode) {
  if (!mainWindow) return;
  isWidgetMode = widgetMode;

  if (isWidgetMode) {
    mainWindow.hide();
    if (!widgetWindow) createWidgetWindow();
    widgetWindow.show();
  } else {
    if (widgetWindow) widgetWindow.hide();
    mainWindow.show();
  }
}

app.whenReady().then(() => {
  // We'll generate a dummy blank icon if missing
  createMainWindow();
  createWidgetWindow();
  createTray();

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
});

ipcMain.on('open-dashboard', () => {
  toggleWindowMode(false);
});

ipcMain.on('set-always-on-top', (event, alwaysTop) => {
  isAlwaysOnTop = alwaysTop;
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(alwaysTop, 'screen-saver');
  }
  // Sync menu state
  if (tray) {
    const menu = tray.getContextMenu();
    const item = menu.items.find(i => i.label === 'Always on Top');
    if (item) item.checked = alwaysTop;
  }
});
