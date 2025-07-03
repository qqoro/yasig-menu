import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // games 테이블 생성
  if (!(await knex.schema.hasTable("games"))) {
    await knex.schema.createTable("games", (table) => {
      table.string("path").notNullable().primary();
      table.string("title").notNullable();
      table.string("source").notNullable().index();
      table.string("thumbnail").nullable().defaultTo(null);
      table.string("rjCode", 10).nullable().defaultTo(null);
      table.string("memo").nullable().defaultTo(null);
      table.date("publishDate").nullable().defaultTo(null);
      table.string("makerName", 200).nullable().defaultTo(null);
      table.string("category", 200).nullable().defaultTo(null);
      table.string("tags").nullable().defaultTo(null);
      table.boolean("isHidden").defaultTo(false);
      table.boolean("isClear").defaultTo(false);
      table.boolean("isRecent").defaultTo(false);
      table.boolean("isCompressFile").defaultTo(false);
      table.boolean("isLoadedInfo").defaultTo(false);
      table.timestamp("createdAt", { useTz: false }).defaultTo(knex.fn.now());
      table.timestamp("updatedAt", { useTz: false }).nullable();
    });
  }

  // tags 테이블 생성
  if (!(await knex.schema.hasTable("tags"))) {
    await knex.schema.createTable("tags", (table) => {
      table.string("id", 50).primary();
      table.string("tag", 200).notNullable().unique();
    });
  }

  // gameTags 테이블 생성
  if (!(await knex.schema.hasTable("gameTags"))) {
    await knex.schema.createTable("gameTags", (table) => {
      table.string("gamePath").notNullable();
      table.string("tagId").notNullable();
      table.foreign("gamePath").references("games.path").onDelete("CASCADE");
      table.foreign("tagId").references("tags.id").onDelete("CASCADE");
      table.primary(["gamePath", "tagId"]);
    });
  }

  // setting 테이블 생성
  if (!(await knex.schema.hasTable("setting"))) {
    await knex.schema.createTable("setting", (table) => {
      table.increments("id").primary();
      table.string("sources").defaultTo(JSON.stringify([])).notNullable();
      table.string("applySources").defaultTo(JSON.stringify([])).nullable();
      table.boolean("changeThumbnailFolder").defaultTo(false).notNullable();
      table.string("newThumbnailFolder").defaultTo("").notNullable();
      table.string("cookie").defaultTo("").notNullable();
      table.boolean("showAll").defaultTo(false).notNullable();
      table.boolean("showRecent").defaultTo(true).notNullable();
      table.boolean("blur").defaultTo(false).notNullable();
      table.boolean("dark").defaultTo(false).notNullable();
      table.integer("zoom").defaultTo(50).notNullable().checkBetween([0, 100]);
      table
        .string("search")
        .defaultTo(JSON.stringify(["", ""]))
        .notNullable();
      table
        .string("playExclude")
        .defaultTo(
          JSON.stringify(["notification_helper", "UnityCrashHandler64"]),
        )
        .notNullable();
      table.timestamp("createdAt", { useTz: false }).defaultTo(knex.fn.now());
      table.timestamp("updatedAt", { useTz: false }).nullable();
    });

    // setting 초기 데이터 삽입
    await knex("setting").insert({
      sources: JSON.stringify([]),
      applySources: JSON.stringify([]),
      changeThumbnailFolder: false,
      newThumbnailFolder: JSON.stringify(""),
      cookie: JSON.stringify(""),
      search: JSON.stringify(["", ""]),
      playExclude: JSON.stringify([
        "notification_helper",
        "UnityCrashHandler64",
      ]),
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // 외래키 제약조건 때문에 순서대로 삭제
  await knex.schema.dropTableIfExists("gameTags");
  await knex.schema.dropTableIfExists("tags");
  await knex.schema.dropTableIfExists("games");
  await knex.schema.dropTableIfExists("setting");
}
