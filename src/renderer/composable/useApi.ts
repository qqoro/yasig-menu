import type { IpcRenderer, IpcRendererEvent } from "electron";
import {
  IpcMainEventMap,
  IpcMainSend,
  IpcRendererEventMap,
  IpcRendererSend,
} from "../events";
import { useSetting } from "../store/setting-store";

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
  "send"
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

export const useLoadList = () => {
  const api = useApi();
  const setting = useSetting();

  const [isChange, thumbnailFolder] = setting.changeThumbnailFolder;
  api.send(IpcRendererSend.LoadList, {
    sources: [...setting.applySources],
    exclude: [...setting.exclude],
    thumbnailFolder: isChange ? thumbnailFolder : undefined,
  });
};
