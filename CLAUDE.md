# CLAUDE.md

## Project Overview

**company-platform** - 웹툰 배경 전문 스튜디오의 통합 플랫폼. 회사 소개, AI 도구, 데스크톱 앱 다운로드를 하나의 사이트에서 제공.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Routing:** React Router v6
- **Styling:** CSS (no framework, keep lightweight)

## Commands

```bash
npm install    # Install dependencies
npm run dev    # Start dev server at http://localhost:3000
npm run build  # Production build
```

## Project Structure

```
company-platform/
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx           # Entry point
    ├── App.tsx            # Routes configuration
    ├── index.css          # Global styles
    ├── components/
    │   ├── Layout.tsx     # Navigation + layout wrapper
    │   └── Layout.css
    ├── pages/
    │   ├── Home.tsx       # Landing page
    │   ├── Home.css
    │   ├── Tools.tsx      # AI tools list
    │   ├── Tools.css
    │   ├── Download.tsx   # Canvas Fold download
    │   └── Download.css
    └── tools/
        ├── WebtoonAI.tsx  # Webtoon asset generator
        └── WebtoonAI.css
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | 회사 소개, 랜딩 페이지 |
| `/tools` | Tools | AI 도구 목록 |
| `/tools/webtoon-ai` | WebtoonAI | 웹툰 에셋 생성기 |
| `/download` | Download | Canvas Fold 다운로드 |

## Integrated Tools

### WebtoonAI (`/tools/webtoon-ai`)
- Google Gemini API 사용
- 5가지 에셋 생성: 원본, 선화, 밑색, 머티리얼ID, 투명PNG
- 클라이언트에서 직접 API 호출 (프록시 사용)

## API Configuration

Vite dev server가 Gemini API를 프록시:
```
/api/gemini/* → https://generativelanguage.googleapis.com/*
```

## Design Guidelines

- Dark theme (--bg-dark: #0f0f0f)
- Primary color: #6366f1 (indigo)
- Keep dependencies minimal
- No UI framework (custom CSS only)

---

# Platform Integration Plan

## Current Status

This is the **main platform** that integrates all company products.

## Related Projects

| Project | Status | Integration |
|---------|--------|-------------|
| **Canvas Fold** | Separate repo | Download page links here |
| **Webtoon AI** | ✅ Integrated | `/tools/webtoon-ai` |

## Future Pages (TODO)

```
/order          → 작업 의뢰 시스템
/dashboard      → 클라이언트 진행상황 확인
/workspace      → Canvas Fold 웹 버전
/portfolio      → 작업 포트폴리오
```

## Architecture Notes

- 각 도구는 `/tools/` 폴더에 독립적으로 추가
- 공통 컴포넌트는 `/components/`에
- 추후 Supabase 연동 시 `/lib/supabase.ts` 추가
