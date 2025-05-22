# 데이터베이스 마이그레이션 관리 시스템

이 프로젝트는 Knex.js를 사용하여 SQLite 데이터베이스의 마이그레이션을 체계적으로 관리합니다.

## 주요 파일 구조

```
src/main/db/
├── migration-manager.ts    # 마이그레이션 관리 클래스
├── database-manager.ts     # 데이터베이스 관리 유틸리티
├── db-new.ts              # 새로운 데이터베이스 연결 (마이그레이션 적용)
├── migrations/            # 마이그레이션 파일들
│   └── 001_initial_tables.ts
└── seeds/                 # 시드 데이터
    └── 001_sample_data.ts
```

## 사용법

### 1. 마이그레이션 명령어

```bash
# 새 마이그레이션 파일 생성
pnpm db:create add_new_column

# 마이그레이션 실행
pnpm db:migrate

# 마이그레이션 롤백
pnpm db:rollback

# 마이그레이션 상태 확인
pnpm db:status

# 데이터베이스 리셋 (개발환경 전용)
pnpm db:reset
```

### 2. 코드에서 사용

```typescript
import { DatabaseManager } from './db/database-manager';

// 애플리케이션 시작 시
await DatabaseManager.initialize();

// Knex 인스턴스 사용
const db = DatabaseManager.getKnex();
const games = await db('games').select('*');

// 애플리케이션 종료 시
await DatabaseManager.destroy();
```

### 3. 기존 db.ts 대신 새로운 시스템 적용

기존의 `db.ts`를 `db-new.ts`로 교체하고 마이그레이션 시스템을 적용하려면:

```typescript
// main.ts에서
import { initializeApp, cleanupApp } from './app-lifecycle';

app.whenReady().then(async () => {
  await initializeApp();
  // ... 나머지 앱 초기화 코드
});

app.on('before-quit', async () => {
  await cleanupApp();
});
```

## 마이그레이션 파일 작성 예시

새 마이그레이션 파일을 생성할 때:

```typescript
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 스키마 변경사항 적용
  await knex.schema.alterTable('games', (table) => {
    table.string('newColumn').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  // 변경사항 되돌리기
  await knex.schema.alterTable('games', (table) => {
    table.dropColumn('newColumn');
  });
}
```

## 특징

- **버전 관리**: 데이터베이스 스키마 변경사항을 체계적으로 관리
- **롤백 지원**: 문제 발생 시 이전 상태로 되돌리기 가능
- **개발/프로덕션 환경 분리**: 환경별 다른 설정 적용
- **로깅**: 상세한 로그를 통한 디버깅 지원
- **타입 안전성**: TypeScript를 통한 타입 안전성 보장

## 주의사항

- `db:reset` 명령어는 개발환경에서만 사용 가능
- 프로덕션 환경에서는 마이그레이션만 실행하고 롤백은 신중히 사용
- 마이그레이션 파일은 한 번 커밋된 후에는 수정하지 않는 것을 권장