# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - ESLint (flat config, ESLint 9)
- `npm start` - Serve production build

## Tech Stack

- **Next.js 16.2.1** (App Router) with **React 19** and TypeScript
- **Tailwind CSS v4** via `@tailwindcss/postcss` — config is CSS-based in `app/globals.css`, not `tailwind.config.js`
- **shadcn/ui v4** — components in `components/ui/`, uses `radix-ui`, `class-variance-authority`, and the `cn()` helper from `lib/utils.ts`
- Dark mode via `.dark` class strategy (`@custom-variant dark (&:is(.dark *))`)

## Important: Next.js 16 Breaking Changes

This project uses Next.js 16, which has breaking changes from prior versions. **Always read the relevant guide in `node_modules/next/dist/docs/` before writing code** that touches routing, data fetching, or framework APIs. Do not rely on training data for Next.js patterns.

## Path Aliases

`@/*` maps to the project root (e.g., `import { cn } from "@/lib/utils"`).

## Project Structure

- `app/` — App Router pages and layouts (no `src/` directory)
- `components/ui/` — shadcn/ui components
- `lib/` — Shared utilities
- `public/` — Static assets

### git

- https://github.com/sunjuyoung/haru-client.git, branch `main`
- 주요 기능 추가 시 `feat: [기능명]` 커밋 메시지
- gitignore 적절하게 설정 (node_modules, .env 등)

### 궁금한점 은 언제든지 물어봐주세요!

### 주석을 기능 별로 달아주세요
