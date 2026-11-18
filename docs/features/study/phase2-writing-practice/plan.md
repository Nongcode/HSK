# Giai đoạn 2: Luyện viết (sắp xếp câu) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (người dùng đã chọn thực thi Native/inline ở Giai đoạn 1) để làm từng task. Các bước dùng checkbox `- [ ]`. Theo `/feature`: sau MỖI task cập nhật `status.md`, `design.md`, `index.html`; Playwright cho task có UI.

**Goal:** Thêm luyện viết: sắp xếp câu (chạm/bàn phím + kéo thả), phân tích lỗi, ôn câu sai bằng SM-2, bài quy tắc, thống kê lỗi, ~100 câu mẫu.

**Architecture:** Nội dung tĩnh JSON (`src/content/writing/`) validate bằng Zod + script. Logic thuần ở `src/lib/writing/` (schema, chấm, xáo trộn, hàng đợi, thống kê). Lưu trữ mở rộng `Storage` (bảng `attempts`, `Settings.flaggedSentences`), thẻ câu sai là `CardState` id `s:<sentenceId>` dùng chung `schedule` SM-2. UI trong `src/components/writing/`, trang dưới `src/app/(main)/writing/**` và phiên tập trung ở `src/app/writing/practice/` (ngoài route group, dùng `FocusLayout`).

**Tech Stack:** Next.js 16 App Router, React 19, TS, Tailwind v4, Dexie 4, Zod 4, Vitest + Testing Library + fake-indexeddb, Playwright, `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`.

**Spec:** `docs/features/study/phase2-writing-practice/design.md` (cùng `docs/superpowers/specs/2026-11-18-hsk4-study-site-design.md` mục 5, 9). Đọc cả hai trước khi làm.

## Global Constraints

- Giao diện tiếng Việt; chữ Hán dùng `font-hanzi`/lớp đang có (xem `HanziText`); vùng bấm tối thiểu `min-h-11`; chạy được bằng một tay trên di động.
- Phản hồi nhẹ nhàng: sai KHÔNG tô đỏ gắt; làm nổi đáp án đúng bằng màu `--ok`/`--accent` kèm giải thích. Không popup, không hiệu ứng chớp; tôn trọng `prefers-reduced-motion`.
- Phiên 10 câu (`SESSION_SIZE = 10`), kết thúc có tổng kết rồi dừng; Esc thoát; Enter = Kiểm tra / Câu tiếp.
- Backup giữ `version: 1`; `attempts` không bắt buộc (mặc định `[]`); `parseBackup` vẫn từ chối kiểu/giá trị sai.
- Nội dung do AI soạn, KHÔNG sao chép đề thật; mọi câu `reviewed: false` khi tạo.
- Mọi chữ Hán trong `chunks` thuộc HSK1–4 (hợp 2.0 và 3.0), cộng dấu `，。？！、`.
- Dữ liệu giai đoạn 1 (cards/reviews/settings/edits) không được mất khi nâng Dexie lên version 2.
- Lệnh kiểm tra cuối: `npm run validate && npx vitest run && npx playwright test && npm run build && npm run lint`.

## Review Focus

1. Backup cũ (không có `attempts`/`flaggedSentences`) phải khôi phục được và cho giá trị mặc định; backup có `attempts` sai kiểu phải bị từ chối, dữ liệu hiện có không đổi. (Task 1)
2. Mở DB Dexie đã có dữ liệu giai đoạn 1 (version 1) → lên version 2 không mất thẻ/lượt ôn. (Task 1)
3. Câu có hai cụm trùng chữ: hoán đổi hai cụm đó vẫn tính đúng (chấm theo chuỗi chữ, không theo chỉ số). (Task 2)
4. Xáo trộn không bao giờ trả về đúng thứ tự chuẩn hay một thứ tự được chấp nhận (nếu có thể). (Task 2)
5. Ngân hàng rỗng / đã làm hết câu mới / không có câu sai đến hạn: trang hiện trạng thái trống thân thiện, không lỗi. (Task 6, 9)
6. Thoát giữa phiên (Esc) không mất kết quả các câu đã chấm; thẻ `s:` không lọt vào hàng đợi từ vựng và ngược lại. (Task 6, 9)
7. Khay/đáp án dùng được hoàn toàn bằng bàn phím và có nhãn ARIA; kéo thả không phá phương án chạm. (Task 7, 8)

---

### Task 1: Lưu trữ — attempts, cờ "nghi sai", Dexie v2

**Files:**
- Modify: `src/lib/storage/types.ts`, `src/lib/storage/backup-schema.ts`, `src/lib/storage/dexie-storage.ts`, `src/lib/storage/memory-storage.ts`
- Test: `src/lib/storage/storage.test.ts` (chạy cho cả Memory và Dexie qua `describe.each(impls)`), `src/lib/storage/backup-schema.test.ts` (tạo mới nếu chưa có)

**Interfaces:**
- Produces:
  - `export type ErrorTag = "adverbial-before-verb" | "ba-position" | "bei-position" | "shi-de" | "result-complement" | "attributive-order" | "time-place-order" | "other"` trong `types.ts` (cũng export mảng `ERROR_TAGS` cùng thứ tự).
  - `export interface WritingAttempt { sentenceId: string; ok: boolean; tag: ErrorTag | null; at: number }`
  - `Storage.addAttempt(a: WritingAttempt): Promise<void>`, `Storage.listAttempts(): Promise<WritingAttempt[]>` (theo thứ tự thêm).
  - `Settings.flaggedSentences: string[]` (mặc định `[]` trong `DEFAULT_SETTINGS`).
  - `BackupV1.attempts?: WritingAttempt[]`; `exportAll()` luôn trả `attempts`; `importAll` thay toàn bộ attempts (thiếu → `[]`).

- [ ] **Step 1: Write the failing tests** (chạy cho cả hai implementation): (a) `addAttempt` rồi `listAttempts` trả đúng thứ tự; (b) `putSettings({flaggedSentences:["a"]})` được lưu và `exportAll().settings.flaggedSentences` có `"a"`; (c) round-trip `exportAll`→`importAll` giữ `attempts`; (d) `importAll` backup version 1 KHÔNG có `attempts` và không có `flaggedSentences` trong settings → thành công, `listAttempts()` = `[]`, settings có `flaggedSentences: []`; (e) `importAll` với `attempts: [{sentenceId: 5}]` hoặc `tag: "bad"` → reject và dữ liệu hiện có nguyên vẹn; (f) chỉ Dexie: tạo DB version 1 thủ công bằng `new Dexie(name)` + `version(1).stores({cards:"id, due",reviews:"++seq, cardId, at",settings:"key",edits:"id"})`, ghi một thẻ và một review, đóng, mở lại bằng `DexieStorage(name)` → thẻ và review còn nguyên, `listAttempts()` rỗng.
- [ ] **Step 2: Run** `npx vitest run src/lib/storage` — Expected: FAIL (thiếu `addAttempt`…).
- [ ] **Step 3: Implement.** Types như mục Interfaces. `backup-schema.ts`: `attempts: z.array(z.object({sentenceId: z.string().min(1), ok: z.boolean(), tag: z.enum(ERROR_TAGS).nullable(), at: z.number()})).default([])`; `settings.flaggedSentences: z.array(z.string()).default([])`. Dexie: `this.version(2).stores({ attempts: "++seq, sentenceId, at" })` (giữ `version(1)` nguyên, v2 chỉ thêm bảng); `importAll` đưa `attempts` vào transaction `rw`. `getSettings` đã gộp `DEFAULT_SETTINGS`, nên cờ tự có mặc định.
- [ ] **Step 4: Run** `npx vitest run` — Expected: toàn bộ PASS (kể cả test cũ).
- [ ] **Step 5: Commit** `feat: store writing attempts and flagged sentences`

### Task 2: Schema nội dung, bộ chấm, xáo trộn, thống kê (hàm thuần)

**Files:**
- Create: `src/lib/writing/schema.ts`, `src/lib/writing/grade.ts`, `src/lib/writing/shuffle.ts`, `src/lib/writing/stats.ts`
- Test: `src/lib/writing/schema.test.ts`, `grade.test.ts`, `shuffle.test.ts`, `stats.test.ts`

**Interfaces:**
- Consumes: `ErrorTag`, `ERROR_TAGS`, `WritingAttempt` từ `@/lib/storage/types`.
- Produces:
  - `SentenceSchema`, `type Sentence = { id: string; chunks: string[]; accepted: number[][]; pinyin: string; meaningVi: string; pattern: string; ruleId: string; mistakes: { order: number[]; tag: ErrorTag }[]; difficulty: 1|2|3; reviewed: boolean }` — `chunks` có 3–8 phần tử; mọi `order` trong `accepted` và `mistakes` là hoán vị của `0..chunks.length-1`; `accepted` luôn chứa thứ tự chuẩn `[0,1,…,n-1]` (nếu thiếu thì schema tự báo lỗi); `parseSentences(raw: unknown): Sentence[]` (từ chối `id` trùng).
  - `RuleSchema`, `type Rule = { id: string; title: string; summary: string; explanation: string; examples: { zh: string; pinyin: string; vi: string }[]; tag: ErrorTag }`, `parseRules(raw): Rule[]`.
  - `gradeOrder(s: Sentence, order: number[]): { ok: true } | { ok: false; tag: ErrorTag; correct: string }` — so khớp THEO CHUỖI CHỮ (nối `chunks[i]` theo `order` so với nối theo từng mục `accepted`), `correct` là câu chuẩn nối liền; sai thì tìm `mistakes` có cùng chuỗi chữ, không có → tag của rule (truyền qua tham số tuỳ chọn thứ ba `ruleTag: ErrorTag = "other"`).
  - `shuffleOrder(s: Sentence, rand: () => number = Math.random): number[]` — hoán vị của `0..n-1` mà `gradeOrder(...).ok === false` (thử lại đến 50 lần; nếu mọi hoán vị đều được chấp nhận thì trả hoán vị đầu tiên khác thứ tự chuẩn).
  - `mistakeStats(attempts: WritingAttempt[]): { tag: ErrorTag; count: number }[]` — chỉ đếm `ok === false` có `tag`, sắp giảm dần theo `count`, hoà thì theo thứ tự `ERROR_TAGS`.
  - `TAG_LABEL: Record<ErrorTag, string>` (nhãn tiếng Việt, vd `"ba-position": "Vị trí 把"`) trong `src/lib/writing/labels.ts`.

- [ ] **Step 1: Write the failing tests.** schema: câu hợp lệ qua; hoán vị sai độ dài/không hợp lệ bị từ chối; `accepted` thiếu thứ tự chuẩn bị từ chối; `id` trùng bị từ chối. grade: đúng thứ tự chuẩn → ok; một thứ tự trong `accepted` → ok; sai khớp `mistakes` → đúng tag đó; sai không khớp → `ruleTag`; câu có hai cụm trùng chữ (`chunks: ["我","吃","我"... ]` hoặc tương tự) hoán đổi hai cụm trùng → ok (Review Focus 3). shuffle: với `rand` cố định và nhiều seed, kết quả luôn `ok:false` và là hoán vị; trường hợp suy biến (mọi hoán vị được chấp nhận) không lặp vô hạn. stats: đếm và sắp xếp đúng; bỏ qua `ok:true`.
- [ ] **Step 2: Run** `npx vitest run src/lib/writing` — Expected: FAIL (module không tồn tại).
- [ ] **Step 3: Implement** các hàm theo Interfaces. Dùng `WordShape`-kiểu: `z.object(...)` rồi `.superRefine` để kiểm tra hoán vị; không dùng `.partial()` trên schema đã refine.
- [ ] **Step 4: Run** `npx vitest run src/lib/writing` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add writing schema, grader, shuffle and stats`

### Task 3: Bài quy tắc + validate nội dung viết

**Files:**
- Create: `src/content/writing/rules.json` (7 bài), `src/content/writing/sentences.json` (khởi tạo `[]`), `scripts/lib/validate-writing.ts`
- Modify: `scripts/validate-content.ts`
- Test: `scripts/lib/validate-writing.test.ts`

**Interfaces:**
- Consumes: `parseSentences`, `parseRules`, `Word` (vocab `src/content/vocab/hsk-words.json`).
- Produces: `validateWriting(sentences: Sentence[], rules: Rule[], words: Word[]): string[]` — trả danh sách lỗi (rỗng = hợp lệ). Kiểm tra: (1) `ruleId` tồn tại trong `rules`; (2) trùng câu (nối `chunks` giống nhau); (3) mỗi chữ Hán trong `chunks` phải có trong tập chữ của các từ có `hsk2 ≤ 4` hoặc `hsk3 ≤ 4` (chuỗi báo lỗi nêu `id` câu và chữ lạ); chấp nhận thêm `，。？！、`; (4) mỗi rule có ít nhất 2 ví dụ.
- Bài quy tắc (`id` → `tag`): `adverbial` → adverbial-before-verb; `ba` → ba-position; `bei` → bei-position; `shi-de` → shi-de; `result` → result-complement; `attributive` → attributive-order; `time-place` → time-place-order. Mỗi bài: `summary` 1 câu, `explanation` 3–6 câu tiếng Việt, ≥ 2 ví dụ (`zh`, `pinyin`, `vi`), từ trong ví dụ thuộc HSK1–4.

- [ ] **Step 1: Write the failing tests** cho `validateWriting`: ruleId lạ → có lỗi; hai câu trùng → có lỗi; chữ ngoài HSK1–4 (dùng bộ `words` nhỏ trong test) → lỗi nêu `id` và chữ; dấu câu cho phép không bị báo; dữ liệu đúng → `[]`; rule thiếu ví dụ → lỗi.
- [ ] **Step 2: Run** `npx vitest run scripts/lib/validate-writing.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `validateWriting`; soạn 7 bài `rules.json`; mở rộng `scripts/validate-content.ts`: nạp `src/content/writing/{sentences,rules}.json`, parse bằng Zod, gọi `validateWriting`, in lỗi và `process.exit(1)` nếu có.
- [ ] **Step 4: Run** `npx vitest run scripts && npm run validate` — Expected: PASS, in "Hợp lệ" kèm số câu/bài quy tắc.
- [ ] **Step 5: Commit** `feat: add writing rules and content validation`

### Task 4: Ngân hàng câu mẫu — đợt 1 (≈ 50 câu)

**Files:**
- Modify: `src/content/writing/sentences.json`

**Interfaces:** Consumes schema Task 2, `validateWriting` Task 3.

Yêu cầu nội dung (AI soạn, `reviewed: false`, `id` dạng `w001`…): ≈ 50 câu, độ khó 1/2/3 khoảng 40/40/20%, mỗi `ruleId` ít nhất 5 câu (7 rule), câu tự nhiên cỡ HSK4 (6–14 chữ, 4–6 cụm); `chunks` theo đơn vị ngữ nghĩa (chủ ngữ, trạng ngữ, động từ, bổ ngữ…); `accepted` chỉ thêm khi trật tự thực sự linh hoạt (vd trạng ngữ thời gian trước/sau chủ ngữ); `mistakes` ghi ≥ 1 trật tự sai điển hình có nhãn khi quy tắc rõ; `pinyin` có dấu, `meaningVi` tự nhiên, `pattern` ngắn (vd "S + 把 + O + V + 补语"). Không dùng câu của đề thi thật.

- [ ] **Step 1: Write the failing test** `scripts/content.test.ts`: nạp thật `sentences.json`, `rules.json`, `hsk-words.json`; `validateWriting(...)` trả `[]`; số câu ≥ 50; mỗi `ruleId` ≥ 5 câu; mỗi câu `reviewed === false`.
- [ ] **Step 2: Run** `npx vitest run scripts/content.test.ts` — Expected: FAIL (số câu < 50).
- [ ] **Step 3: Soạn ≈ 50 câu** vào `sentences.json`, chạy `npm run validate` sau mỗi ~10 câu và sửa lỗi từ ngoài phạm vi.
- [ ] **Step 4: Run** `npm run validate && npx vitest run scripts` — Expected: PASS.
- [ ] **Step 5: Commit** `content: add first 50 writing sentences`

### Task 5: Ngân hàng câu mẫu — đợt 2 (đủ ≈ 100 câu)

**Files:**
- Modify: `src/content/writing/sentences.json`, `scripts/content.test.ts`

Yêu cầu như Task 4, `id` tiếp `w051`…; bổ sung các mẫu khó hơn (kết hợp 把/被 với bổ ngữ, 是…的 với thời gian/địa điểm, định ngữ dài) để tổng ≈ 100 câu, mỗi `ruleId` ≥ 12 câu, độ khó 1/2/3 xấp xỉ 35/40/25%.

- [ ] **Step 1: Sửa test** `scripts/content.test.ts`: số câu ≥ 100, mỗi `ruleId` ≥ 12 câu. **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Soạn thêm ≈ 50 câu**, validate dần. **Step 4: Run** `npm run validate && npx vitest run scripts` — Expected: PASS.
- [ ] **Step 5: Commit** `content: complete 100 writing sentences`

### Task 6: Hàng đợi luyện viết + ghi kết quả (SRS)

**Files:**
- Create: `src/lib/writing/session.ts`
- Test: `src/lib/writing/session.test.ts`

**Interfaces:**
- Consumes: `Storage`, `Sentence`, `newCard`/`schedule` từ `@/lib/srs/sm2`, `gradeOrder` result type, `ErrorTag`.
- Produces:
  - `export const SESSION_SIZE = 10`
  - `pickPractice(sentences: Sentence[], attempts: WritingAttempt[], limit = SESSION_SIZE, rand = Math.random): Sentence[]` — câu chưa từng làm trước (ưu tiên độ khó thấp → cao, xáo trong cùng độ khó), thiếu thì lấy thêm câu từng sai gần nhất; không trùng; rỗng nếu `sentences` rỗng.
  - `buildWrongQueue(storage: Storage, sentences: Sentence[], now: number, limit = SESSION_SIZE): Promise<Sentence[]>` — thẻ `s:<id>` đến hạn (tính đến hết ngày địa phương như `buildQueue`), bỏ id không còn trong `sentences`.
  - `recordAttempt(storage: Storage, s: Sentence, result: { ok: true } | { ok: false; tag: ErrorTag }, now: number): Promise<void>` — luôn `addAttempt`; sai → tạo/cập nhật thẻ `s:<id>` bằng `schedule(card, "again", now)`; đúng và thẻ `s:<id>` đã tồn tại → `schedule(card, "good", now)`; đúng mà chưa có thẻ → không tạo thẻ.
  - Quy ước id thẻ: `export const cardIdFor = (sentenceId: string) => "s:" + sentenceId`.

- [ ] **Step 1: Write the failing tests** (dùng `MemoryStorage`): pickPractice ưu tiên chưa làm + độ khó thấp, không trùng, tôn trọng `limit`, danh sách rỗng → `[]`; buildWrongQueue chỉ trả câu có thẻ `s:` đến hạn, bỏ id lạ, không trả câu có thẻ chưa đến hạn; recordAttempt: sai → có attempt và thẻ `again` (due ≈ now+10 phút), đúng khi đã có thẻ → thẻ `good`, đúng khi chưa có thẻ → không có thẻ; thẻ `s:` KHÔNG xuất hiện trong `buildQueue` từ vựng (gọi `buildQueue` với từ vựng mẫu và xác nhận kết quả không thay đổi); ngược lại thẻ từ vựng không xuất hiện trong `buildWrongQueue`.
- [ ] **Step 2: Run** `npx vitest run src/lib/writing/session.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** theo Interfaces.
- [ ] **Step 4: Run** `npx vitest run` — Expected: PASS toàn bộ.
- [ ] **Step 5: Commit** `feat: add writing practice queue and attempt recording`

### Task 7: Bảng sắp xếp câu (chạm + bàn phím)

**Files:**
- Create: `src/components/writing/SentenceBoard.tsx`
- Test: `src/components/writing/SentenceBoard.test.tsx`

**Interfaces:**
- Consumes: `Sentence`, `HanziText` hiện có nếu phù hợp.
- Produces: `<SentenceBoard chunks={string[]} initialOrder={number[]} disabled={boolean} onChange={(placed: number[]) => void} onSubmit={() => void} />` — `initialOrder` là thứ tự các cụm trong khay (đã xáo); `placed` là chỉ số cụm gốc đã đặt vào dòng đáp án theo thứ tự. Hành vi: chạm cụm trong khay → vào cuối dòng đáp án; chạm cụm trong dòng đáp án → quay về khay; phím `1`–`9` chọn cụm thứ k trong khay; `Backspace` bỏ cụm cuối của dòng đáp án; `Enter` gọi `onSubmit` chỉ khi đã đặt đủ cụm; khi `disabled` mọi thao tác bị chặn. Vùng đáp án `role="list"` aria-label "Câu của bạn", khay `role="group"` aria-label "Các cụm từ"; mỗi cụm là `<button>` `min-h-11`; kbd gợi ý số phím trên cụm trong khay.

- [ ] **Step 1: Write the failing tests** (Testing Library + user-event): chạm cụm → vào dòng đáp án và `onChange` đúng thứ tự; chạm lại → về khay; phím `2` chọn cụm thứ hai trong khay; `Backspace` bỏ cụm cuối; `Enter` khi chưa đủ cụm KHÔNG gọi `onSubmit`, đủ cụm gọi một lần; `disabled` thì chạm/phím không đổi gì; hai cụm trùng chữ vẫn thao tác độc lập.
- [ ] **Step 2: Run** `npx vitest run src/components/writing/SentenceBoard.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement** component; phím tắt gắn ở `window` nhưng bỏ qua khi có phím bổ trợ hoặc `e.repeat`.
- [ ] **Step 4: Run** test file — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add tap and keyboard sentence board`

### Task 8: Kéo thả đổi vị trí trong dòng đáp án (@dnd-kit)

**Files:**
- Modify: `package.json` (thêm `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`), `src/components/writing/SentenceBoard.tsx`
- Test: `src/components/writing/SentenceBoard.test.tsx`

**Interfaces:** Giữ nguyên props của Task 7. Thêm: các cụm trong dòng đáp án sắp xếp lại được bằng kéo (PointerSensor, `activationConstraint: {distance: 6}` để không nuốt thao tác chạm) và bằng bàn phím (KeyboardSensor, Space nhấc, mũi tên di chuyển) — chạm vẫn là cách chính. Có `aria-roledescription` và thông báo `accessibility.announcements` tiếng Việt.

- [ ] **Step 1: Write the failing test:** dùng helper chuyển vị cụm thành hàm thuần `moveChunk(placed: number[], from: number, to: number): number[]` được export từ `SentenceBoard.tsx` (hoặc `src/lib/writing/move.ts`) và test trực tiếp (di chuyển tiến/lùi, `from===to`, chỉ số ngoài phạm vi trả về mảng gốc); thêm test render xác nhận chạm vẫn hoạt động sau khi bọc `DndContext`.
- [ ] **Step 2: Run** — Expected: FAIL. **Step 3: Implement** `npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`, bọc dòng đáp án bằng `DndContext` + `SortableContext` (`horizontalListSortingStrategy`), `onDragEnd` gọi `moveChunk` rồi `onChange`.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add drag to reorder with dnd-kit`

### Task 9: Phiên luyện + phản hồi + Ôn câu sai

**Files:**
- Create: `src/components/writing/WritingSession.tsx`, `src/components/writing/FeedbackPanel.tsx`, `src/app/writing/practice/page.tsx`
- Test: `src/components/writing/WritingSession.test.tsx`; e2e ở Task 11

**Interfaces:**
- Consumes: `SentenceBoard`, `gradeOrder`, `shuffleOrder`, `pickPractice`, `buildWrongQueue`, `recordAttempt`, `TAG_LABEL`, `FocusLayout`, `useApp`, rules JSON, `Settings.flaggedSentences`.
- Produces: `<WritingSession mode="practice" | "wrong" onExit={() => void} sentences={Sentence[]} rules={Rule[]} />`; trang `/writing/practice?mode=wrong|practice` (mặc định `practice`) chọn hàng đợi bằng `pickPractice`/`buildWrongQueue`.
- Luồng một câu: hiện nghĩa Việt (và pinyin có nút ẩn/hiện) + khay xáo; Kiểm tra (Enter) → `gradeOrder` + `recordAttempt`; đúng → thông báo ngắn "Chính xác" và nút Câu tiếp (Enter); sai → hiện đáp án đúng (chữ Hán + pinyin), nhãn lỗi (`TAG_LABEL`), giải thích rút từ rule của câu, liên kết "Xem bài quy tắc" → `/writing/rules/<ruleId>`, nút "Câu này có vẻ sai" thêm id vào `flaggedSentences` (idempotent). Hết `SESSION_SIZE` câu hoặc hết hàng đợi → tổng kết (đúng/sai, nhãn lỗi trong phiên) rồi dừng, không tự bắt đầu phiên mới. Hàng đợi rỗng → trạng thái trống thân thiện (khác nhau cho `practice` và `wrong`) kèm liên kết về `/writing`. Mỗi câu đã chấm được ghi NGAY (thoát giữa chừng không mất). Lỗi ghi → `role="alert"` và vẫn dùng tiếp được (như `ReviewSession`).

- [ ] **Step 1: Write the failing tests** (MemoryStorage + AppProvider như `ReviewSession.test.tsx`): xếp đúng + Enter → "Chính xác" và có attempt `ok:true`; xếp sai → hiện đáp án đúng, nhãn lỗi, liên kết `/writing/rules/<id>`, và có thẻ `s:<id>`; nút "Câu này có vẻ sai" lưu cờ và bấm hai lần không nhân đôi; kết thúc phiên hiện tổng kết "Hoàn thành" và không còn câu; hàng đợi rỗng hiện trạng thái trống; ghi lỗi (`putCard` reject) hiện alert rồi vẫn thao tác tiếp; mode `wrong` chỉ chứa câu có thẻ đến hạn.
- [ ] **Step 2: Run** `npx vitest run src/components/writing` — Expected: FAIL.
- [ ] **Step 3: Implement** component và trang (client). Trang ở ngoài route group `(main)` để không có điều hướng.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit && npm run lint` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add writing practice session with feedback`

### Task 10: Trang Luyện viết, quy tắc, lỗi hay mắc, điều hướng

**Files:**
- Create: `src/app/(main)/writing/page.tsx`, `src/app/(main)/writing/rules/page.tsx`, `src/app/(main)/writing/rules/[id]/page.tsx`, `src/app/(main)/writing/mistakes/page.tsx`, `src/components/writing/{WritingHome,RuleView,MistakesView}.tsx`
- Modify: `src/components/AppShell.tsx` (bật "Luyện viết" → `/writing`, bỏ nhãn "(sắp có)"), `src/components/HomeDashboard.tsx` (thêm lối tắt "Luyện viết"), `src/components/AppShell.test.tsx`, `src/components/HomeDashboard.test.tsx`
- Test: `src/components/writing/{WritingHome,MistakesView}.test.tsx`

**Interfaces:**
- Consumes: `mistakeStats`, `TAG_LABEL`, `buildWrongQueue`, `attempts` từ `useApp().storage.listAttempts()`, rules/sentences JSON.
- Produces: `/writing` có 4 thẻ: "Sắp xếp câu" (→ `/writing/practice`), "Ôn câu sai" (→ `/writing/practice?mode=wrong`, hiện số câu đến hạn; vô hiệu mềm với giải thích khi 0), "Quy tắc trật tự từ" (→ `/writing/rules`), "Lỗi hay mắc" (→ `/writing/mistakes`). `/writing/rules/[id]` hiển thị tiêu đề, tóm tắt, giải thích, ví dụ, và liên kết luyện các câu thuộc rule (`/writing/practice?rule=<id>`; `pickPractice` nhận danh sách đã lọc theo rule); id không tồn tại → trạng thái "không tìm thấy" kèm liên kết về danh sách. `/writing/mistakes` liệt kê nhãn + số lần + thanh ngang đơn giản (có `aria-label`), trống thì lời nhắn thân thiện. Dùng `generateStaticParams` cho `[id]` từ `rules.json`.

- [ ] **Step 1: Write the failing tests:** AppShell: mục "Luyện viết" là liên kết `/writing` (không còn `aria-disabled`); HomeDashboard có liên kết "Luyện viết" → `/writing`; WritingHome hiện số câu ôn đến hạn và vô hiệu "Ôn câu sai" khi 0; MistakesView sắp giảm dần, hiện trạng thái trống khi chưa có lỗi; RuleView id lạ → không tìm thấy.
- [ ] **Step 2: Run** `npx vitest run src/components` — Expected: FAIL. **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit && npm run lint` — Expected: PASS. Cập nhật `e2e/shell.spec.ts` (không còn khẳng định Luyện viết bị vô hiệu: đổi thành liên kết dẫn tới `/writing`).
- [ ] **Step 5: Commit** `feat: add writing hub, rules and mistakes pages`

### Task 11: E2E, ảnh chụp, kiểm tra cuối

**Files:**
- Create: `e2e/writing.spec.ts`, ảnh trong `docs/features/study/phase2-writing-practice/screenshots/`
- Modify: `e2e/backup.spec.ts` (hoặc thêm test) để bao gồm `attempts`

- [ ] **Step 1: Write the failing e2e** (desktop + mobile): (a) TC-10 `/writing/practice`: xếp câu đúng bằng chạm (đọc thứ tự chuẩn từ `src/content/writing/sentences.json` trong test), Enter, thấy "Chính xác"; (b) TC-11: cố tình xếp sai bằng bàn phím → thấy đáp án đúng, nhãn lỗi, liên kết quy tắc; (c) TC-12: câu vừa sai xuất hiện ở `/writing/practice?mode=wrong` sau khi hết hạn (dùng `page.clock` hoặc chỉnh `due` qua IndexedDB) HOẶC kiểm tra số "câu ôn" trên `/writing`; (d) TC-13: sao lưu → làm thêm một câu sai → khôi phục → thống kê ở `/writing/mistakes` về đúng số lúc sao lưu; (e) Esc thoát về `/writing`, không có thanh điều hướng trong phiên; (f) ảnh sáng/tối desktop/di động cho `/writing`, phiên (trước/sau khi chấm sai), `/writing/rules/ba`, `/writing/mistakes`.
- [ ] **Step 2: Run** `npx playwright test e2e/writing.spec.ts` — Expected: FAIL trước khi hoàn thiện (nếu đã đạt do task trước, ghi chú trong `status.md`).
- [ ] **Step 3: Sửa lỗi phát hiện** (bố cục, vùng bấm, tương phản, tràn ngang) qua ảnh chụp; mỗi lỗi có test hồi quy ở tầng đơn vị nếu là logic.
- [ ] **Step 4: Run** `npm run validate && npx vitest run && npx playwright test && npm run build && npm run lint` — Expected: tất cả PASS (test flaky đã biết ghi trung thực nếu xuất hiện).
- [ ] **Step 5: Cập nhật tài liệu** `status.md` (kết quả test), `design.md` (nhật ký task), `index.html` (prototype + tiến độ), `docs/features/README.md`; commit `feat: add writing practice e2e coverage`.
