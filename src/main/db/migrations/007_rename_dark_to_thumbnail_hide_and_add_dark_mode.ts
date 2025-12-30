import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // dark 컬럼을 thumbnailHide로 이름 변경
  await knex.schema.alterTable("setting", (table) => {
    table.renameColumn("dark", "thumbnailHide");
  });

  // 새로운 darkMode 컬럼 추가
  await knex.schema.alterTable("setting", (table) => {
    table.boolean("darkMode").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  // darkMode 컬럼 삭제
  await knex.schema.alterTable("setting", (table) => {
    table.dropColumn("darkMode");
  });

  // thumbnailHide를 dark로 되돌리기
  await knex.schema.alterTable("setting", (table) => {
    table.renameColumn("thumbnailHide", "dark");
  });
}
