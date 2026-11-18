# HSK4 Giai đoạn 1 — Nền tảng và từ vựng: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng website Next.js tĩnh có thư viện từ vựng HSK 2.0/3.0, flashcard SRS (SM-2), sao lưu/khôi phục tiến độ, với giao diện tối giản phục vụ học tập tập trung.

**Architecture:** Next.js App Router + TypeScript, nội dung là JSON sinh bởi script lúc build và kiểm tra bằng Zod. Tiến độ lưu trong IndexedDB (Dexie) sau interface `Storage`; SM-2 là hàm thuần dùng chung (giai đoạn 2 sẽ tái sử dụng cho câu viết sai).

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Dexie + fake-indexeddb (test), Zod, Vitest + Testing Library, Playwright, next-pwa/serwist (PWA).

**Spec:** `docs/superpowers/specs/2026-11-18-hsk4-study-site-design.md` (mục 3, 4, 6, 7, 9)

## Global Constraints

- Giao diện hoàn toàn tiếng Việt; chữ Hán dùng font Noto Sans SC / Noto Serif SC.
- Không tài khoản, không backend; mọi tiến độ ở IndexedDB. Truy cập lưu trữ chỉ qua interface `Storage`.
- SM-2 là nguồn lập lịch duy nhất, chung cho từ vựng và (sau này) câu viết.
- Mỗi từ có `hsk2: number|null`, `hsk3: number|null`, `reviewed: boolean`; dữ liệu sai schema thì build thất bại.
- Giấy phép: ghi nguồn MIT (complete-hsk-vocabulary) và CC BY-SA 4.0 (CVDICT, OpenCidian, CC-CEDICT) ở trang `/about`.
- UI/UX (spec mục 9): nền dịu + chế độ tối, một màu nhấn, không popup/banner; chế độ tập trung ẩn điều hướng khi ôn; phím tắt Space (lật), 1–4 (chấm), Esc (thoát); vùng bấm ≥ 44px; tương phản WCAG AA; tôn trọng `prefers-reduced-motion`; sai không báo đỏ gắt; phiên có giới hạn thẻ và kết thúc bằng tổng kết ngắn.
- Chạy test thật và báo kết quả thật trước khi báo hoàn thành.

## Review Focus

- Dữ liệu từ vựng lỗi hoặc thiếu nghĩa Việt: app vẫn hiển thị (rơi về nghĩa Anh) và không crash.
- IndexedDB không dùng được (chế độ riêng tư): cảnh báo rõ, chạy chế độ chỉ trong phiên.
- Nhập file sao lưu sai định dạng hoặc sai phiên bản: từ chối, dữ liệu hiện có không bị ghi đè.
- Không có thẻ nào đến hạn / kho từ rỗng sau khi lọc: hiện trạng thái trống thân thiện, không màn hình trắng.
- Đổi HSK 2.0 ↔ 3.0 giữa chừng: tiến độ thẻ không mất, chỉ đổi tập từ hiển thị.

---

### Task 1: Khởi tạo dự án và design tokens

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx` (placeholder)
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: CSS variables `--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--ok`, `--warn` cho theme sáng và `.dark`; script npm `dev`, `build`, `test`, `test:e2e`, `validate`.

- [ ] **Step 1:** Tạo dự án Next.js (TypeScript, Tailwind, App Router, thư mục `src/`) trong `D:\HSK` bằng `create-next-app`; thêm Vitest, Testing Library, Playwright, Dexie, fake-indexeddb, Zod.
- [ ] **Step 2: Write the failing test** `tests/smoke.test.ts`: `expect(1 + 1).toBe(2)` chạy được trong Vitest với môi trường `jsdom`.
- [ ] **Step 3: Run** `npx vitest run` — Expected: PASS khi cấu hình đúng (FAIL nếu thiếu config).
- [ ] **Step 4:** Định nghĩa theme trong `globals.css`: nền kem/xám ấm, một màu nhấn xanh dịu, bản tối tương ứng; nạp Noto Sans SC và Noto Serif SC qua `next/font`; `@media (prefers-reduced-motion)` tắt transition.
- [ ] **Step 5:** `npm run build` — Expected: build thành công.
- [ ] **Step 6: Commit** `chore: scaffold nextjs project with focus theme`

### Task 2: Schema nội dung và kiểu dữ liệu

**Files:**
- Create: `src/lib/content/schema.ts`
- Test: `src/lib/content/schema.test.ts`

**Interfaces:**
- Produces: `WordSchema` (Zod) và `type Word = { id: string; hanzi: string; pinyin: string; pos: string[]; meaningVi: string; meaningEn: string[]; hanViet?: string; example?: { zh: string; pinyin: string; vi: string }; hsk2: number | null; hsk3: number | null; reviewed: boolean }`; `parseVocab(raw: unknown): Word[]` (ném lỗi nếu bất kỳ mục nào sai).

- [ ] **Step 1: Write failing tests:** `parseVocab` chấp nhận một từ hợp lệ; ném lỗi khi thiếu `hanzi`; ném lỗi khi `hsk2` và `hsk3` đều `null`; chấp nhận `meaningVi: ""` (thiếu nghĩa Việt) nhưng khi đó `meaningEn` phải khác rỗng.
- [ ] **Step 2: Run** `npx vitest run src/lib/content/schema.test.ts` — Expected: FAIL (module chưa có).
- [ ] **Step 3: Implement** `WordSchema` và `parseVocab` bằng Zod, kèm `.refine` cho hai ràng buộc trên.
- [ ] **Step 4: Run** lại — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add vocab schema`

### Task 3: Script dựng dữ liệu từ vựng

**Files:**
- Create: `scripts/build-vocab.ts`, `scripts/validate-content.ts`, `scripts/lib/merge.ts`
- Create (sinh ra): `src/content/vocab/hsk-words.json`
- Test: `scripts/lib/merge.test.ts`

**Interfaces:**
- Consumes: `Word`, `parseVocab` (Task 2).
- Produces: `mergeWord(base: BaseHskEntry, vi?: string, hanViet?: string, en?: string[]): Word`; script `npm run build:vocab` (tải nguồn vào `.cache/`, gộp, ghi JSON) và `npm run validate` (parse mọi JSON trong `src/content`).

- [ ] **Step 1: Write failing tests:** `mergeWord` giữ `hsk2`/`hsk3` từ nguồn gốc; đặt `reviewed: false`; khi không có nghĩa Việt thì `meaningVi === ""` và dùng `meaningEn`; từ trùng chữ Hán ở cả hai bản gộp thành một mục có cả `hsk2` và `hsk3`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** `mergeWord` (hàm thuần).
- [ ] **Step 4: Implement** `build-vocab.ts`: tải `complete.json` (MIT) từ repo `drkameleon/complete-hsk-vocabulary`, `CVDICT.u8` từ `ph0ngp/CVDICT`, dữ liệu Hán Việt từ `OpenCidian/opencidian-data`; chỉ giữ từ HSK 2.0 cấp 1–4 và HSK 3.0 cấp 1–4; ghi `hsk-words.json`. Cần xác nhận URL và định dạng thực tế của từng nguồn khi tải; nếu nguồn đổi cấu trúc, báo lại thay vì đoán.
- [ ] **Step 5: Run** `npm run build:vocab && npm run validate` — Expected: in số từ theo cấp, `validate` thoát mã 0.
- [ ] **Step 6: Commit** `feat: build hsk vocab dataset from open sources`

### Task 4: Kho lưu trữ (Storage) và Dexie

**Files:**
- Create: `src/lib/storage/types.ts`, `src/lib/storage/dexie-storage.ts`, `src/lib/storage/memory-storage.ts`, `src/lib/storage/index.ts`
- Test: `src/lib/storage/storage.test.ts` (chạy cùng một bộ test cho cả hai cài đặt)

**Interfaces:**
- Produces:
  - `type Grade = 'again' | 'hard' | 'good' | 'easy'`
  - `type CardState = { id: string; ease: number; intervalDays: number; reps: number; lapses: number; due: number }`
  - `type ReviewLog = { cardId: string; grade: Grade; at: number; prevIntervalDays: number; nextIntervalDays: number }`
  - `type Settings = { hskVersion: '2.0' | '3.0'; dailyNewLimit: number; sessionLimit: number; theme: 'light' | 'dark' | 'system'; fontScale: number; lastBackupAt: number | null }`
  - `type BackupV1 = { version: 1; exportedAt: number; cards: CardState[]; reviews: ReviewLog[]; settings: Settings; edits: Record<string, Partial<Word>> }`
  - `interface Storage { getCard(id: string): Promise<CardState | undefined>; putCard(s: CardState): Promise<void>; listDue(now: number, limit: number): Promise<CardState[]>; countDue(now: number): Promise<number>; addReview(r: ReviewLog): Promise<void>; getSettings(): Promise<Settings>; putSettings(p: Partial<Settings>): Promise<void>; getEdit(id: string): Promise<Partial<Word> | undefined>; putEdit(id: string, patch: Partial<Word>): Promise<void>; exportAll(): Promise<BackupV1>; importAll(raw: unknown): Promise<void> }`
  - `getStorage(): Promise<Storage>`: trả `DexieStorage`, hoặc `MemoryStorage` kèm cờ `isEphemeral` khi IndexedDB không dùng được.

- [ ] **Step 1: Write failing tests** (chạy với `fake-indexeddb` và `MemoryStorage`): `putCard` rồi `getCard` trả đúng; `listDue` chỉ trả thẻ có `due <= now`, sắp theo `due` tăng dần, tôn trọng `limit`; `getSettings` lần đầu trả mặc định (`hskVersion: '2.0'`, `dailyNewLimit: 20`, `sessionLimit: 30`); `exportAll` rồi `importAll` vào kho trống cho kết quả giống hệt; `importAll({ version: 99 })` ném lỗi và **không thay đổi dữ liệu hiện có**.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** hai lớp cài đặt; `importAll` kiểm tra schema (Zod) và phiên bản trước khi ghi, ghi trong một transaction.
- [ ] **Step 4: Implement** `getStorage` với phát hiện lỗi mở IndexedDB (try/catch khi `Dexie.open`).
- [ ] **Step 5: Run** — Expected: PASS.
- [ ] **Step 6: Commit** `feat: add storage interface with dexie and memory implementations`

### Task 5: Thuật toán SM-2

**Files:**
- Create: `src/lib/srs/sm2.ts`
- Test: `src/lib/srs/sm2.test.ts`

**Interfaces:**
- Consumes: `CardState`, `Grade` (Task 4).
- Produces: `newCard(id: string, now: number): CardState` (`ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, due: now`); `schedule(state: CardState, grade: Grade, now: number): CardState`.

- [ ] **Step 1: Write failing tests:** `good` lần 1 → `intervalDays 1`, lần 2 → `6`, lần 3 → `round(6 * ease)`; `again` → `reps 0`, `lapses + 1`, `ease` giảm 0.2 nhưng không dưới 1.3, `due = now + 10 phút`; `hard` → `intervalDays = max(1, round(interval * 1.2))`, `ease` giảm 0.15; `easy` → `interval * ease * 1.3` làm tròn, `ease` tăng 0.15; `due` luôn bằng `now + intervalDays * 86400000` (trừ `again`).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** `newCard` và `schedule` (hàm thuần, không đổi tham số đầu vào).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add sm2 scheduler`

### Task 6: Nạp từ vựng, cài đặt phiên bản HSK và store ứng dụng

**Files:**
- Create: `src/lib/vocab/index.ts`, `src/lib/app-context.tsx`
- Test: `src/lib/vocab/index.test.ts`

**Interfaces:**
- Consumes: `Word`, `Storage`, `Settings`.
- Produces: `wordsFor(all: Word[], version: '2.0' | '3.0', level?: number): Word[]` (lọc theo `hsk2`/`hsk3`); `applyEdit(w: Word, edit?: Partial<Word>): Word`; `<AppProvider>` và hook `useApp(): { storage: Storage; settings: Settings; setSettings(p: Partial<Settings>): Promise<void>; words: Word[]; isEphemeral: boolean }`.

- [ ] **Step 1: Write failing tests:** `wordsFor(all, '2.0')` bỏ từ có `hsk2 === null`; `wordsFor(all, '3.0', 4)` chỉ trả từ có `hsk3 === 4`; `applyEdit` đè `meaningVi` nhưng giữ `id`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** hai hàm thuần và `AppProvider` (nạp settings từ storage, nạp `hsk-words.json`, cung cấp qua context).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add vocab selectors and app context`

### Task 7: Khung ứng dụng và chế độ tập trung

**Files:**
- Create: `src/components/AppShell.tsx`, `src/components/FocusLayout.tsx`, `src/components/EphemeralBanner.tsx`, `src/components/ThemeToggle.tsx`
- Modify: `src/app/layout.tsx`
- Test: `src/components/AppShell.test.tsx`

**Interfaces:**
- Produces: `<AppShell>` (điều hướng: Trang chủ, Từ vựng, Luyện viết [vô hiệu, ghi "sắp có"], Cài đặt); `<FocusLayout title: string; progress: number; onExit: () => void>` (ẩn điều hướng, hiện thanh tiến độ và nút thoát, phím `Esc` gọi `onExit`).

- [ ] **Step 1: Write failing tests:** `FocusLayout` gọi `onExit` khi nhấn `Esc`; `AppShell` có đủ 4 mục điều hướng và mục Luyện viết bị vô hiệu; `EphemeralBanner` chỉ hiện khi `isEphemeral` là `true`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** các component theo spec mục 9 (điều hướng dưới màn hình cho di động, vùng bấm ≥ 44px, nhãn ARIA, `ThemeToggle` đọc/ghi `settings.theme`).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add app shell and focus layout`

### Task 8: Thư viện từ vựng

**Files:**
- Create: `src/app/vocab/page.tsx`, `src/app/vocab/[id]/page.tsx`, `src/components/WordCard.tsx`, `src/components/HanziText.tsx`, `src/lib/speech.ts`
- Test: `src/app/vocab/vocab.test.tsx`

**Interfaces:**
- Consumes: `useApp`, `wordsFor`, `applyEdit`.
- Produces: `speak(text: string): void` (Web Speech API, `lang: 'zh-CN'`, không làm gì nếu trình duyệt không hỗ trợ); `<HanziText hanzi pinyin showPinyin>`.

- [ ] **Step 1: Write failing tests:** tìm "你好" hoặc "ni hao" trả đúng từ; lọc cấp 3 chỉ còn từ cấp 3; từ thiếu nghĩa Việt hiển thị nghĩa Anh kèm nhãn "chưa có nghĩa Việt"; kết quả lọc rỗng hiện trạng thái trống ("Không tìm thấy từ phù hợp"); sửa nghĩa Việt qua form gọi `storage.putEdit`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** danh sách có tìm kiếm (hanzi, pinyin không dấu, nghĩa), lọc cấp, phân trang hoặc ảo hoá, trang chi tiết có nút phát âm và nút sửa nghĩa; công tắc ẩn/hiện pinyin và nghĩa.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add vocab library`

### Task 9: Phiên flashcard

**Files:**
- Create: `src/app/review/page.tsx`, `src/lib/srs/queue.ts`, `src/components/Flashcard.tsx`, `src/components/SessionSummary.tsx`
- Test: `src/lib/srs/queue.test.ts`, `src/app/review/review.test.tsx`

**Interfaces:**
- Consumes: `schedule`, `newCard`, `Storage`, `FocusLayout`.
- Produces: `buildQueue(storage: Storage, words: Word[], now: number, opts: { dailyNewLimit: number; sessionLimit: number; newToday: number }): Promise<Word[]>` (thẻ đến hạn trước, rồi thẻ mới, tối đa `sessionLimit`, tối đa `dailyNewLimit - newToday` thẻ mới).

- [ ] **Step 1: Write failing tests:** `buildQueue` đặt thẻ đến hạn trước thẻ mới; không vượt `sessionLimit`; không vượt hạn mức thẻ mới trong ngày; trả mảng rỗng khi không có gì. Màn hình ôn: Space lật thẻ; phím `1`–`4` chấm again/hard/good/easy và lưu thẻ qua `schedule`; hết hàng đợi hiện `SessionSummary` rồi dừng; Esc thoát phiên.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** hàng đợi và màn hình ôn trong `FocusLayout`: mặt trước chỉ chữ Hán cỡ lớn, mặt sau pinyin, nghĩa Việt, ví dụ; nút chấm hiện gợi ý phím; phản hồi nhẹ, không màu đỏ gắt; ghi `ReviewLog` mỗi lần chấm.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add flashcard review session`

### Task 10: Trang chủ

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/lib/stats.ts`
- Test: `src/lib/stats.test.ts`

**Interfaces:**
- Produces: `streakDays(reviews: ReviewLog[], now: number): number` (số ngày liên tiếp có ôn, tính theo ngày địa phương).

- [ ] **Step 1: Write failing tests:** `streakDays` trả 0 khi không có log; trả 3 khi ôn 3 ngày liên tiếp kết thúc hôm nay; vẫn giữ chuỗi nếu hôm nay chưa ôn nhưng hôm qua có.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** `streakDays`; trang chủ hiện số thẻ đến hạn (`countDue`), nút "Bắt đầu ôn" (vô hiệu và hiện lời nhắn thân thiện khi không có thẻ), chuỗi ngày, lối vào thư viện; không dùng ngôn ngữ gây áp lực.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add home dashboard`

### Task 11: Cài đặt, sao lưu và khôi phục

**Files:**
- Create: `src/app/settings/page.tsx`, `src/lib/backup.ts`
- Test: `src/lib/backup.test.ts`

**Interfaces:**
- Consumes: `Storage.exportAll/importAll`, `Settings`.
- Produces: `downloadBackup(storage: Storage): Promise<void>` (tải `hsk4-backup-YYYY-MM-DD.json`, cập nhật `lastBackupAt`); `needsBackupReminder(s: Settings, now: number): boolean` (đúng khi quá 7 ngày hoặc chưa từng sao lưu mà đã có tiến độ).

- [ ] **Step 1: Write failing tests:** `needsBackupReminder` đúng sau 8 ngày, sai sau 3 ngày; nhập tệp JSON sai định dạng hiện lỗi dễ hiểu và không đổi dữ liệu (kiểm tra qua `MemoryStorage`).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** trang cài đặt: chọn HSK 2.0/3.0 (kèm giải thích ngắn), hạn mức thẻ mới/phiên, cỡ chữ, theme, xuất/nhập sao lưu có xác nhận trước khi ghi đè; nhắc sao lưu hiển thị nhẹ trên trang chủ, không chặn thao tác.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add settings and backup`

### Task 12: Giấy phép, PWA và kiểm thử đầu-cuối

**Files:**
- Create: `src/app/about/page.tsx`, `public/manifest.webmanifest`, `e2e/review.spec.ts`, `e2e/backup.spec.ts`
- Modify: `next.config.ts` (PWA/service worker)

- [ ] **Step 1: Write failing e2e:** (a) mở `/vocab`, tìm một từ, mở chi tiết; (b) mở `/review`, lật thẻ bằng Space, chấm bằng phím `3`, thẻ biến mất khỏi hàng đợi hôm nay; (c) xuất sao lưu, xoá dữ liệu, nhập lại, tiến độ khôi phục giống ban đầu; (d) `/about` có đủ tên và giấy phép của 4 nguồn dữ liệu và Hanzi Writer/Arphic (dành cho giai đoạn sau).
- [ ] **Step 2: Run** `npx playwright test` — Expected: FAIL.
- [ ] **Step 3: Implement** trang `/about`, manifest, service worker cho phép dùng offline.
- [ ] **Step 4: Run** `npm run validate && npx vitest run && npx playwright test && npm run build` — Expected: tất cả PASS, build thành công.
- [ ] **Step 5:** Mở app thật bằng Playwright, chụp ảnh các màn hình chính ở desktop và di động (chế độ sáng và tối), tự kiểm tra: tương phản, vùng bấm, bố cục không tràn, chế độ tập trung ẩn điều hướng.
- [ ] **Step 6: Commit** `feat: add about page, pwa and e2e coverage`
