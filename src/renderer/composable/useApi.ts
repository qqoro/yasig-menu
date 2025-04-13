import type { IpcRenderer } from "electron";

export const useApi = () => {
  return window.require("electron").ipcRenderer as IpcRenderer;
};
