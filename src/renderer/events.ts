import { ToastT } from "vue-sonner";

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
        {
          type: "success" | "info" | "warning" | "error";
          message: string;
        } & Omit<ToastT, "id" | "type">
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
  CleanCache = "CleanCache",

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
          hideZipFile: boolean;
        }
      ];
      [IpcRendererSend.CleanCache]: [];

      [IpcRendererSend.Play]: [path: string, exclude?: string[]];
      [IpcRendererSend.OpenFolder]: [string];
      [IpcRendererSend.Hide]: [string];

      [IpcRendererSend.ThumbnailDownload]: [
        {
          filePath: string;
          cookie: string;
          search: [string, string];
          savePath?: string;
          /**
           * 해당 값이 존재하는 경우 검색을 시도하지 않고 바로 해당 파일을 업로드합니다.
           */
          file?: {
            data: ArrayBuffer;
            ext: string;
          };
          /**
           * 해당 값이 존재하는 경우 검색을 시도하지 않고 바로 주소에서 다운로드합니다.
           */
          url?: string;
        }
      ];
      [IpcRendererSend.ThumbnailDelete]: [string];
    }
  > {}
