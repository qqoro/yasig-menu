# 배포 시 자동 마이그레이션 가이드

## 🎯 문제점과 해결책

### 기존 문제점
일렉트론 앱을 배포했을 때 다음과 같은 문제들이 있었습니다:

1. **마이그레이션 파일 누락**: 빌드 과정에서 TypeScript 마이그레이션 파일들이 번들에 포함되지 않음
2. **경로 문제**: 프로덕션 환경에서 마이그레이션 파일의 올바른 경로를 찾지 못함
3. **초기화 누락**: 앱 시작 시 자동으로 마이그레이션이 실행되지 않음
4. **오류 처리 부족**: 마이그레이션 실패 시 적절한 대응 방안 없음

### 해결된 내용

#### 1. 빌드 프로세스 개선
**`scripts/build.js` 수정사항:**
```javascript
function copyMigrationFiles() {
  const sourceMigrationsPath = join(rootPath, "src", "main", "db", "migrations");
  const destMigrationsPath = join(buildPath, "migrations");
  
  // migrations 폴더를 build/main/migrations로 복사
  mkdirSync(destMigrationsPath, { recursive: true });
  cpSync(sourceMigrationsPath, destMigrationsPath, { recursive: true });
}
```

**`electron-builder.json` 설정 추가:**
```json
"extraResources": [
  {
    "from": "build/main/migrations",
    "to": "migrations",
    "filter": ["**/*"]
  }
]
```

#### 2. 다중 경로 지원
프로덕션 환경에서 여러 가능한 경로를 시도하여 마이그레이션 파일을 찾습니다:

```typescript
const possiblePaths = [
  resolve(process.resourcesPath, "migrations"),     // extraResources 경로
  resolve(__dirname, "migrations"),                 // 번들 내 경로
  resolve(app.getAppPath(), "main", "migrations"),  // 앱 내부 경로
];

migrationsDirectory = possiblePaths.find(path => existsSync(path)) || possiblePaths[0];
```

#### 3. 앱 시작 시 자동 초기화
**`main.ts`에서 자동 마이그레이션 실행:**
```typescript
app.whenReady().then(async () => {
  try {
    // 안전한 데이터베이스 초기화 (재시도 포함)
    await DatabaseManager.safeInitialize(3);
    console.log("데이터베이스 초기화 완료");
  } catch (error) {
    console.error("데이터베이스 초기화 최종 실패:", error);
    // 앱은 계속 시작하지만 오류 로그 출력
  }
  
  createWindow();
});
```

#### 4. 강화된 오류 처리
- **재시도 메커니즘**: 최대 3회까지 초기화 재시도
- **폴백 방식**: 마이그레이션 실패 시 직접 테이블 생성
- **상세 로깅**: 각 단계별 상세한 로그 출력
- **건강성 체크**: 데이터베이스 연결 상태 확인

## 🚀 사용자 관점에서의 동작

### 첫 설치 시
1. 사용자가 앱을 설치하고 처음 실행
2. 앱이 시작되면서 자동으로 데이터베이스 초기화
3. 마이그레이션이 실행되어 모든 테이블 생성
4. 기본 설정 데이터 삽입
5. 앱이 정상적으로 시작됨

### 업데이트 시
1. 사용자가 새 버전의 앱을 설치
2. 앱 시작 시 기존 데이터베이스 감지
3. 새로운 마이그레이션 파일들만 실행
4. 기존 데이터는 보존되면서 스키마만 업데이트
5. 앱이 새로운 기능과 함께 시작됨

### 오류 발생 시
1. 마이그레이션 실패 감지
2. 자동으로 재시도 (최대 3회)
3. 여전히 실패하면 기본 테이블 직접 생성 시도
4. 모든 방법이 실패해도 앱은 시작 (기능 제한 있을 수 있음)
5. 상세한 오류 로그가 electron-log를 통해 기록됨

## 🔧 개발자 도구

### 명령어
```bash
# 마이그레이션 상태 확인
pnpm db:status

# 수동 마이그레이션 실행
pnpm db:migrate

# 데이터베이스 건강성 체크
pnpm db:health

# 새 마이그레이션 파일 생성
pnpm db:create add_new_feature

# 개발환경에서 데이터베이스 리셋
pnpm db:reset
```

### 코드에서 사용
```typescript
import { DatabaseManager } from './db/database-manager';

// 건강성 체크
const health = await DatabaseManager.healthCheck();
console.log(health); // { status: 'ok' | 'error', message: string }

// Knex 인스턴스 사용
const db = DatabaseManager.getKnex();
const games = await db('games').select('*');
```

## 📁 파일 구조

```
src/main/db/
├── migration-manager.ts      # 핵심 마이그레이션 관리
├── database-manager.ts       # 사용하기 쉬운 래퍼 클래스
├── db-new.ts                # 새로운 데이터베이스 연결
├── migrations/              # 마이그레이션 파일들
│   ├── 001_initial_tables.ts
│   └── 002_add_game_rating_columns.ts
└── seeds/                   # 시드 데이터
    └── 001_sample_data.ts

build/main/migrations/       # 빌드된 마이그레이션 (JS)
resources/migrations/        # 최종 배포 시 리소스 위치
```

## ⚠️ 주의사항

1. **마이그레이션 파일 수정 금지**: 한 번 커밋된 마이그레이션 파일은 수정하지 말고 새로운 마이그레이션을 생성
2. **롤백 신중히 사용**: 프로덕션에서는 롤백보다는 새로운 마이그레이션으로 문제 해결
3. **백업 권장**: 중요한 데이터가 있는 경우 업데이트 전 백업 권장
4. **로그 확인**: 문제 발생 시 electron-log 파일 확인

## 🔍 문제 해결

### 마이그레이션 실패 시
1. 앱의 로그 파일 확인 (`%APPDATA%/yasig-menu/logs/`)
2. `pnpm db:health` 명령어로 상태 확인
3. 필요시 `pnpm db:reset` (개발환경에서만)

### 데이터베이스 파일 위치
- **개발**: `./dev.sqlite3`
- **프로덕션**: `%APPDATA%/yasig-menu/database.db`

이제 일렉트론 앱을 배포했을 때 사용자의 컴퓨터에서 자동으로 데이터베이스 마이그레이션이 실행되며, 업데이트 시에도 기존 데이터를 보존하면서 새로운 스키마가 적용됩니다.