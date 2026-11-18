# Website ôn tập HSK4 — Thiết kế

Ngày: 2026-11-18 · Trạng thái: chờ người dùng duyệt

## 1. Mục tiêu và phạm vi

Website Next.js giúp một người tự học và ôn thi HSK4, tập trung vào **kỹ năng viết, đặc biệt là sắp xếp từ thành câu**.

**Đã chốt với người dùng:**
- Người dùng: một người, không có tài khoản. Tiến độ lưu trên trình duyệt.
- Giao diện tiếng Việt.
- Hỗ trợ cả HSK 2.0 (cũ, 300 điểm) và HSK 3.0 (mới). Người dùng chọn phiên bản khi học.
- Nội dung: dữ liệu mở cho từ vựng; ngữ pháp, câu viết và đề thi do AI soạn mới theo đúng dạng HSK4, không sao chép đề thật. Người dùng rà soát dần.
- Bốn mảng tính năng, làm theo giai đoạn, mỗi giai đoạn có spec và kế hoạch riêng.

**Ngoài phạm vi:** tài khoản, đồng bộ nhiều thiết bị, bảng xếp hạng, âm thanh nghe thật (dùng TTS của trình duyệt).

## 2. Lộ trình

| # | Giai đoạn | Nội dung |
|---|---|---|
| 1 | Nền tảng và từ vựng | Dự án, kho dữ liệu, bộ chuyển 2.0/3.0, thư viện từ, flashcard SRS, sao lưu |
| 2 | **Luyện viết (trọng tâm)** | Sắp xếp câu, phân tích lỗi, đặt câu theo từ, ôn câu sai |
| 3 | Ngữ pháp | Bài giảng điểm ngữ pháp, gắn với bài tập viết |
| 4 | Thi thử | Nghe, đọc, viết tính giờ, thang 300 điểm |
| 5 | Tập viết chữ Hán | Thứ tự nét bằng Hanzi Writer |

Spec này mô tả chi tiết giai đoạn 1 và 2. Giai đoạn 3–5 sẽ có spec riêng.

## 3. Kiến trúc

Next.js (App Router) + TypeScript + Tailwind. Nội dung tĩnh dạng JSON trong repo. Tiến độ lưu bằng IndexedDB (Dexie). PWA để dùng offline. Deploy tĩnh (Vercel hoặc Cloudflare Pages).

```
src/
  app/            # page.tsx (trang chủ), vocab/, writing/, settings/
  content/        # vocab/, writing/ (JSON có schema)
  lib/
    storage/      # interface Storage + cài đặt Dexie
    srs/          # SM-2 dùng chung
    content/      # nạp và kiểm tra dữ liệu bằng Zod
  components/
scripts/          # build-vocab, validate-content
```

Mọi truy cập lưu trữ đi qua interface `Storage`, để sau này thêm đồng bộ không phải sửa giao diện.

## 4. Giai đoạn 1 — Nền tảng và từ vựng

### Dữ liệu từ vựng
`scripts/build-vocab` gộp:
- HSK 2.0/3.0 theo cấp: [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (MIT).
- Nghĩa Việt: [CVDICT](https://github.com/ph0ngp/CVDICT) (CC BY-SA 4.0).
- Hán Việt: [OpenCidian](https://github.com/OpenCidian/opencidian-data) (CC BY-SA 4.0).
- Nghĩa Anh: [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) (CC BY-SA 4.0).

Mỗi từ: giản thể, pinyin, từ loại, nghĩa Việt, nghĩa Anh, Hán Việt, ví dụ, `hsk2` (cấp hoặc null), `hsk3` (cấp hoặc null), `reviewed` (đã rà soát nghĩa Việt hay chưa). Người dùng sửa nghĩa trên giao diện; bản sửa lưu cục bộ (`userEdits`) và đè lên dữ liệu gốc. Trang "Giấy phép và nguồn" ghi rõ các nguồn theo yêu cầu giấy phép.

### Màn hình
- **Trang chủ:** số thẻ cần ôn hôm nay, chuỗi ngày học, đường vào luyện viết.
- **Thư viện từ:** tìm kiếm, lọc theo cấp và phiên bản, chi tiết từ, phát âm (Web Speech API).
- **Flashcard:** lật thẻ, chọn quên/khó/được/dễ, giới hạn thẻ mới mỗi ngày, thống kê.
- **Cài đặt:** chọn HSK 2.0/3.0, xuất/nhập sao lưu JSON, chế độ sáng/tối, nhắc sao lưu mỗi 7 ngày.

### SRS và lưu trữ
- SM-2 cho cả thẻ từ vựng và câu viết sai, một hàng đợi ôn chung.
- Bảng Dexie: `cardState`, `reviewLog`, `settings`, `userEdits`, `writingAttempts`.

## 5. Giai đoạn 2 — Luyện viết

Dạng đề HSK4 phần viết (15 câu): 10 câu sắp xếp từ thành câu, 5 câu nhìn hình dùng từ cho sẵn để đặt câu.

### Bốn chế độ
1. **Sắp xếp câu:** các cụm từ bị xáo trộn, kéo thả hoặc bấm để xếp. Bấm "kiểm tra" để chấm. Chấp nhận nhiều đáp án đúng khi trật tự từ linh hoạt.
2. **Phân tích lỗi:** khi sai, hiện đáp án đúng và giải thích quy tắc vi phạm (trạng ngữ trước động từ, vị trí 把/被, 是…的, bổ ngữ kết quả, trật tự định ngữ…). Lỗi gắn nhãn theo loại; có thống kê lỗi hay mắc.
3. **Đặt câu theo từ:** cho từ hoặc hình, người dùng gõ câu. Hệ thống **không chấm tự động**; hiện câu mẫu và checklist (dùng đúng từ, đủ thành phần câu, trật tự từ) để người dùng tự đánh giá.
4. **Ôn câu sai:** câu làm sai vào hàng đợi SRS chung.

### Tài liệu ôn tập
- Ngân hàng khoảng **400 câu sắp xếp** theo độ khó và chủ điểm ngữ pháp; mục tiêu mở rộng 800 câu. Ngân hàng cố định, không sinh câu động theo từ vựng.
- Khoảng **120 bài đặt câu theo từ**, chủ yếu từ vựng HSK4.
- **15–20 bài quy tắc trật tự từ** ngắn, có ví dụ và bài tập đi kèm.
- Mỗi câu gồm: các cụm từ, một hoặc nhiều đáp án, pinyin, nghĩa Việt, mẫu ngữ pháp, nhãn lỗi thường gặp, độ khó, `reviewed`.

### Kiểm soát chất lượng
- `scripts/validate-content`: mọi từ phải thuộc từ vựng HSK1–4 của phiên bản đang xét (từ ngoài phạm vi bị cờ), không trùng câu, đủ trường dữ liệu. Sai schema Zod thì build thất bại.
- Mỗi câu có `reviewed` (đã rà soát / chưa). Giao diện cho phép đánh dấu "nghi sai" ngay khi luyện.
- Nội dung do AI soạn nên có thể sai; người dùng rà soát dần.
- Không sao chép đề thi thật.

### Bộ chấm
Hàm thuần so khớp chuỗi cụm từ người dùng xếp với danh sách đáp án chấp nhận. Trả về đúng/sai và, nếu sai, nhãn lỗi gần nhất. Có unit test.

## 6. Xử lý lỗi
- IndexedDB không dùng được (chế độ riêng tư): cảnh báo rõ, chạy chế độ chỉ trong phiên.
- Dữ liệu sai schema: build thất bại.
- Nhập file sao lưu sai định dạng: từ chối, không ghi đè dữ liệu hiện có.

## 7. Kiểm thử
- Vitest: SM-2, bộ chấm sắp xếp câu, schema nội dung.
- Playwright: ôn một thẻ, làm một bài sắp xếp, xuất và nhập sao lưu.
- Chạy test thật và báo kết quả thật trước khi báo hoàn thành từng giai đoạn.

## 8. Rủi ro
- **Định dạng HSK 3.0 chưa xác minh từ nguồn chính thức.** Đề cương mới công bố 15/11/2025, có thể hiệu lực từ 7/2026. Phần luyện viết theo định dạng 2.0 trước; kiểm tra lại chinesetest.cn trước giai đoạn thi thử.
- Nghĩa Việt từ nguồn mở là dịch từ nghĩa Anh, có thể thô; cần rà soát.
- Dữ liệu chỉ ở trình duyệt: mất khi xoá cache nếu chưa sao lưu.
- Giấy phép CC BY-SA yêu cầu ghi nguồn và chia sẻ tương tự cho dữ liệu phái sinh.

## 9. UI/UX — môi trường học tập tập trung

Yêu cầu bổ sung của người dùng: giao diện thân thiện, phù hợp học tập tập trung.

- **Tối giản, ít gây xao nhãng:** nền dịu (kem/xám ấm, có chế độ tối), một màu nhấn duy nhất, không banner, không popup, không hiệu ứng chớp. Chuyển động nhẹ, tôn trọng `prefers-reduced-motion`.
- **Chế độ tập trung:** khi ôn flashcard hoặc làm bài, ẩn thanh điều hướng, chỉ giữ tiến độ phiên và nút thoát. Mỗi màn hình một việc chính.
- **Chữ Hán rõ ràng:** cỡ chữ lớn, font Noto Sans/Serif SC, pinyin tách dòng, có thể ẩn pinyin và nghĩa để tự kiểm tra. Có tuỳ chọn cỡ chữ.
- **Phím tắt:** Space lật thẻ, 1–4 chấm điểm, Enter kiểm tra, Esc thoát phiên. Có gợi ý phím ngay trên nút.
- **Phản hồi nhẹ nhàng:** sai không báo đỏ gắt, chỉ làm nổi đáp án đúng kèm giải thích. Không bắt "chuỗi ngày" quá nặng nề.
- **Di động trước:** bố cục dùng một tay, vùng bấm tối thiểu 44px, kéo thả có phương án bấm thay thế.
- **Khả năng tiếp cận:** tương phản đạt WCAG AA, điều khiển được bằng bàn phím, có nhãn ARIA.
- **Phiên học có điểm dừng:** giới hạn thẻ mỗi phiên, kết thúc có tổng kết ngắn rồi dừng, không tự đẩy sang phiên tiếp theo.
