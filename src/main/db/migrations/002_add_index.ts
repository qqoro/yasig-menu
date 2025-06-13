import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // games 인덱스 추가
  if (!(await knex.schema.hasTable("games"))) {
    await knex.schema.alterTable("games", (table) => {
      table.index("title");
      table.index("isHidden");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("games")) {
    await knex.schema.alterTable("games", (table) => {
      table.dropIndex("title");
      table.dropIndex("isHidden");
    });
  }
}
