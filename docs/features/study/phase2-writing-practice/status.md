# Status — Giai đoạn 2: Luyện viết (sắp xếp câu)

> Nguồn sự thật để tiếp tục công việc. Cập nhật NGAY sau mỗi task.

## Tóm tắt nhanh

| Mục | Giá trị |
|---|---|
| Trạng thái | 🟡 IN_PROGRESS |
| Yêu cầu đang làm | CR-002 — Luyện viết: sắp xếp câu |
| Bước Superpowers | executing-plans xong 11/11 → review cuối nhánh |
| Task đang làm | T-002.12 |
| **Bước tiếp theo** | Review cuối nhánh |
| Branch | feat/phase1-foundation (làm tiếp trên nhánh này) |
| Cập nhật lần cuối | 2026-11-18 |
| Ghi chú dở dang | Còn: review cuối nhánh (Opus), fix pass, finishing-a-development-branch |

## File chính
| File | Vai trò |
|---|---|
| docs/features/study/phase2-writing-practice/design.md | Spec đã chốt |
| docs/superpowers/specs/2026-11-18-hsk4-study-site-design.md | Spec tổng (mục 5, 9) |

## Yêu cầu

### CR-002 — Luyện viết: sắp xếp câu · 🟡 IN_PROGRESS · 2026-11-18

| ID | Task | Trạng thái | Test | Ghi chú |
|---|---|---|---|---|
| T-002.1 | Lưu trữ: attempts, cờ nghi sai, Dexie v2 | ✅ DONE | vitest 109/109 + tsc; Bỏ qua Playwright: lớp dữ liệu | |
| T-002.2 | Schema, bộ chấm, xáo trộn, thống kê | ✅ DONE | vitest writing 13/13 + tsc; Bỏ qua Playwright: hàm thuần | |
| T-002.3 | Bài quy tắc + validate nội dung viết | ✅ DONE | vitest scripts 5/5 validate-writing; npm run validate OK (7 bài quy tắc); Bỏ qua Playwright: dữ liệu/script | |
| T-002.4 | Câu mẫu đợt 1 (~50) | ✅ DONE | content.test + validate: 50 câu hợp lệ | |
| T-002.5 | Câu mẫu đợt 2 (~100) | ✅ DONE | content.test: ≥100 câu, ≥12/quy tắc | |
| T-002.6 | Hàng đợi luyện viết + ghi kết quả SRS | ✅ DONE | session.test 10 ca pass; tsc ok; bỏ qua Playwright (logic thuần) | |
| T-002.7 | Bảng sắp xếp câu (chạm + bàn phím) | ✅ DONE | SentenceBoard.test 8 ca pass; bỏ qua Playwright: chưa gắn vào trang (làm ở T-002.9) | |
| T-002.8 | Kéo thả @dnd-kit | ✅ DONE | move.test 3 + SentenceBoard.test 8 pass (chạm vẫn hoạt động); Playwright kéo thả kiểm ở T-002.9/11 | |
| T-002.9 | Phiên luyện + phản hồi + ôn câu sai | ✅ DONE | WritingSession.test 8 ca pass; tsc/lint ok; Playwright e2e gộp ở T-002.11 (trang /writing/practice đã có) | |
| T-002.10 | Trang Luyện viết, quy tắc, lỗi hay mắc, điều hướng | ✅ DONE | vitest 166/166, tsc/lint ok; Playwright shell+home pass (desktop+mobile); e2e luồng viết ở T-002.11 | |
| T-002.11 | E2E, ảnh chụp, kiểm tra cuối | ✅ DONE | writing.spec 7 kịch bản × 2 + full playwright 36 pass; build OK | |

## Kết quả test gần nhất
| Thời gian | Lệnh / kịch bản | Kết quả | Ghi chú |
|---|---|---|---|

## Nhật ký phiên
- 2026-11-18 — Chốt phạm vi (bộ máy + ~100 câu mẫu), hướng A (chạm/bàn phím + dnd-kit), viết design.md.

## Kết quả test gần nhất (T-002.11, 2026-11-18)
- `npm run validate`: 3317 từ, 100 câu viết, 7 quy tắc — OK
- `npx vitest run`: 29 file, 166/166 pass
- `npx tsc --noEmit` OK; `npm run lint`: 0 lỗi (3 cảnh báo biến `_` đã có từ trước)
- `npm run build`: OK (có /writing/*, rules SSG)
- `npx playwright test`: 36 pass, 1 skip (kéo thả chỉ desktop). 1 lần `vocab.spec` fail khi chạy song song (flaky đã biết; chạy riêng 4/4 pass). `writing.spec` TC-10 từng chậm do biên dịch dev lần đầu → nới timeout 20s.
- Ảnh: `screenshots/T-002.11-*` (sáng/tối, desktop/mobile).

## Review cuối nhánh (2026-11-18)
- Reviewer (Opus): không có Critical. 2 Important đã sửa bằng TDD (RED→GREEN, vitest 179/179, writing e2e 13/13):
  1. Enter toàn cục chiếm Enter của liên kết/nút đang focus → thêm `isFocusedControl` (2 test mới).
  2. 11 câu thiếu thứ tự đúng tự nhiên (đảo tân ngữ/định ngữ) → thêm vào `accepted` (11 test mới); sửa pinyin w015.
- Minor chưa xử lý: shuffle fallback không kiểm tra; bàn cờ chưa khóa khi đang lưu; thử lại sau lỗi lưu có thể đếm đôi attempt; phím số/Backspace hoạt động khi đang kéo bằng phím; mất focus sau khi chạm; `started` ref khi đổi query; WritingHome/MistakesView không có nhánh lỗi; validator kiểm tra chữ chứ không phải từ; nhãn `result-complement` gộp nhiều loại; nhắc sao lưu không tính luyện viết; chưa có test kéo bằng phím.

## CR-003 — Mở rộng và nâng chất lượng kho câu · 🟡 chờ duyệt kế hoạch · 2026-11-18

| ID | Task | Trạng thái | Test | Ghi chú |
|---|---|---|---|---|
| T-003.1 | Khảo sát dạng đề HSK4 công khai | ✅ DONE | Bỏ qua Playwright: chỉ đọc tài liệu | xem design.md mục CR-003 khảo sát |
| T-003.2 | Script nhập Tatoeba | ✅ DONE | vitest tatoeba 10/10, tsc+eslint sạch; bỏ qua Playwright (không đổi UI) | 295 ứng viên; xem ghi chú dưới |
| T-003.3 | Rà soát bằng agent (2 lượt) | ⬜ TODO | | |
| T-003.4 | Nhập câu vào sentences.json + trường source | ⬜ TODO | | |
| T-003.5 | Trang Giấy phép: thêm Tatoeba | ⬜ TODO | | cần Playwright |
| T-003.6 | Xác minh cuối + tài liệu | ⬜ TODO | | |

**T-003.2 ghi chú (2026-11-18):** dữ liệu Tatoeba tải về `D:/hsk-data/tatoeba/out` (ngoài repo; file export theo ngôn ngữ không kèm tác giả nên ghi nguồn bằng id `tatoeba:<id>` + trang Giấy phép). Script `scripts/import-tatoeba.ts` + `scripts/lib/tatoeba.ts` cho **295 ứng viên** (`D:/hsk-data/candidates.json`): 257 chưa gắn quy tắc, 29 shi-de, 9 ba, 0 bei (heuristic từ khoá còn thô, có dương tính giả như 是…的 trong "可惜这是真的"). Ruling: script chỉ phân đoạn từ (longest-match), việc chia cụm cuối + `accepted`/`mistakes`/pinyin giao cho agent ở T-003.3 vì chia cụm tự động không đủ tin cậy. Bản dịch Việt của Tatoeba lỏng/sai ở một số câu (vd. tatoeba:15, :332638) → agent phải viết lại `meaningVi` khi cần. Với 295 ứng viên, 0 câu bei → có thể cần tự viết thêm câu `original` cho bei/result/time-place.
