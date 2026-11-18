# Plan — Giai đoạn 1: Nền tảng và từ vựng

Nguồn thiết kế và kế hoạch chi tiết (đã duyệt):
- Spec: `docs/superpowers/specs/2026-11-18-hsk4-study-site-design.md`
- Plan 12 task: `docs/superpowers/plans/2026-11-18-hsk4-phase1-foundation-vocab.md`

## CR-001 — Nền tảng, từ vựng, flashcard SRS
Mục tiêu: website Next.js tĩnh, thư viện từ HSK 2.0/3.0, flashcard SM-2, sao lưu tiến độ, UI tập trung.
Tiêu chí nghiệm thu: `npm run validate`, `npx vitest run`, `npx playwright test`, `npm run build` đều pass; ảnh chụp desktop/di động sáng/tối.

## Kịch bản test Playwright
- TC-01: /vocab tìm một từ, mở chi tiết.
- TC-02: /review lật thẻ bằng Space, chấm bằng phím 3, thẻ rời hàng đợi.
- TC-03: xuất sao lưu → xoá dữ liệu → nhập lại → tiến độ khôi phục.
- TC-04: /about đủ giấy phép các nguồn.
- TC-05: chế độ tập trung ẩn điều hướng, Esc thoát.
