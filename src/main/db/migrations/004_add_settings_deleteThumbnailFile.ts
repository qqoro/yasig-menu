import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("setting", (table) => {
    table.boolean("deleteThumbnailFile").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("setting", (table) => {
    table.dropColumn("deleteThumbnailFile");
  });
}
