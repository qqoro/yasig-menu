import { ToastT } from "vue-sonner";
import { Game, Setting, UpdateSetting } from "./db/db.js";

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

  LoadedSetting = "LoadedSetting",

  ThumbnailDone = "ThumbnailDone",
}

export interface IpcMainEventMap
  extends EnforceAllKeys<
    IpcMainSend,
    {
      [IpcMainSend.WindowStatusChange]: [id: string, boolean];
      [IpcMainSend.UpdateChecked]: [id: string, boolean];
      [IpcMainSend.UpdateDownloadProgress]: [id: string, number];
      [IpcMainSend.VersionChecked]: [id: string, string];

      [IpcMainSend.LoadedList]: [id: string, Game[]];
      [IpcMainSend.Message]: [
        id: string,
        {
          type: "success" | "info" | "warning" | "error";
          message: string;
        } & Omit<ToastT, "id" | "type">
      ];

      [IpcMainSend.LoadedSetting]: [id: string, setting: Setting];

      [IpcMainSend.ThumbnailDone]: [id: string, string];
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

  LoadSetting = "LoadSetting",
  UpdateSetting = "UpdateSetting",

  Play = "Play",
  OpenFolder = "OpenFolder",
  Hide = "Hide",
  Recent = "Recent",
  Clear = "Clear",
  Memo = "Memo",

  ThumbnailDownload = "ThumbnailDownload",
  ThumbnailDelete = "ThumbnailDelete",
}

export interface IpcRendererEventMap
  extends EnforceAllKeys<
    IpcRendererSend,
    {
      [IpcRendererSend.WindowMinimize]: [id: string];
      [IpcRendererSend.WindowMaximizeToggle]: [id: string];
      [IpcRendererSend.WindowClose]: [id: string];
      [IpcRendererSend.UpdateCheck]: [id: string];
      [IpcRendererSend.VersionCheck]: [id: string];
      [IpcRendererSend.ToggleDevTools]: [id: string];
      [IpcRendererSend.OpenLogFolder]: [id: string];
      [IpcRendererSend.Restart]: [id: string];

      [IpcRendererSend.LoadList]: [id: string, options?: WhereGame];
      [IpcRendererSend.CleanCache]: [id: string];

      [IpcRendererSend.LoadSetting]: [id: string];
      [IpcRendererSend.UpdateSetting]: [id: string, data: UpdateSetting];

      [IpcRendererSend.Play]: [id: string, path: string, exclude?: string[]];
      [IpcRendererSend.OpenFolder]: [id: string, path: string];
      [IpcRendererSend.Hide]: [id: string, { path: string; isHidden: boolean }];
      [IpcRendererSend.Recent]: [
        id: string,
        { path: string; isRecent: boolean }
      ];
      [IpcRendererSend.Clear]: [id: string, { path: string; isClear: boolean }];
      [IpcRendererSend.Memo]: [
        id: string,
        { path: string; memo: string | null }
      ];

      [IpcRendererSend.ThumbnailDownload]: [
        id: string,
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
      [IpcRendererSend.ThumbnailDelete]: [id: string, path: string];
    }
  > {}

export type WhereGame = Partial<
  Pick<
    Game,
    | "title"
    | "makerName"
    | "category"
    | "tags"
    | "isHidden"
    | "isClear"
    | "isRecent"
    | "isCompressFile"
  >
>;
