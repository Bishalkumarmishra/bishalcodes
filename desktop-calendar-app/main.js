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

function toggleWindowMode(widgetMode) {
  if (!mainWindow) return;
  isWidgetMode = widgetMode;

  mainWindow.hide();
  
  // Re-configure window based on mode
  if (isWidgetMode) {
    mainWindow.setSize(350, 480);
    mainWindow.setResizable(false);
    mainWindow.setMaximizable(false);
    
    // In widget mode, make it frameless & transparent
    // Wait, on runtime we cannot change 'frame' option, but we can fake it or recreate window if necessary.
    // Instead of recreating window which resets state, let's keep it simple: we can make it a frameless window from the start, and custom-style the title bar in HTML!
    // Yes! Frameless windows with custom HTML title bars look 10x more premium and let us customize the close/minimize button designs to match our theme!
    // Let's use custom titlebars for both Widget and Dashboard mode! This allows toggling frame styles on the fly!
  } else {
    mainWindow.setSize(980, 660);
    mainWindow.setResizable(true);
    mainWindow.setMaximizable(true);
  }

  // Notify renderer of the mode change
  mainWindow.webContents.send('window-mode-changed', isWidgetMode);
  mainWindow.show();
}

app.whenReady().then(() => {
  // We'll generate a dummy blank icon if missing
  createMainWindow();
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
  // If we close, just hide to tray unless quitting
  if (process.platform === 'darwin') {
    mainWindow.hide();
  } else {
    mainWindow.hide(); // Hide to tray instead of quitting
  }
});

ipcMain.on('toggle-widget-mode', (event, targetMode) => {
  toggleWindowMode(targetMode);
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
