import { randomUUID } from "crypto";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import {
  app,
  BrowserWindow,
  IpcMain,
  IpcMainEvent,
  ipcMain as ipcMainOrigin,
  session,
  shell,
} from "electron";
import log from "electron-log";
import windowStateKeeper from "electron-window-state";
import { join } from "path";
import { dbManager } from "./db/db-manager.js";
import {
  IpcMainEventMap,
  IpcMainSend,
  IpcRendererEventMap,
  IpcRendererSend,
} from "./events.js";
import windowsInit from "./handlers/windows.js";

log.initialize();
export const console = log;
dayjs.extend(customParseFormat);

let mainWindow: BrowserWindow;
let list: string[];

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
    listener: (event: IpcMainEvent, ...args: IpcRendererEventMap[T]) => void,
  ) => void;
} = ipcMainOrigin;

function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
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
  mainWindowState.manage(mainWindow);

  if (process.env.NODE_ENV === "development") {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`).then(() => {
      send(
        IpcMainSend.WindowStatusChange,
        randomUUID(),
        mainWindow.isMaximized(),
      );
    });
    mainWindow.webContents.openDevTools({ mode: "detach" });
    // 개발 환경에서만 상태 저장 수동 (개발의 경우 정상 종료가 아니라 상태 저장이 안됨)
    const handleDevWindowStore = () => {
      mainWindowState.saveState(mainWindow);
    };
    mainWindow
      .addListener("move", handleDevWindowStore)
      .addListener("resize", handleDevWindowStore)
      .addListener("maximize", handleDevWindowStore)
      .addListener("unmaximize", handleDevWindowStore);
  } else {
    mainWindow
      .loadFile(join(app.getAppPath(), "renderer", "index.html"))
      .then(() => {
        send(
          IpcMainSend.WindowStatusChange,
          randomUUID(),
          mainWindow.isMaximized(),
        );
      });
  }

  mainWindow.on("maximize", () => {
    console.log("maximize");
    send(
      IpcMainSend.WindowStatusChange,
      randomUUID(),
      mainWindow.isMaximized(),
    );
  });
  mainWindow.on("unmaximize", () => {
    console.log("unmaximize");
    send(
      IpcMainSend.WindowStatusChange,
      randomUUID(),
      mainWindow.isMaximized(),
    );
  });
  mainWindow.on("enter-full-screen", () => {
    console.log("enter-full-screen");
    send(
      IpcMainSend.WindowStatusChange,
      randomUUID(),
      mainWindow.isMaximized(),
    );
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // 특정 도메인만 외부 브라우저로 열기
    const allowedDomains = ["github.com", "www.dlsite.com", "forms.gle"];
    if (
      allowedDomains.some((domain) =>
        details.url.startsWith("https://" + domain),
      )
    ) {
      shell.openExternal(details.url);
    }

    // Electron 내부 창 생성 차단
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-finish-load", () => {
    if (Array.isArray(list) && list.length > 0) {
      send(IpcMainSend.NeedMigration, randomUUID(), app.getVersion(), list);
      list = [];
    }
  });

  windowsInit(mainWindow);
}

app.whenReady().then(async () => {
  try {
    // 안전한 데이터베이스 초기화 (재시도 포함)
    list = await dbManager.initialize();

    console.log("데이터베이스 초기화 완료");
  } catch (error) {
    console.error("데이터베이스 초기화 최종 실패:", error);
    // 데이터베이스 초기화 실패 시에도 앱을 시작하도록 하지만 오류 로그 출력
    // 사용자에게 알림을 표시할 수도 있음
  }

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

// 애플리케이션 종료 시 데이터베이스 연결 정리
app.on("before-quit", async () => {
  try {
    // 데이터베이스 연결 종료
    await dbManager.destroy();
    console.log("데이터베이스 연결 종료 완료");
  } catch (error) {
    console.error("데이터베이스 연결 종료 실패:", error);
  }
});

import("./handlers/home.js");
import("./handlers/thumbnail.js");
import("./handlers/update.js");
import("./handlers/dlsite.js");
import("./handlers/setting.js");
