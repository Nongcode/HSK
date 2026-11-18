"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { downloadBackup, importBackupText } from "@/lib/backup";

const field = "min-h-11 rounded-lg border border-line bg-surface px-3";

export function SettingsForm() {
  const { storage, settings, setSettings, refresh } = useApp();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onImport(file: File | undefined) {
    if (!file) return;
    if (!window.confirm("Khôi phục sẽ ghi đè toàn bộ tiến độ hiện tại. Bạn chắc chắn chứ?")) return;
    try {
      await importBackupText(storage, await file.text());
      await refresh();
      setMessage({ ok: true, text: "Đã khôi phục dữ liệu từ tệp sao lưu." });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Không khôi phục được." });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-medium">Cài đặt</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Chuẩn HSK</h2>
        <div className="flex gap-3" role="radiogroup" aria-label="Chuẩn HSK">
          {(["2.0", "3.0"] as const).map((v) => (
            <label key={v} className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4">
              <input
                type="radio"
                name="hsk"
                checked={settings.hskVersion === v}
                onChange={() => setSettings({ hskVersion: v })}
              />
              HSK {v}
            </label>
          ))}
        </div>
        <p className="text-sm text-muted">
          HSK 2.0 là chuẩn 6 cấp đang dùng cho kỳ thi hiện hành; HSK 3.0 là chuẩn mới 9 cấp. Danh sách từ thay đổi theo lựa chọn.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Hạn mức ôn tập</h2>
        <label className="flex items-center justify-between gap-4">
          Thẻ mới mỗi ngày
          <input
            type="number"
            min={0}
            max={200}
            className={`${field} w-24`}
            value={settings.dailyNewLimit}
            onChange={(e) => setSettings({ dailyNewLimit: Math.max(0, Number(e.target.value) || 0) })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          Số thẻ tối đa mỗi phiên
          <input
            type="number"
            min={1}
            max={500}
            className={`${field} w-24`}
            value={settings.sessionLimit}
            onChange={(e) => setSettings({ sessionLimit: Math.max(1, Number(e.target.value) || 1) })}
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Giao diện</h2>
        <label className="flex items-center justify-between gap-4">
          Chủ đề
          <select
            className={field}
            value={settings.theme}
            onChange={(e) => setSettings({ theme: e.target.value as typeof settings.theme })}
          >
            <option value="system">Theo hệ thống</option>
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-4">
          Cỡ chữ
          <select
            className={field}
            value={settings.fontScale}
            onChange={(e) => setSettings({ fontScale: Number(e.target.value) })}
          >
            <option value={0.9}>Nhỏ</option>
            <option value={1}>Vừa</option>
            <option value={1.15}>Lớn</option>
            <option value={1.3}>Rất lớn</option>
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Sao lưu và khôi phục</h2>
        <p className="text-sm text-muted">
          Tiến độ được lưu ngay trong trình duyệt này. Hãy tải tệp sao lưu định kỳ để không mất dữ liệu khi xoá dữ liệu trình duyệt.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-accent px-4 text-accent-text"
            onClick={async () => {
              await downloadBackup(storage);
              await setSettings({ lastBackupAt: Date.now() });
              setMessage({ ok: true, text: "Đã tải tệp sao lưu." });
            }}
          >
            Tải bản sao lưu
          </button>
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-line bg-surface px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
            Khôi phục từ tệp
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                void onImport(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {message && (
          <p role="status" className={message.ok ? "text-ok" : "text-warn"}>
            {message.text}
          </p>
        )}
      </section>

      <p className="text-sm text-muted">
        <Link href="/about" className="underline">
          Giấy phép và nguồn dữ liệu
        </Link>
      </p>
    </div>
  );
}
