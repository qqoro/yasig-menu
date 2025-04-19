import { BrowserWindow } from "electron";
import { IpcRendererSend } from "../events.js";
import { ipcMain } from "../main.js";

export default function windowsInit(mainWindow: BrowserWindow) {
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

  ipcMain.on(IpcRendererSend.ToggleDevTools, () => {
    mainWindow.webContents.toggleDevTools();
  });
}
