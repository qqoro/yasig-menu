# 야식 메뉴판

[![GitHub Release](https://img.shields.io/github/v/release/qqoro/yasig-menu?style=flat)](https://github.com/qqoro/yasig-menu/releases/latest)

![앱 메인 화면](./screenshot/main.png)

**야식 메뉴판**은 게임을 효율적으로 관리하고 실행할 수 있는 현대적인 데스크톱 애플리케이션입니다. Vue 3와 Electron을 기반으로 개발되었으며, 게임 라이브러리를 직관적으로 정리하고 접근할 수 있는 다양한 기능을 제공합니다.

## ✨ 주요 기능

- **게임 라이브러리 관리**: 여러 폴더에 분산된 게임들을 한 곳에서 관리
- **직관적인 UI**: 모던하고 사용하기 쉬운 인터페이스로 게임을 시각적으로 탐색
- **썸네일 관리**: 게임 썸네일 자동 다운로드 및 고해상도 뷰어 제공
- **검색 기능**: Ctrl+F를 통한 빠른 게임 검색 (퍼지 검색 지원)
- **최근 플레이**: 최근에 플레이한 게임을 별도로 표시하여 빠른 접근 제공
- **게임 실행 및 관리**: 간편한 클릭으로 게임 실행 또는 폴더 위치 열기
- **클리어 표시**: 완료한 게임 표시 기능으로 라이브러리 관리 개선
- **커스터마이징**: 화면 확대/축소 및 경로 설정 등 다양한 사용자 설정 지원

## 🛠️ 기술 스택

- **프레임워크**: Vue 3, Electron
- **상태 관리**: Pinia
- **스타일링**: Tailwind CSS
- **개발 도구**: TypeScript, Vite
- **패키지 관리**: PNPM

## 🚀 설치 방법

### 인스톨러 버전

1. [릴리즈 페이지](https://github.com/qqoro/yasig-menu/releases)에서 최신 인스톨러(`yasig-menu-setup-x.x.x.exe`)를 다운로드합니다.
2. 다운로드한 인스톨러를 실행하고 설치 지침을 따릅니다.

### 포터블 버전

1. [릴리즈 페이지](https://github.com/qqoro/yasig-menu/releases)에서 최신 포터블 버전(`yasig-menu-portable-x.x.x.exe`)을 다운로드합니다.
2. 원하는 위치에 파일을 저장하고 바로 실행할 수 있습니다.

## 💻 개발자를 위한 정보

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/qqoro/yasig-menu.git
cd yasig-menu

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build         # 인스톨러 버전 빌드
pnpm build:port    # 포터블 버전 빌드
```

### 프로젝트 구조

```
yasig-menu/
├── src/
│   ├── main/       # Electron 메인 프로세스
│   ├── renderer/   # Vue 프론트엔드 코드
│   └── lib/        # 공통 유틸리티
├── scripts/        # 빌드 스크립트
├── build/          # 빌드 관련 파일
└── dist/           # 빌드 결과물
```

## 📱 사용 방법

1. 앱을 처음 실행하면 설정에서 게임 폴더 경로를 지정해야 합니다.
2. 메인 화면에서 게임 목록과 썸네일을 확인할 수 있습니다.
3. 게임 카드를 클릭하여 썸네일을 크게 보거나, 실행 버튼을 눌러 게임을 실행할 수 있습니다.
4. Ctrl+F를 눌러 게임을 검색할 수 있습니다.
5. 최근 플레이한 게임은 상단에 별도로 표시됩니다.

## 📜 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE)를 따릅니다. 자유롭게 사용하고 수정할 수 있습니다.

## 📬 문의 및 지원

- 버그 신고나 기능 요청은 [Issues](https://github.com/qqoro/yasig-menu/issues) 페이지를 이용해 주세요.
- 기타 문의사항은 프로젝트 페이지의 Issues 탭을 통해 남겨주세요.
