import type { IpcRenderer, IpcRendererEvent } from "electron";
import {
  IpcMainEventMap,
  IpcMainSend,
  IpcRendererEventMap,
  IpcRendererSend,
} from "../../main/events";

type Tail<T extends readonly unknown[]> = T extends readonly [
  any,
  ...infer Rest,
]
  ? Rest
  : [];

type Send = <T extends IpcRendererSend>(
  channel: T,
  id: string,
  ...args: Tail<IpcRendererEventMap[T]>
) => void;

export const api = window.require("electron").ipcRenderer as Omit<
  IpcRenderer,
  "send" | "on" | "once"
> & {
  send: Send;
  on: <T extends IpcMainSend>(
    channel: T,
    listener: (event: IpcRendererEvent, ...args: IpcMainEventMap[T]) => void,
  ) => void;
  once: <T extends IpcMainSend>(
    channel: T,
    listener: (event: IpcRendererEvent, ...args: IpcMainEventMap[T]) => void,
  ) => void;
};

export const send: <T extends IpcRendererSend>(
  channel: T,
  ...args: Tail<IpcRendererEventMap[T]>
) => string = (channel, ...args) => {
  const id = crypto.randomUUID() as string;
  api.send(channel, id, ...args);
  return id;
};

export const on: <T extends IpcMainSend>(
  channel: T,
  listener: (event: IpcRendererEvent, ...args: IpcMainEventMap[T]) => void,
) => () => void = (channel, listener) => {
  api.on(channel, listener);
  return () => api.off(channel, listener);
};

export const off: <T extends IpcMainSend>(
  channel: T,
  listener: (event: IpcRendererEvent, ...args: IpcMainEventMap[T]) => void,
) => void = (channel, listener) => {
  api.off(channel, listener);
};

export const sendApi = <T extends IpcRendererSend, R extends IpcMainSend>(
  channel: T,
  receiveChannel: R,
  ...args: Tail<IpcRendererEventMap[T]>
): Promise<IpcMainEventMap[R]> => {
  return new Promise((resolve, reject) => {
    const id = send(channel, ...args);
    const callback = (e: IpcRendererEvent, ...data: IpcMainEventMap[R]) => {
      if (data[0] !== id) {
        return;
      }

      api.off(receiveChannel, callback);
      resolve(data);
    };
    api.on(receiveChannel, callback);
    setTimeout(() => {
      api.off(receiveChannel, callback);
      reject(new Error(channel + ": 응답시간을 초과하였습니다."));
    }, 10000);
  });
};
