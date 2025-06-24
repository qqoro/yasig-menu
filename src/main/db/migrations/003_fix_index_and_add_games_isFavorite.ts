import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("games")) {
    await knex.schema.alterTable("games", (table) => {
      table.boolean("isFavorite").defaultTo(false);
      table.index("title", "idx_games_title");
      table.index("isHidden", "idx_games_isHidden");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("games")) {
    await knex.schema.alterTable("games", (table) => {
      table.dropColumn("isFavorite");
      table.dropIndex("title", "idx_games_title");
      table.dropIndex("isHidden", "idx_games_isHidden");
    });
  }
}
