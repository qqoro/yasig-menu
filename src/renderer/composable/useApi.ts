import type { IpcRenderer } from "electron";
import { IpcRendererEventMap, IpcRendererSend } from "../events";

type Send = <T extends IpcRendererSend>(
  channel: T,
  ...args: IpcRendererEventMap[T]
) => void;

export const useApi = () => {
  return window.require("electron").ipcRenderer as Omit<IpcRenderer, "send"> & {
    send: Send;
  };
};
