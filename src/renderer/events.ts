export enum IpcMainSend {
  WindowStatusChange = "WindowStatusChange",

  SourceSaved = "SourceSaved",
  LoadedList = "LoadedList",
  Message = "Message",

  ThumbnailDownloaded = "ThumbnailDownloaded",
  ThumbnailDone = "ThumbnailDone",
}

export enum IpcRendererSend {
  WindowMinimize = "WindowMinimize",
  WindowMaximizeToggle = "WindowMaximizeToggle",
  WindowClose = "WindowClose",

  SourceSave = "SourceSave",
  LoadList = "LoadList",

  Play = "Play",
  OpenFolder = "OpenFolder",
  Hide = "Hide",

  ThumbnailDownload = "ThumbnailDownload",
  ThumbnailDelete = "ThumbnailDelete",
}
