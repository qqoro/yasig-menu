import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("settings", (table) => {
    table.boolean("deleteThumbnailFile").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("settings", (table) => {
    table.dropColumn("deleteThumbnailFile");
  });
}
