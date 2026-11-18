# Design — Giai đoạn 1

Thiết kế đã chốt nằm ở spec (mục 3, 4, 9). Mục này ghi vị trí code thực tế sau mỗi task.

## Nhật ký sửa đổi
| Task | File / symbol | Mô tả |
|---|---|---|
| 1 | `src/app/globals.css` (token --bg/--surface/--text/--muted/--accent/--ok/--warn, `.dark`), `src/app/layout.tsx`, `vitest.config.ts`, `playwright.config.ts` | Next 16 + Tailwind v4, Noto Sans/Serif SC, vi |
| 2 | `src/lib/content/schema.ts` — `WordSchema`, `Word`, `parseVocab` |
| 3 | `scripts/lib/merge.ts` (`mergeWord`, `inScope`), `scripts/build-vocab.ts`, `scripts/validate-content.ts`, `src/content/vocab/hsk-words.json` (3317 từ, 3293 có nghĩa Việt) |
| 4 | `src/lib/storage/{types,backup-schema,memory-storage,dexie-storage,index}.ts` — `Storage`, `getStorage()` |
| 5 | `src/lib/srs/sm2.ts` — `newCard`, `schedule` |
| 6 | `src/lib/vocab/index.ts` (`wordsFor`, `applyEdit`), `src/lib/app-context.tsx` (`AppProvider`, `useApp`: words/allWords/settings/saveEdit/isEphemeral) |
| 7 | `src/components/{AppShell,FocusLayout,EphemeralBanner,ThemeToggle}.tsx`, `src/app/(main)/layout.tsx`, `src/app/layout.tsx` (AppProvider), `e2e/shell.spec.ts` |
| 8 | `src/components/vocab/{VocabList,WordCard,WordDetail,HanziText}.tsx`, `src/lib/vocab/{search,pos}.ts`, `src/lib/speech.ts`, `src/app/(main)/vocab/**` |
| 9 | `src/lib/srs/queue.ts` (`buildQueue`, `countNewToday`), `src/components/review/*`, `src/app/review/page.tsx` (ngoài route group → không có nav); sửa `dexie-storage.ts` listDue clamp |
| 10 | HomeDashboard.tsx, stats.ts (streakDays), (main)/page.tsx |
