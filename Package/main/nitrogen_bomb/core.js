import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import Store from "electron-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;
const store = new Store();

let pythonProcess;
let startedMain;
let dashboardMain;

// -------------------------------------
// Backend Launchers
// -------------------------------------
function AttendyEngine() {
    if (isDev) {
        // during development — spawn the Python script directly
        pythonProcess = spawn('python', [path.join(__dirname, '../nuclear_reactor/attendy_engine.py')]);
    } else {
        // in production / packaged mode — run bundled Python executable
        const exePath = path.join(process.resourcesPath, 'atom', 'attendy_engine.exe');
        pythonProcess = execFile(exePath);
    }

    pythonProcess.stdout.on("data", data =>
        console.log("Python log -", data.toString())
    );

    pythonProcess.stderr.on("data", data =>
        console.error("Python log -", data.toString())
    );

    console.log("Flask Attendy Edition backend started!!");
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
// Windows
// -------------------------------------
function startedWindow() {
    startedMain = new BrowserWindow({
        width: 500,
        height: 650,
        titleBarStyle: "hidden",
        webPreferences: {
            preload: path.join(__dirname, "../nitrogen_bomb/preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    startedMain.loadFile(path.join(__dirname, "../package/started.html"));

    startedMain.once('ready-to-show', () => {
        startedMain.show();

        if (isDev) {
            startedMain.webContents.openDevTools();
        }
    });

    startedMain.on("closed", () => {
        startedMain = null;
    });
}

function dashboardWindow() {
    dashboardMain = new BrowserWindow({
        width: 900,
        height: 900,
        titleBarStyle: "hidden",
        webPreferences: {
            preload: path.join(__dirname, "../nitrogen_bomb/preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    dashboardMain.loadFile(path.join(__dirname, "../package/dashboard/index.html"));

    dashboardMain.once('ready-to-show', () => {
        dashboardMain.show();

        if (isDev) {
            dashboardMain.webContents.openDevTools();
        }
    });
    dashboardMain.on("closed", () => {
        dashboardMain = null;
    });
}

// -------------------------------------
// APP BOOT
// -------------------------------------
app.whenReady().then(() => {
    AttendyEngine();

    const currentUser = store.get("currentUser");
    currentUser ? dashboardWindow() : startedWindow();
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

    if (dashboardMain) dashboardMain.close();
    startedWindow();
});

ipcMain.on("open-dashboard", () => {
    if (startedMain) startedMain.close();
    dashboardWindow();
});

// -------------------------------------
// Cleanup on quit
// -------------------------------------
app.on("before-quit", () => {
    if (pythonProcess) pythonProcess.kill();
});
