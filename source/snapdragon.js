import { app, BrowserWindow, ipcMain, Menu, globalShortcut } from "electron"; //Electron Modules
import path from "path"; //Node.js Path Module
import { fileURLToPath } from "url"; //Node.js URL Module
import { spawn } from "child_process"; //Node.js Child Process Module
import Store from "electron-store"; //Electron Store Module
import { execFile } from "child_process"; //Node.js Exec File Module
import http from "http";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;
const store = new Store();

// no error will occur during production as chokidar will be disabled
import { watchRenderer } from './watcher.js';
watchRenderer([
  path.join(__dirname, '../main/dash.html'),
  path.join(__dirname, '../main/zesty-design/dashboard.css'),
  path.join(__dirname, '../main/zesty-design/source.css'),
]);

let PyAttendy;
let startedWin;
let dashboardWin;


// Replace AttendyEngine with a starter that returns when backend ready
function startBackend({ timeoutMs = 15000, intervalMs = 300 } = {}) {
  return new Promise((resolve, reject) => {
    // spawn process (dev vs production)
    if (isDev) {
      PyAttendy = spawn('python', [path.join(__dirname, '../main/pyAttendy/attendy_engine.py')], { stdio: ['ignore', 'pipe', 'pipe'] });
    } else {
      const exePath = path.join(process.resourcesPath, 'atom', 'attendy_engine.exe');
      PyAttendy = execFile(exePath, { windowsHide: true });
    }

    if (!PyAttendy) return reject(new Error('failed to start backend process'));

    PyAttendy.stdout && PyAttendy.stdout.on("data", d => console.log("Python log -", d.toString()));
    PyAttendy.stderr && PyAttendy.stderr.on("data", d => console.error("Python log -", d.toString()));

    const start = Date.now();

    const check = () => {
      const req = http.get({ hostname: '127.0.0.1', port: 5005, path: '/health', timeout: 2000 }, res => {
        let body = '';
        res.on('data', c => body += c.toString());
        res.on('end', () => {
          try {
            const json = JSON.parse(body || '{}');
            if (res.statusCode === 200 && json && json.ready) return resolve();
          } catch (e) { /* ignore */ }
          if (Date.now() - start > timeoutMs) return reject(new Error('backend health check timed out'));
          setTimeout(check, intervalMs);
        });
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('backend health check timed out'));
        setTimeout(check, intervalMs);
      });
      req.on('timeout', () => req.destroy());
    };

    // start polling
    setTimeout(check, 100);
  });
}

// -------------------------------------
// Controllers
// -------------------------------------
ipcMain.on("window-control", (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return;

  switch (action) {
    case "minimize": win.minimize(); break;
    case "maximize": win.isMaximized() ? win.unmaximize() : win.maximize(); break;
    case "close": win.close(); break;
    default: console.warn("Unknown action:", action);
  }

  if (win.isMaximized()) win.send("window-control-signal");
});
// -------------------------------------
// WINDOWS
//-------------------------------------
//Started Windows
function startedWindow() {
  startedWin = new BrowserWindow({
    resizable: false,
    width: 500,
    height: 650,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "../source/load.js"),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  startedWin.loadFile(path.join(__dirname, "../main/start.html"));

  startedWin.once('ready-to-show', () => {
    startedWin.show();
  });

  // In packaged builds, block refresh/devtools keyboard shortcuts
  if (!isDev && startedWin && startedWin.webContents) {
    startedWin.webContents.on('before-input-event', (event, input) => {
      try {
        const key = (input.key || '').toLowerCase();
        const isCtrl = !!(input.control || input.meta);
        const isShift = !!input.shift;
        // block Ctrl+R, Ctrl+Shift+R, Ctrl+Shift+I and F12
        if ((isCtrl && key === 'r') || (isCtrl && isShift && key === 'r') || (isCtrl && isShift && key === 'i') || input.code === 'F12') {
          event.preventDefault();
        }
      } catch (e) { /* ignore */ }
    });
    startedWin.webContents.on('devtools-opened', () => {
      try { startedWin.webContents.closeDevTools(); } catch (e) { /* ignore */ }
    });
  }

  startedWin.on("closed", () => {
    startedWin = null;
  });

}
//Dashboard Window
function dashboardWindow() {
  dashboardWin = new BrowserWindow({
    width: 900,
    height: 900,
    minHeight: 650,
    minWidth: 850,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "../source/load.js"),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  dashboardWin.loadFile(path.join(__dirname, "../main/dash.html"));

  dashboardWin.once('ready-to-show', () => {
    dashboardWin.show();
  });
  // In packaged builds, block refresh/devtools keyboard shortcuts
  if (!isDev && dashboardWin && dashboardWin.webContents) {
    dashboardWin.webContents.on('before-input-event', (event, input) => {
      try {
        const key = (input.key || '').toLowerCase();
        const isCtrl = !!(input.control || input.meta);
        const isShift = !!input.shift;
        if ((isCtrl && key === 'r') || (isCtrl && isShift && key === 'r') || (isCtrl && isShift && key === 'i') || input.code === 'F12') {
          event.preventDefault();
        }
      } catch (e) { /* ignore */ }
    });
    dashboardWin.webContents.on('devtools-opened', () => {
      try { dashboardWin.webContents.closeDevTools(); } catch (e) { /* ignore */ }
    });
  }
  dashboardWin.on("closed", () => {
    dashboardWin = null;
  });
}

// -------------------------------------
// APP BOOT
// -------------------------------------
app.whenReady().then(async () => {
  try {
    await startBackend();
    const currentUser = store.get("currentUser");
    // Remove application menu in packaged builds to avoid built-in reload/devtools menu items
    if (!isDev) {
      try { Menu.setApplicationMenu(null); } catch (e) { /* ignore */ }
      // Register global shortcuts in production to further prevent reload/devtools
      try {
        // common reload keys
        globalShortcut.register('CommandOrControl+R', () => { });
        globalShortcut.register('CommandOrControl+Shift+R', () => { });
        // devtools
        globalShortcut.register('CommandOrControl+Shift+I', () => { });
        globalShortcut.register('F12', () => { });
      } catch (e) { /* ignore */ }
    }
    currentUser ? dashboardWindow() : startedWindow();
    console.log("Backend started successfully.");
  } catch (err) {
    console.error("Failed to start backend:", err);
    // ensure process is killed and quit gracefully
    if (PyAttendy) {
      try { PyAttendy.kill(); } catch (e) { }
    }
    app.quit();
  }
});

// -------------------------------------
// Session IPC
// -------------------------------------
ipcMain.handle("save-session", (_, user) => {
  store.set("currentUser", user);
});

ipcMain.handle("get-session", () => {
  return store.get("currentUser");
});

ipcMain.handle("logout", () => {
  store.delete("currentUser");

  if (dashboardWin) dashboardWin.close();
  startedWindow();
});

ipcMain.on("open-dashboard", () => {
  if (startedWin) startedWin.close();
  dashboardWindow();
});

// -------------------------------------
// Cleanup on quit
// -------------------------------------
app.on("before-quit", () => {
  if (PyAttendy) {
    try {
      PyAttendy.kill();
    } catch (e) {
      console.error("Failed to kill backend process:", e);
    }
  }
  // unregister global shortcuts when quitting
  try { globalShortcut.unregisterAll(); } catch (e) { /* ignore */ }
});
