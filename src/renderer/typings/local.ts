export interface GameData {
  path: string;
  title: string;
  thumbnail?: string;
  cleared: boolean;
}

export interface SettingData {
  zoom: number;
  sources: string[];
  applySources: string[];
  home: {
    showAll: boolean;
    showRecent: boolean;
  };
  changeThumbnailFolder: [boolean, string];
  blur: boolean;
  dark: boolean;
  cookie: string;
  exclude: string[];
  search: [string, string];
}

export interface GameHistoryData {
  clearGame: string[];
  recentGame: string[];
}
