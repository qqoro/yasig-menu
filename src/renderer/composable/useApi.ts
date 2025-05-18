import type { IpcRenderer, IpcRendererEvent } from "electron";
import {
  IpcMainEventMap,
  IpcMainSend,
  IpcRendererEventMap,
  IpcRendererSend,
} from "../../main/events";

type Send = <T extends IpcRendererSend>(
  channel: T,
  ...args: IpcRendererEventMap[T]
) => void;

export const useApi = () => {
  return window.require("electron").ipcRenderer as Omit<IpcRenderer, "send"> & {
    send: Send;
  };
};

export const api = window.require("electron").ipcRenderer as Omit<
  IpcRenderer,
  "send" | "on" | "once"
> & {
  send: Send;
  on: <T extends IpcMainSend>(
    channel: T,
    listener: (event: IpcRendererEvent, ...args: IpcMainEventMap[T]) => void
  ) => void;
  once: <T extends IpcMainSend>(
    channel: T,
    listener: (event: IpcRendererEvent, ...args: IpcMainEventMap[T]) => void
  ) => void;
};

export const sendApi = <T extends IpcRendererSend, R extends IpcMainSend>(
  channel: T,
  receiveChannel: R,
  ...args: IpcRendererEventMap[T]
): Promise<IpcMainEventMap[R]> => {
  return new Promise((resolve, reject) => {
    api.send(channel, ...args);
    const callback = (e: IpcRendererEvent, ...data: IpcMainEventMap[R]) => {
      resolve(data);
    };
    api.once(receiveChannel, callback);
    setTimeout(() => {
      api.removeListener(receiveChannel, callback);
      reject(new Error("응답시간을 초과하였습니다."));
    }, 5000);
  });
};
