import type { Knex } from "knex";
import knex from "knex";

export const db = knex({
  client: "better-sqlite3",
  // TODO: 개발 완료 후 파일로 변경
  connection: ":memory:",
  useNullAsDefault: true,
});

if (!(await db.schema.hasTable("games"))) {
  await db.schema.createTable("games", (games) => {
    games.string("path").notNullable().primary();
    games.string("title").notNullable();
    games.string("source").notNullable().index();
    games.string("thumbnail").nullable().defaultTo(null);
    games.string("rjCode", 10).nullable().defaultTo(null);
    games.string("memo").nullable().defaultTo(null);
    games.date("publishDate").nullable().defaultTo(null);
    games.string("makerName", 200).nullable().defaultTo(null);
    games.string("category", 200).nullable().defaultTo(null);
    // TODO: tags 정규화하기
    games.string("tags").nullable().defaultTo(null);
    games.boolean("isHidden").defaultTo(false);
    games.boolean("isClear").defaultTo(false);
    games.boolean("isRecent").defaultTo(false);
    games.boolean("isCompressFile").defaultTo(false);
    games.timestamp("createdAt", { useTz: false }).defaultTo(db.fn.now());
    games.timestamp("updatedAt", { useTz: false }).nullable();
  });
}

if (!(await db.schema.hasTable("setting"))) {
  await db.schema.createTable("setting", (setting) => {
    setting.string("sources").defaultTo(JSON.stringify([])).notNullable();
    setting.string("applySources").defaultTo(JSON.stringify([])).nullable();
    setting.boolean("changeThumbnailFolder").defaultTo(false).notNullable();
    setting.string("newThumbnailFolder").defaultTo("").notNullable();
    setting.string("cookie").defaultTo("").notNullable();
    setting
      .string("search")
      .defaultTo(JSON.stringify(["", ""]))
      .notNullable();
    setting
      .string("playExclude")
      .defaultTo(JSON.stringify(["notification_helper", "UnityCrashHandler64"]))
      .notNullable();
    setting.timestamp("createdAt", { useTz: false }).defaultTo(db.fn.now());
    setting.timestamp("updatedAt", { useTz: false }).nullable();
  });
}

// setting값 초기 설정
if ((await db("setting").count({ count: "*" }))[0]["count"] === 0) {
  await db("setting").insert({});
}

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
}
export type InsertGame = Pick<Game, "path" | "title" | "source"> &
  Partial<Game>;
export type UpdateGame = Partial<Game>;

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
    setting: Knex.CompositeTableType<Setting, InsertSetting, UpdateSetting>;
  }
}
