type EnforceAllKeys<T extends Record<keyof typeof IpcMainSend, any[]>> = T;

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
  extends EnforceAllKeys<{
    [IpcMainSend.WindowStatusChange]: [boolean];
    [IpcMainSend.UpdateChecked]: [boolean];
    [IpcMainSend.UpdateDownloadProgress]: [number];
    [IpcMainSend.VersionChecked]: [string];

    [IpcMainSend.LoadedList]: [
      { path: string; title: string; thumbnail?: string }[]
    ];
    [IpcMainSend.Message]: [
      {
        type: "info" | "success" | "warning" | "error";
        message: string;
        description?: string;
      }
    ];

    [IpcMainSend.ThumbnailDone]: [string];
  }> {}

export enum IpcRendererSend {
  WindowMinimize = "WindowMinimize",
  WindowMaximizeToggle = "WindowMaximizeToggle",
  WindowClose = "WindowClose",
  UpdateCheck = "UpdateCheck",
  VersionCheck = "VersionCheck",
  ToggleDevTools = "ToggleDevTools",
  OpenLogFolder = "OpenLogFolder",
  Restart = "Restart",

  SourceSave = "SourceSave",
  LoadList = "LoadList",

  Play = "Play",
  OpenFolder = "OpenFolder",
  Hide = "Hide",

  ThumbnailDownload = "ThumbnailDownload",
  ThumbnailDelete = "ThumbnailDelete",
}
