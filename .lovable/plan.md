

# 관리자 페이지 전면 리디자인 계획

## 개요
모든 사이트 데이터(카테고리, 서비스, 가격 패키지, 텍스트 등)를 관리자에서 CRUD 관리하며, 현재 샘플 데이터가 모두 입력된 상태로 구현합니다. 디자인: **다크 사이드바 + 화이트 콘텐츠** (현재 적용된 스타일 유지 및 개선).

## 관리자 메뉴 구조

| 메뉴 | 하위 기능 |
|------|----------|
| **사이트관리** | 카테고리 관리, 서비스 관리 (가격 패키지 포함), 히어로/배너 관리, 포트폴리오 관리 |
| **회원관리** | 회원 목록, 상세 조회, 상태 관리 |
| **채팅관리** | 채팅방 목록, 실시간 응답 (기존 유지 개선) |
| **제작/납품관리** | 프로젝트 목록, 상태 변경, 결과물 업로드, 컨펌 관리 |

## 데이터 구조 확장

현재 `src/data/` 의 정적 데이터를 확장하여 관리자 페이지에서 편집 UI를 제공합니다 (DB 연동 전까지 로컬 state 기반).

### 서비스 데이터에 패키지 정보 추가
```text
Service {
  ...기존 필드
  packages: [
    { name, price, deliveryDays, revisions, features[] }  // Basic/Standard/Premium
  ]
  detailedDescription: string
  portfolioImages: string[]
}
```

### 새로운 데이터 파일
- `src/data/members.ts` — 회원 샘플 데이터
- `src/data/projects.ts` — 제작/납품 프로젝트 샘플 데이터

## 구현 파일 목록

### 1. AdminLayout 개선
- **`src/components/layout/AdminLayout.tsx`** — 4개 메뉴 그룹으로 사이드바 재구성, 하위 메뉴 접기/펼치기

### 2. 사이트관리 페이지
- **`src/pages/admin/AdminCategories.tsx`** — 카테고리 목록 테이블 + 추가/수정 모달 (이름, 설명, 아이콘, 색상)
- **`src/pages/admin/AdminServices.tsx`** — 서비스 목록 + 추가/수정 모달 (기본 정보 + Basic/Standard/Premium 패키지 편집 폼)
- **`src/pages/admin/AdminBanners.tsx`** — 히어로 배너 관리
- **`src/pages/admin/AdminPortfolio.tsx`** — 포트폴리오 갤러리 항목 관리

### 3. 회원관리 페이지
- **`src/pages/admin/AdminMembers.tsx`** — 회원 목록 (검색, 필터, 상태 변경)

### 4. 채팅관리
- **`src/pages/admin/AdminChat.tsx`** — 기존 파일 개선

### 5. 제작/납품관리
- **`src/pages/admin/AdminProjects.tsx`** — 프로젝트 목록 + 상태 타임라인 + 결과물 업로드 UI + 컨펌 상태

### 6. 데이터 파일
- **`src/data/services.ts`** — packages 필드 추가
- **`src/data/members.ts`** — 신규 생성
- **`src/data/projects.ts`** — 신규 생성

### 7. 라우팅
- **`src/App.tsx`** — 새 관리자 라우트 추가 (`/admin/categories`, `/admin/members`, `/admin/banners`, `/admin/portfolio`)

## 디자인 상세

- **사이드바**: 어두운 배경 (#1a1a2e 계열), 메뉴 그룹별 라벨 + 아이콘, 활성 메뉴 하이라이트
- **콘텐츠 영역**: 화이트 배경, Card 기반 섹션, 테이블은 shadcn Table 컴포넌트 사용
- **모달/폼**: 서비스 추가/수정 시 Dialog 내 탭 구조 (기본정보 탭 + 패키지설정 탭)
- **상태 뱃지**: 컬러 코드 Badge (작업중=blue, 검수중=amber, 완료=green, 대기=gray)

## 구현 순서
1. 데이터 확장 (services에 packages 추가, members/projects 데이터 생성)
2. AdminLayout 사이드바 리디자인
3. 사이트관리 4개 페이지
4. 회원관리 페이지
5. 제작/납품관리 페이지 개선
6. 라우팅 연결

