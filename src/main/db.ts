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
    games.string("thumbnail").nullable().defaultTo(null);
    games.string("rjCode").nullable().defaultTo(null);
    games.date("publishDate").nullable().defaultTo(null);
    games.string("makerName").nullable().defaultTo(null);
    games.string("category").nullable().defaultTo(null);
    // TODO: tags 정규화하기
    games.string("tags").nullable().defaultTo(null);
    games.boolean("isHidden").defaultTo(false);
    games.boolean("isClear").defaultTo(false);
    games.boolean("isRecent").defaultTo(false);
    games.boolean("isCompressFile").defaultTo(false);
    games.datetime("createdAt").defaultTo(db.fn.now());
    games.datetime("updatedAt").nullable();
  });
}

interface TableBaseColumn {
  createdAt: Date | Knex.Raw;
  updatedAt: Date | Knex.Raw | null;
}

export interface Game extends TableBaseColumn {
  path: string;
  title: string;
  thumbnail: string | null;
  rjCode: string | null;
  isHidden: boolean;
  isClear: boolean;
  isRecent: boolean;
  isCompressFile: boolean;
}
export type InsertGame = Pick<Game, "path" | "title"> & Partial<Game>;
export type UpdateGame = Partial<Game>;

declare module "knex/types/tables.js" {
  interface Tables {
    games: Knex.CompositeTableType<Game, InsertGame, UpdateGame>;
  }
}
