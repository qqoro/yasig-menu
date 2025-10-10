import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    // 1. Rename old table
    await trx.schema.renameTable("gameTags", "gameTags_old");

    // 2. Create new table with the correct schema
    await trx.schema.createTable("gameTags", (table) => {
      table.string("gamePath").notNullable();
      table.string("tagId").notNullable();
      table
        .foreign("gamePath")
        .references("games.path")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table.primary(["gamePath", "tagId"]);
    });

    // 3. Copy data from old table to new table
    const oldData = await trx.select("*").from("gameTags_old");
    if (oldData.length > 0) {
      await trx.insert(oldData).into("gameTags");
    }

    // 4. Drop old table
    await trx.schema.dropTable("gameTags_old");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    // 1. Rename to old
    await trx.schema.renameTable("gameTags", "gameTags_old");

    // 2. Create new table without the onUpdate cascade
    await trx.schema.createTable("gameTags", (table) => {
      table.string("gamePath").notNullable();
      table.string("tagId").notNullable();
      table.foreign("gamePath").references("games.path").onDelete("CASCADE");
      table.primary(["gamePath", "tagId"]);
    });

    // 3. Copy data
    const oldData = await trx.select("*").from("gameTags_old");
    if (oldData.length > 0) {
      await trx.insert(oldData).into("gameTags");
    }

    // 4. Drop old table
    await trx.schema.dropTable("gameTags_old");
  });
}
