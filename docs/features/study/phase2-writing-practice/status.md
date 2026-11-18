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
