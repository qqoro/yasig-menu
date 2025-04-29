import {
  app,
  BrowserWindow,
  IpcMain,
  IpcMainEvent,
  ipcMain as ipcMainOrigin,
  session,
  shell,
} from "electron";
import { join } from "path";
import {
  IpcMainEventMap,
  IpcMainSend,
  IpcRendererEventMap,
  IpcRendererSend,
} from "./events.js";
import windowsInit from "./handlers/windows.js";

import log from "electron-log";
log.initialize();
export const console = log;

let mainWindow: BrowserWindow;

export function send<T extends IpcMainSend>(
  event: T,
  ...data: IpcMainEventMap[T]
) {
  // console.log("main send!", event, "data:", data);
  console.log("main send!", event);
  mainWindow.webContents.send(event, ...data);
}

export const ipcMain: Omit<IpcMain, "on"> & {
  on: <T extends IpcRendererSend>(
    channel: T,
    listener: (event: IpcMainEvent, ...args: IpcRendererEventMap[T]) => void
  ) => void;
} = ipcMainOrigin;

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

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // 특정 도메인만 외부 브라우저로 열기
    const allowedDomains = ["github.com", "www.dlsite.com", "forms.gle"];
    if (
      allowedDomains.some((domain) =>
        details.url.startsWith("https://" + domain)
      )
    ) {
      shell.openExternal(details.url);
    }

    // Electron 내부 창 생성 차단
    return { action: "deny" };
  });

  windowsInit(mainWindow);
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

import("./handlers/home.js");
import("./handlers/thumbnail.js");
import("./handlers/update.js");
