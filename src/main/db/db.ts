import type { Knex } from "knex";

type SqliteBoolean = 0 | 1 | boolean;

interface TableBaseColumn {
  createdAt: Date | Knex.Raw;
  updatedAt: Date | Knex.Raw | null;
}

export interface Game extends TableBaseColumn {
  path: string;
  title: string;
  source: string;
  thumbnail: string | null;
  rjCode: string | null;
  memo: string | null;
  publishDate: Date | Knex.Raw | null;
  makerName: string | null;
  category: string | null;
  tags: string | null;
  isHidden: SqliteBoolean;
  isClear: SqliteBoolean;
  isRecent: SqliteBoolean;
  isCompressFile: SqliteBoolean;
  isLoadedInfo: SqliteBoolean;
}
export type InsertGame = Pick<Game, "path" | "title" | "source"> &
  Partial<Game>;
export type UpdateGame = Partial<Game>;

export interface Tag {
  id: string;
  tag: string;
}

export interface GameTag {
  gamePath: string;
  tagId: string;
}

export interface Setting extends TableBaseColumn {
  sources: string[];
  applySources: string[];
  changeThumbnailFolder: SqliteBoolean;
  newThumbnailFolder: string;
  cookie: string;
  search: [string, string];
  playExclude: string[];
}
export interface InsertSetting extends Partial<TableBaseColumn> {
  sources?: string;
  applySources?: string;
  changeThumbnailFolder?: SqliteBoolean;
  newThumbnailFolder?: string;
  cookie?: string;
  search?: string;
  playExclude?: string;
}
export type UpdateSetting = Partial<InsertSetting>;

declare module "knex/types/tables.js" {
  interface Tables {
    games: Knex.CompositeTableType<Game, InsertGame, UpdateGame>;
    tags: Knex.CompositeTableType<Tag, Tag, Tag>;
    gameTags: Knex.CompositeTableType<GameTag, GameTag, GameTag>;
    setting: Knex.CompositeTableType<Setting, InsertSetting, UpdateSetting>;
  }
}
