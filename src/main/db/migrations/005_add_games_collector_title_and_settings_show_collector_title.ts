import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("games", (table) => {
    table.string("collectorTitle").nullable();
  });

  await knex.schema.alterTable("setting", (table) => {
    table.boolean("showCollectorTitle").notNullable().defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("games", (table) => {
    table.dropColumn("collectorTitle");
  });

  await knex.schema.alterTable("setting", (table) => {
    table.dropColumn("showCollectorTitle");
  });
}
