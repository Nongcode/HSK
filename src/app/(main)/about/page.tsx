const SOURCES = [
  {
    name: "complete-hsk-vocabulary",
    url: "https://github.com/drkameleon/complete-hsk-vocabulary",
    license: "MIT",
    use: "Danh sách từ HSK 2.0 và 3.0 theo cấp, từ loại.",
  },
  {
    name: "CVDICT",
    url: "https://github.com/ph0ngp/CVDICT",
    license: "CC BY-SA 4.0",
    use: "Nghĩa tiếng Việt.",
  },
  {
    name: "OpenCidian",
    url: "https://github.com/OpenCidian/opencidian-data",
    license: "CC BY-SA 4.0",
    use: "Âm Hán Việt (và tổng hợp dữ liệu CVDICT).",
  },
  {
    name: "CC-CEDICT",
    url: "https://www.mdbg.net/chinese/dictionary?page=cc-cedict",
    license: "CC BY-SA 4.0",
    use: "Nghĩa tiếng Anh.",
  },
  {
    name: "Hanzi Writer",
    url: "https://hanziwriter.org",
    license: "MIT; dữ liệu nét chữ từ Make Me a Hanzi (Arphic Public License)",
    use: "Thứ tự nét chữ Hán — dự kiến dùng ở giai đoạn sau.",
  },
  {
    name: "Arphic Public License",
    url: "https://github.com/skishore/makemeahanzi",
    license: "Arphic Public License",
    use: "Phông/dữ liệu nét của Arphic trong Make Me a Hanzi — giai đoạn sau.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-medium">Giấy phép và nguồn</h1>
      <p className="text-muted">
        Dữ liệu từ vựng được gộp từ các nguồn mở dưới đây. Dữ liệu phái sinh từ các nguồn CC BY-SA được chia sẻ theo cùng giấy phép (CC BY-SA 4.0).
      </p>
      <ul className="space-y-4">
        {SOURCES.map((s) => (
          <li key={s.name} className="rounded-xl border border-line bg-surface p-4">
            <a href={s.url} className="font-medium underline" target="_blank" rel="noreferrer">
              {s.name}
            </a>
            <p className="text-sm text-muted">Giấy phép: {s.license}</p>
            <p className="text-sm">{s.use}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
