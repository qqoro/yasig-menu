import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 게임 테이블에 평점 관련 컬럼 추가 예시
  await knex.schema.alterTable('games', (table) => {
    table.integer('rating').nullable().comment('게임 평점 (1-5)');
    table.integer('playTime').nullable().comment('플레이 시간 (분)');
    table.text('review').nullable().comment('게임 리뷰');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('games', (table) => {
    table.dropColumn('rating');
    table.dropColumn('playTime');
    table.dropColumn('review');
  });
}