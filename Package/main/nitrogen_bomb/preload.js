// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  windowControl: (action) => ipcRenderer.send('window-control', action),
});

contextBridge.exposeInMainWorld("attendyAPI", {
  // Session Management
  saveSession: (user) => ipcRenderer.invoke("save-session", user),
  getSession: () => ipcRenderer.invoke("get-session"),
  logout: () => ipcRenderer.invoke("logout"),
  openDashboard: () => ipcRenderer.send("open-dashboard"),

  // Backend (Flask HTTP)
  async createUser(fullname, username, role) {
    const res = await fetch("http://localhost:5005/create_user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fullname, username, role })
    });

    return await res.json(); // returns user + QR base64
  },

  async generateQR(data) {
    const res = await fetch("http://localhost:5005/generate_qr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data) // fullname, username, role
    });

    return await res.json(); // returns { ok:true, data_url:"..." }
  }
});



