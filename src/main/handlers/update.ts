import { app, ipcMain, shell } from "electron";
import log from "electron-log";
import * as ElectronUpdater from "electron-updater";
import { dirname } from "path";
import { IpcMainSend, IpcRendererSend } from "../events.js";
import { send } from "../main.js";
const { autoUpdater } = (ElectronUpdater as any)
  .default as typeof ElectronUpdater;
const console = log;

app.on("ready", () => {
  // 포터블 버전은 업데이트 지원 안함..
  autoUpdater.on("update-available", async (updateInfo) => {
    console.log("updateInfo", updateInfo);
    send(IpcMainSend.Message, {
      type: "info",
      message: "업데이트가 존재합니다. 업데이트 파일을 다운로드 받습니다.",
    });
    const download = await autoUpdater.downloadUpdate();
    console.log("download", download);
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log(progress);
    send(IpcMainSend.UpdateDownloadProgress, progress.percent);
  });

  autoUpdater.on("update-downloaded", async () => {
    send(IpcMainSend.UpdateDownloadProgress, 1);
  });

  ipcMain.on(IpcRendererSend.UpdateCheck, async () => {
    console.log(
      "PORTABLE_EXECUTABLE_FILE",
      process.env.PORTABLE_EXECUTABLE_FILE
    );
    if (process.env.PORTABLE_EXECUTABLE_FILE !== undefined) {
      send(IpcMainSend.Message, {
        type: "info",
        message:
          "포터블 버전은 업데이트를 지원하지 않습니다. Github에서 확인해주세요.",
      });
      return;
    }

    const updateInfo = await autoUpdater.checkForUpdates();
    console.log("updateInfo", updateInfo);

    if (!updateInfo?.isUpdateAvailable) {
      send(IpcMainSend.Message, {
        type: "info",
        message: "최신 버전입니다.",
      });
    }
  });

  ipcMain.on(IpcRendererSend.VersionCheck, () => {
    send(IpcMainSend.VersionChecked, app.getVersion());
  });

  ipcMain.on(IpcRendererSend.OpenLogFolder, async () => {
    await shell.openPath(dirname(log.transports.file.getFile().path));
  });

  ipcMain.on(IpcRendererSend.Restart, async () => {
    autoUpdater.quitAndInstall();
  });

  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 1000 * 60 * 10);
});
