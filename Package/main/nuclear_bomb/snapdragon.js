// const { app, BrowserWindow, ipcMain } = require("electron");

// //path finder specifically for main folder since we use a custom 
// const path = require('path');
// const axios = require("axios");
// const Store = require('electron-store');

// const store = new Store();

import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import axios from "axios";
import Store from "electron-store";
import { fileURLToPath } from "url";


// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const store = new Store();

let startedmain = null;
let dashboardmain = null;
// ============================================ //

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

//Yeah whatever the fuck is this as soon as it works
ipcMain.on("save-onboarding", async (event, data) => {
  try {
    await axios.post("http://127.0.0.1:8000/onboarding", data);
    startedMain.close();
    dashboardWindow();
  } catch (e) {
    console.error("There was a problem parsing the following codes: ", e);
  }
});
//=========================================//

