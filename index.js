require("dotenv").config();
const { app, BrowserWindow, ipcMain, Menu, BrowserView } = require("electron");
const { autoUpdater } = require("electron-updater");
const { session } = require("electron");
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15";
console.log("user agent: ", userAgent);

const filter = {
  urls: ["https://*/*"],
};
let win;
const isMac = process.platform === "darwin";
const template = [
  // { role: 'fileMenu' }
  {
    label: "Archivo",
    submenu: [
      isMac
        ? { role: "close", label: "Salir" }
        : { role: "quit", label: "Salir" },
    ],
  },
  // { role: 'editMenu' }
  {
    label: "Opciones",
    submenu: [
      {
        label: "Reiniciar revisión",
        click: async () => {
          win.webContents.send("reload");
        },
      },
      {
        label: "Consola principal",
        click: async () => {
          win.openDevTools();
        },
      },
      {
        label: "Consola RUNT",
        click: async () => {
          win.webContents.send("openConsole", { platform: "RUNT" });
        },
      },
      {
        label: "Consola PAYNET",
        click: async () => {
          win.webContents.send("openConsole", { platform: "PAYNET" });
        },
      },
      {
        label: "Consola SICOV",
        click: async () => {
          win.webContents.send("openConsole", { platform: "SICOV" });
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

function createWindow() {
  win = new BrowserWindow({
    show: false,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      allowRunningInsecureContent: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
  win.maximize();
  win.show();
}

app
  .whenReady()
  .then(createWindow)
  .then(() => {
    console.log("Checking for updates");
    autoUpdater.checkForUpdatesAndNotify();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

autoUpdater.on("update-available", () => {
  console.log("update-available");
  win.webContents.send("update_available");
});
autoUpdater.on("update-downloaded", () => {
  console.log("update downloaded");
  win.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", () => {
  autoUpdater.quitAndInstall();
});
