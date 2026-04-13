# Project Memory

## Core
AI팩토리 - AI 콘텐츠 마켓플레이스. 크몽 스타일 밝고 깔끔한 디자인.
Primary: 블루-퍼플 hsl(246,65%,56%). Noto Sans KR 폰트.
7개 서비스 카테고리: 이미지, 영상, 글, 음악, AI비서, 웹툰/미니게임, 광고.
USP: 반값 가격, 높은 퀄리티, 빠른 납기, 대량생산.
한국어 UI. 프론트+관리자 백엔드 구조.

## Memories
- [서비스 카테고리](mem://features/categories) — 7개 AI 콘텐츠 카테고리 상세
- [페이지 구조](mem://features/pages) — 프론트엔드 및 관리자 페이지 라우팅
- [이미지 업로드 루프 방지](mem://constraints/image-upload-loop) — uploading 상태를 ref로 관리, useCallback deps에 넣지 않기
