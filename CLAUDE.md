# CLAUDE.md - 프로젝트 가이드

> 이 파일은 Claude Code가 프로젝트와 개발자 상황을 이해하기 위한 가이드입니다.

---

## 개발자 정보

- **이름:** 박기호
- **회사:** 수요일오전 (웹툰 배경 제작 회사)
- **역할:** 대표 / 프로젝트 매니저
- **코딩 경험:** 초보자 (기본 지식 거의 없음)
- **언어:** 한국어로만 소통

### 소통 스타일
- 기능 설명 시 "~사이트에서 이렇게 되던데" 방식으로 표현
- 기술 용어보다 비유/예시로 이해
- 웹툰/3D 작업 용어로 설명하면 빠르게 이해함

---

## 프로젝트 개요

**company-platform** - 웹툰 배경 전문 스튜디오의 통합 플랫폼

### 핵심 기능
- 회사 소개 페이지
- 포트폴리오 갤러리
- **워크스페이스** - 화이트보드 + 노드 기반 AI 이미지 생성
- 블로그

---

## 기술 스택

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Routing:** React Router v6
- **Canvas:** ReactFlow (노드 기반 화이트보드)
- **Styling:** CSS (no framework)
- **배포:** GitHub Pages

---

## 명령어

```bash
npm install    # 의존성 설치
npm run dev    # 개발 서버 (http://localhost:3000)
npm run build  # 프로덕션 빌드
```

---

## 프로젝트 구조

```
company-platform/
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx              # 엔트리 포인트
    ├── App.tsx               # 라우트 설정
    ├── index.css             # 전역 스타일
    │
    ├── components/           # 공통 UI 컴포넌트
    │   ├── Layout.tsx        # 네비게이션 + 레이아웃
    │   ├── ChatWidget.tsx    # 채팅 위젯
    │   └── nodes/            # 노드 관련 (레거시)
    │       └── node-data.ts  # 프롬프트 옵션 데이터
    │
    ├── context/
    │   └── SiteContext.tsx   # 전역 상태 관리
    │
    ├── pages/                # 페이지 컴포넌트
    │   ├── Home.tsx          # 홈 (랜딩)
    │   ├── Portfolio.tsx     # 포트폴리오
    │   ├── Contact.tsx       # 연락처
    │   ├── Blog.tsx          # 블로그
    │   ├── Download.tsx      # 다운로드
    │   ├── Admin.tsx         # 관리자
    │   └── Workspace.tsx     # 워크스페이스 (핵심!)
    │
    └── workspace/            # 워크스페이스 모듈 (모듈화됨)
        ├── index.ts          # 메인 export
        ├── types/            # TypeScript 타입 정의
        │   └── index.ts      # 노드 데이터 타입들
        ├── config/           # 설정 데이터
        │   ├── index.ts
        │   └── node-configs.ts  # 프롬프트/참조/후처리 옵션
        ├── components/       # 노드 컴포넌트들
        │   ├── index.ts      # nodeTypes 정의
        │   ├── AIGeneratorNode.tsx   # AI 이미지 생성기
        │   ├── PromptNodes.tsx       # 장면/캐릭터/소품 프롬프트
        │   ├── ReferenceNode.tsx     # 이미지 참조
        │   ├── PostProcessNode.tsx   # 후처리
        │   ├── ImageNode.tsx         # 이미지
        │   ├── NoteNode.tsx          # 노트 (더블클릭 편집)
        │   ├── TextNode.tsx          # 텍스트 (더블클릭 편집)
        │   ├── ShapeNode.tsx         # 도형
        │   └── BoardNode.tsx         # 하위 보드
        ├── hooks/            # 커스텀 훅
        │   ├── index.ts
        │   └── useWorkspace.ts  # 워크스페이스 상태 관리
        └── utils/            # 유틸리티
            ├── index.ts
            └── storage.ts    # localStorage 저장/로드
```

---

## 라우트

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | 회사 소개, 랜딩 페이지 |
| `/portfolio` | Portfolio | 작업물 갤러리 |
| `/contact` | Contact | 연락처 |
| `/blog` | Blog | 블로그 |
| `/download` | Download | Canvas Fold 다운로드 |
| `/admin` | Admin | 관리자 페이지 |
| `/workspace` | Workspace | 화이트보드 워크스페이스 |

---

## 워크스페이스 노드 종류

### AI 관련
- **AI 생성기**: Gemini API로 이미지 생성
- **프롬프트 빌더**: 장면/캐릭터/소품 (카테고리 버튼 클릭 → 옵션 선택)
- **이미지 참조**: 포즈/캐릭터/스타일/구도/배경/오브젝트
- **후처리**: 배경제거/라인추출/재질맵/업스케일/스타일변환

### 기본 노드
- **노트**: 색상별 메모 (더블클릭 편집)
- **텍스트**: 텍스트 레이블 (더블클릭 편집)
- **도형**: 사각형/원/삼각형
- **이미지**: 생성된 이미지 표시
- **보드**: 하위 보드 (무한 중첩 가능)

---

## 코드 작성 규칙

### 이렇게 해주세요 ✅
- 주석은 한국어로
- 한 번에 너무 많이 하지 말고 단계별로
- 새 기능 추가 전에 현재 구조 간단히 설명
- 웹툰/3D 작업에 비유해서 설명

### 이런 건 피해주세요 ❌
- 너무 긴 코드를 한 번에 주지 마세요
- 영어 기술 용어만으로 설명하지 마세요
- 여러 파일을 동시에 대량 수정하지 마세요
- 500줄 넘는 파일은 분리 필요

### API 키 관련
- API 키를 코드에 직접 넣지 않기
- 사용자 입력 방식으로 처리

---

## 현재 진행 상황

### 완료된 것
- [x] 기본 프로젝트 세팅
- [x] GitHub Pages 배포
- [x] 화이트보드 UI
- [x] AI 이미지 생성 노드
- [x] 프롬프트 빌더 (장면/캐릭터/소품)
- [x] 이미지 참조/후처리 노드
- [x] 실행취소/다시실행 (Ctrl+Z/Y)
- [x] 복사/붙여넣기 (Ctrl+C/V)
- [x] 노드 더블클릭 편집
- [x] 에러 바운더리 (흰화면 방지)

### 진행 중
- [ ] 워크스페이스 안정화
- [ ] 노드 연결 시 데이터 전달

### 예정
- [ ] Supabase 연동
- [ ] 로그인 기능
- [ ] 실시간 협업
- [ ] 캐릭터 생성 시스템

---

## 참고 서비스

| 서비스 | 참고 기능 |
|--------|-----------|
| Miro | 화이트보드 UI |
| ComfyUI | 노드 연결 방식 |
| Figma | 협업 방식 |

---

## 문제 발생 시

### 에러가 나면
1. 에러 메시지 전체 보여주기
2. 어떤 작업 하다가 발생했는지 설명
3. 최근에 뭘 수정했는지 알려주기

### 흰 화면이 나오면
- 워크스페이스에 에러 바운더리가 있음
- "데이터 초기화 후 새로고침" 버튼 클릭
- localStorage의 'workspace_data'가 초기화됨

---

*업데이트: 2025-12-05*
