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
  GameInfoReloaded = "GameInfoReloaded",

  LoadedSetting = "LoadedSetting",

  ThumbnailDone = "ThumbnailDone",

  NeedMigration = "NeedMigration",
  MigrationDone = "MigrationDone",
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
      [IpcMainSend.GameInfoReloaded]: [id: string, result: Game | null];

      [IpcMainSend.LoadedSetting]: [id: string, setting: Setting];

      [IpcMainSend.ThumbnailDone]: [id: string, string];

      [IpcMainSend.NeedMigration]: [
        id: string,
        version: string,
        list: string[]
      ];
      [IpcMainSend.MigrationDone]: [id: string, version: string];
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

  LoadSetting = "LoadSetting",
  UpdateSetting = "UpdateSetting",

  Play = "Play",
  OpenFolder = "OpenFolder",
  Hide = "Hide",
  Recent = "Recent",
  Favorite = "Favorite",
  Clear = "Clear",
  Memo = "Memo",
  UpdateGame = "UpdateGame",
  GameInfoReload = "GameInfoReload",

  ThumbnailDownload = "ThumbnailDownload",
  ThumbnailDelete = "ThumbnailDelete",

  MigrationData = "MigrationData",
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

      [IpcRendererSend.LoadSetting]: [id: string];
      [IpcRendererSend.UpdateSetting]: [id: string, data: UpdateSetting];

      [IpcRendererSend.Play]: [id: string, path: string];
      [IpcRendererSend.OpenFolder]: [id: string, path: string];
      [IpcRendererSend.Hide]: [id: string, { path: string; isHidden: boolean }];
      [IpcRendererSend.Recent]: [
        id: string,
        { path: string; isRecent: boolean }
      ];
      [IpcRendererSend.Favorite]: [
        id: string,
        { path: string; isFavorite: boolean }
      ];
      [IpcRendererSend.Clear]: [id: string, { path: string; isClear: boolean }];
      [IpcRendererSend.Memo]: [
        id: string,
        { path: string; memo: string | null }
      ];
      [IpcRendererSend.UpdateGame]: [
        id: string,
        {
          path: string;
          gameData: Partial<
            Pick<
              Game,
              | "title"
              | "publishDate"
              | "makerName"
              | "category"
              | "tags"
              | "memo"
            >
          >;
        }
      ];
      [IpcRendererSend.GameInfoReload]: [id: string, { path: string }];

      [IpcRendererSend.ThumbnailDownload]: [
        id: string,
        {
          path: string;
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

      [IpcRendererSend.MigrationData]: [
        id: string,
        setting: Record<string, any>
      ];
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
