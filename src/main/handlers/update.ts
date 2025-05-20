import { app, shell } from "electron";
import log from "electron-log";
import * as ElectronUpdater from "electron-updater";
import { dirname } from "path";
import { IpcMainSend, IpcRendererSend } from "../events.js";
import { console, ipcMain, send } from "../main.js";
const { autoUpdater } = (ElectronUpdater as any)
  .default as typeof ElectronUpdater;

let startDownload = false;
ipcMain.on(IpcRendererSend.UpdateCheck, async () => {
  // 포터블 버전은 직접 API호출하여 확인
  if (process.env.PORTABLE_EXECUTABLE_FILE !== undefined) {
    const result = await updateCheckForPortable();
    console.log("result", result, "current version", app.getVersion());

    if (result.tagName !== "v" + app.getVersion()) {
      send(IpcMainSend.Message, {
        type: "info",
        message:
          "업데이트 버전이 존재합니다. 포터블 버전은 자동 업데이트를 지원하지 않으므로 Github에서 다운로드 해주세요.",
      });
    } else {
      send(IpcMainSend.Message, {
        type: "info",
        message: "최신 버전을 사용하고 있습니다.",
      });
    }
    return;
  }

  // 업데이트 존재하는 경우 `update-available` 이벤트로 진행
  const updateInfo = await autoUpdater.checkForUpdates();
  if (!updateInfo?.isUpdateAvailable) {
    send(IpcMainSend.Message, {
      type: "info",
      message: "최신 버전을 사용하고 있습니다.",
    });
  }
});

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
  startDownload = true;
  console.log(progress);
  send(IpcMainSend.UpdateDownloadProgress, progress.percent);
});

autoUpdater.on("update-downloaded", async () => {
  startDownload = true;
  send(IpcMainSend.UpdateDownloadProgress, 100);
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

autoUpdater.checkForUpdates();
setInterval(() => {
  if (startDownload) {
    return;
  }
  autoUpdater.checkForUpdates();
}, 1000 * 60 * 10);

const updateCheckForPortable = async () => {
  const url = `https://api.github.com/repos/qqoro/yasig-menu/releases/latest`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    return data; // 전체 릴리즈 정보 반환
  } catch (error) {
    console.error("최신 릴리즈 정보 가져오기 실패:", error);
    return null;
  }
};
