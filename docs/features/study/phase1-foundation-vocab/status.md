# Status — Giai đoạn 1: Nền tảng và từ vựng

> Nguồn sự thật để tiếp tục công việc. Cập nhật NGAY sau mỗi task. Sổ chi tiết kỹ thuật: `.superpowers/sdd/2026-11-18-hsk4-phase1-foundation-vocab/progress.md` (git-ignored).

## Tóm tắt nhanh

| Mục | Giá trị |
|---|---|
| Trạng thái | 🟡 IN_PROGRESS |
| Yêu cầu đang làm | CR-001 — Nền tảng, từ vựng, flashcard SRS |
| Bước Superpowers | executing-plans (inline) |
| Task đang làm | T-001.8 |
| **Bước tiếp theo** | Task 8: thư viện từ vựng src/app/(main)/vocab |
| Branch | feat/phase1-foundation |
| Cập nhật lần cuối | 2026-11-18 |
| Ghi chú dở dang | Không |

## File chính
| File | Vai trò |
|---|---|
| docs/superpowers/plans/2026-11-18-hsk4-phase1-foundation-vocab.md | Plan 12 task |

## Yêu cầu

### CR-001 — Nền tảng, từ vựng, flashcard · 🟡 IN_PROGRESS · 2026-11-18

| ID | Task | Trạng thái | Test | Ghi chú |
|---|---|---|---|---|
| T-001.1 | Khởi tạo dự án + theme | ⬜ TODO | | |
| T-001.2 | Schema nội dung | ✅ DONE | vitest schema 5/5; Bỏ qua Playwright: logic thuần | |
| T-001.3 | Script dựng từ vựng | ✅ DONE | vitest merge 8/8; npm run validate 3317 từ; Bỏ qua Playwright: script dữ liệu | |
| T-001.4 | Storage + Dexie | ✅ DONE | vitest storage 11/11 (Memory+Dexie); Bỏ qua Playwright: lớp dữ liệu | |
| T-001.5 | SM-2 | ✅ DONE | vitest sm2 6/6; Bỏ qua Playwright: hàm thuần | |
| T-001.6 | Nạp từ vựng + AppContext | ✅ DONE | vitest 6/6 + tsc; Bỏ qua Playwright: chưa có UI | |
| T-001.7 | AppShell + FocusLayout | ✅ DONE | vitest 5/5 + Playwright e2e/shell.spec.ts (desktop+mobile) 2/2 | Route group (main) |
| T-001.8 | Thư viện từ vựng | ⬜ TODO | | |
| T-001.9 | Phiên flashcard | ⬜ TODO | | |
| T-001.10 | Trang chủ | ⬜ TODO | | |
| T-001.11 | Cài đặt + sao lưu | ⬜ TODO | | |
| T-001.12 | About, PWA, e2e | ⬜ TODO | | |

## Kết quả test gần nhất
| Thời gian | Lệnh / kịch bản | Kết quả | Ghi chú |
|---|---|---|---|

## Nhật ký phiên
- 2026-11-18 — Spec và plan đã duyệt; chọn thực thi Native; tạo nhánh và tài liệu chức năng.
