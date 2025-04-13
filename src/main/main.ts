import { app, BrowserWindow, ipcMain, session } from "electron";
import { join } from "path";
import { IpcMainSend, IpcRendererSend } from "./events.js";

let mainWindow: BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    useContentSize: true,
    icon: join(import.meta.dirname, "./static/icon.ico"),
    titleBarStyle: "hidden",
    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });
  mainWindow.setMenu(null);

  if (process.env.NODE_ENV === "development") {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(app.getAppPath(), "renderer", "index.html"));
  }

  mainWindow.on("maximize", () => {
    console.log("maximize");
    send(IpcMainSend.WindowStatusChange, mainWindow.isMaximized());
  });
  mainWindow.on("unmaximize", () => {
    console.log("unmaximize");
    send(IpcMainSend.WindowStatusChange, mainWindow.isMaximized());
  });
  mainWindow.on("enter-full-screen", () => {
    console.log("enter-full-screen");
    send(IpcMainSend.WindowStatusChange, mainWindow.isMaximized());
  });
}

app.whenReady().then(() => {
  createWindow();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["script-src 'self'"],
      },
    });
  });

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

export function send(event: IpcMainSend, ...data: any[]) {
  console.log("main send!", event);
  mainWindow.webContents.send(event, ...data);
}

import "./handlers/home.js";
import "./handlers/setting.js";
import "./handlers/thumbnail.js";

ipcMain.on(IpcRendererSend.WindowMinimize, () => {
  console.log("main send!", IpcRendererSend.WindowMinimize);
  mainWindow.minimize();
});

ipcMain.on(IpcRendererSend.WindowMaximizeToggle, () => {
  console.log("main send!", IpcRendererSend.WindowMaximizeToggle);
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on(IpcRendererSend.WindowClose, () => {
  console.log("main send!", IpcRendererSend.WindowClose);
  mainWindow.close();
});
