import type { ToastT } from "vue-sonner";

type EnforceAllKeys<
  E extends IpcMainSend | IpcRendererSend,
  T extends Record<E, any[]>
> = T;

export enum IpcMainSend {
  WindowStatusChange = "WindowStatusChange",
  UpdateChecked = "UpdateChecked",
  UpdateDownloadProgress = "UpdateDownloadProgress",
  VersionChecked = "VersionChecked",

  LoadedList = "LoadedList",
  Message = "Message",

  ThumbnailDone = "ThumbnailDone",
}

export interface IpcMainEventMap
  extends EnforceAllKeys<
    IpcMainSend,
    {
      [IpcMainSend.WindowStatusChange]: [boolean];
      [IpcMainSend.UpdateChecked]: [boolean];
      [IpcMainSend.UpdateDownloadProgress]: [number];
      [IpcMainSend.VersionChecked]: [string];

      [IpcMainSend.LoadedList]: [
        { path: string; title: string; thumbnail?: string }[]
      ];
      [IpcMainSend.Message]: [
        Omit<
          {
            message: string;
          } & ToastT,
          "id"
        >
      ];

      [IpcMainSend.ThumbnailDone]: [string];
    }
  > {}

export enum IpcRendererSend {
  WindowMinimize = "WindowMinimize",
  WindowMaximizeToggle = "WindowMaximizeToggle",
  WindowClose = "WindowClose",
  UpdateCheck = "UpdateCheck",
  VersionCheck = "VersionCheck",
  ToggleDevTools = "ToggleDevTools",
  OpenLogFolder = "OpenLogFolder",
  Restart = "Restart",

  LoadList = "LoadList",

  Play = "Play",
  OpenFolder = "OpenFolder",
  Hide = "Hide",

  ThumbnailDownload = "ThumbnailDownload",
  ThumbnailDelete = "ThumbnailDelete",
}

export interface IpcRendererEventMap
  extends EnforceAllKeys<
    IpcRendererSend,
    {
      [IpcRendererSend.WindowMinimize]: [];
      [IpcRendererSend.WindowMaximizeToggle]: [];
      [IpcRendererSend.WindowClose]: [];
      [IpcRendererSend.UpdateCheck]: [];
      [IpcRendererSend.VersionCheck]: [];
      [IpcRendererSend.ToggleDevTools]: [];
      [IpcRendererSend.OpenLogFolder]: [];
      [IpcRendererSend.Restart]: [];

      [IpcRendererSend.LoadList]: [
        {
          sources: string[];
          exclude: string[];
          thumbnailFolder?: string;
        }
      ];

      [IpcRendererSend.Play]: [string];
      [IpcRendererSend.OpenFolder]: [string];
      [IpcRendererSend.Hide]: [string];

      [IpcRendererSend.ThumbnailDownload]: [
        {
          filePath: string;
          cookie: string;
          search: [string, string];
          savePath?: string;
        }
      ];
      [IpcRendererSend.ThumbnailDelete]: [string];
    }
  > {}
