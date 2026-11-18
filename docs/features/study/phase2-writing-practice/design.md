# Design — Giai đoạn 2: Luyện viết (sắp xếp câu)

Spec đã chốt (theo /feature, ghi ở đây thay cho docs/superpowers/specs). Dựa trên spec tổng mục 5 và 9; phạm vi lượt này được người dùng duyệt ngày 2026-11-18.

## 1. Mục tiêu và phạm vi
Luyện phần viết HSK4 (完成句子), trọng tâm sắp xếp câu, để tự học và hiểu vì sao sai.

**Trong lượt này:** chế độ Sắp xếp câu, Phân tích lỗi, Ôn câu sai (SRS), bộ chấm, 6–8 bài quy tắc trật tự từ, khoảng 100 câu mẫu, thống kê lỗi hay mắc, mở mục "Luyện viết" trên điều hướng.
**Để các lượt sau:** Đặt câu theo từ/hình, mở rộng ngân hàng lên 400–800 câu, đủ 15–20 bài quy tắc.
**Nguyên tắc:** theo mục 9 spec tổng (tập trung, phản hồi nhẹ nhàng, di động trước). Nội dung do AI soạn: mỗi câu có `reviewed` và nút "nghi sai". Không sao chép đề thi thật.

## 2. Hướng chọn
Chạm/bàn phím là chính, kéo thả là phần bổ sung (`@dnd-kit`, có hỗ trợ bàn phím). Các cụm xáo trộn nằm trong "khay"; chạm một cụm thì nhảy vào dòng đáp án, chạm lại thì quay về khay; kéo để đổi vị trí trong dòng đáp án.

## 3. Dữ liệu — `src/content/writing/`
`sentences.json`, mỗi câu:
- `id`, `chunks: string[]` (các cụm theo thứ tự chuẩn), `accepted: number[][]` (các hoán vị chỉ số cụm được chấp nhận; luôn gồm thứ tự chuẩn), `pinyin`, `meaningVi`, `pattern` (mẫu ngữ pháp), `ruleId`, `mistakes: {order: number[]; tag: ErrorTag}[]`, `difficulty: 1|2|3`, `reviewed: boolean`.

`rules.json`: `id`, `title`, `summary`, `explanation`, `examples[]`, `tag: ErrorTag`.
`ErrorTag`: `adverbial-before-verb | ba-position | bei-position | shi-de | result-complement | attributive-order | time-place-order | other`.

`scripts/validate-content` mở rộng: mọi từ trong câu thuộc HSK1–4 (từ ngoài phạm vi bị cờ), không trùng câu, đủ trường, `ruleId` tồn tại, mỗi `accepted`/`mistakes.order` là hoán vị hợp lệ. Sai schema Zod thì build thất bại.

## 4. Bộ chấm (hàm thuần, có unit test)
`gradeOrder(sentence, order): {ok: true} | {ok: false; tag: ErrorTag; correct: number[]}`: ok khi `order` trùng một mục của `accepted`; sai thì tìm trong `mistakes` (khớp chính xác), không có thì dùng tag của `ruleId` của câu.

## 5. Màn hình
- `/writing`: chọn bài (Sắp xếp câu, Ôn câu sai, Quy tắc, Lỗi hay mắc). Trong route group `(main)`.
- `/writing/practice` (FocusLayout, ngoài group): mỗi câu một màn hình; Enter = Kiểm tra; sai thì nhẹ nhàng làm nổi đáp án đúng kèm giải thích và liên kết sang bài quy tắc; nút "nghi sai"; phiên 10 câu → tổng kết rồi dừng. Esc thoát.
- `/writing/rules`, `/writing/rules/[id]`: bài quy tắc kèm các câu luyện đi kèm.
- `/writing/mistakes`: thống kê nhãn lỗi hay mắc.
- Điều hướng: bật mục "Luyện viết" (AppShell); trang chủ thêm lối vào.

## 6. Lưu trữ và SRS
- Bảng `attempts` mới (`sentenceId`, `ok`, `tag`, `at`) trong Dexie (nâng version schema) và MemoryStorage.
- Backup vẫn `version: 1`, thêm `attempts` không bắt buộc (mặc định `[]`) → tệp cũ vẫn khôi phục được; schema backup vẫn chặt (kiểu và giới hạn).
- Làm sai → thẻ SM-2 id `s:<sentenceId>` trong kho `cards` hiện có. Hàng đợi "Ôn câu sai" tách riêng hàng đợi từ vựng nhưng dùng chung `schedule` SM-2; `buildQueue` từ vựng bỏ qua id bắt đầu bằng `s:`.
- Đánh dấu "nghi sai" lưu cục bộ (như bản sửa nghĩa), gửi cùng backup.

## 7. Kiểm thử
Vitest: bộ chấm, schema nội dung, hàng đợi câu sai, thống kê lỗi, backup có `attempts`. Playwright: một phiên sắp xếp bằng chạm và bằng bàn phím, sai thì hiện giải thích, thẻ sai vào hàng đợi ôn, sao lưu/khôi phục có `attempts`, ảnh sáng/tối desktop/di động.

## 8. Rủi ro
- Nội dung AI soạn có thể sai → `reviewed`, nút "nghi sai", validate từ vựng.
- Định dạng HSK 3.0 phần viết chưa xác minh → theo định dạng 2.0 trước.
- Nâng version Dexie: phải có migration giữ nguyên dữ liệu giai đoạn 1.

## Nhật ký sửa đổi
| Task | File / symbol | Mô tả |
|---|---|---|
| 1 | types.ts (ErrorTag, WritingAttempt, Settings.flaggedSentences), backup-schema.ts (attempts), dexie-storage.ts (v2 + attempts), memory-storage.ts |
| 2 | src/lib/writing/{schema,grade,shuffle,stats,labels}.ts |
| 3 | scripts/lib/validate-writing.ts, scripts/validate-content.ts, src/content/writing/{rules,sentences}.json |
| 4 | sentences.json: 50 câu đợt 1 (w001–w050), 7 quy tắc; reviewed=false |
| 5 | sentences.json: 100 câu (w001–w100), ≥12 câu mỗi quy tắc |
| 6 | src/lib/writing/session.ts: pickPractice, buildWrongQueue, recordAttempt, cardIdFor |
| 7 | src/components/writing/SentenceBoard.tsx: khay + dòng đáp án, phím 1–9/Backspace/Enter |
| 8 | src/lib/writing/move.ts (moveChunk); SentenceBoard.tsx: DndContext + SortableContext, Space nhấc, thông báo tiếng Việt |
| 9 | WritingSession.tsx, FeedbackPanel.tsx, app/writing/practice/page.tsx (ngoài (main), ?mode=wrong|practice) |
