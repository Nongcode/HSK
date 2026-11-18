import Link from "next/link";
import type { Rule } from "@/lib/writing/schema";

export function RuleView({ id, rules }: { id: string; rules: Rule[] }) {
  const rule = rules.find((r) => r.id === id);
  if (!rule) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <p>Không tìm thấy bài quy tắc này.</p>
        <Link href="/writing/rules" className="inline-flex min-h-11 items-center text-accent underline">
          Danh sách quy tắc
        </Link>
      </div>
    );
  }
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link href="/writing/rules" className="inline-flex min-h-11 items-center text-sm text-muted underline">
        ← Danh sách quy tắc
      </Link>
      <h1 className="text-2xl font-medium">{rule.title}</h1>
      <p className="text-muted">{rule.summary}</p>
      <p className="leading-relaxed">{rule.explanation}</p>
      <section aria-label="Ví dụ" className="space-y-3">
        <h2 className="text-lg font-medium">Ví dụ</h2>
        <ul className="space-y-3">
          {rule.examples.map((e) => (
            <li key={e.zh} className="rounded-xl border border-line bg-surface p-4">
              <p lang="zh-Hans" className="font-hanzi text-xl">
                {e.zh}
              </p>
              <p className="text-sm text-muted">{e.pinyin}</p>
              <p className="text-sm">{e.vi}</p>
            </li>
          ))}
        </ul>
      </section>
      <Link
        href={`/writing/practice?rule=${rule.id}`}
        className="inline-flex min-h-12 items-center rounded-xl bg-accent px-6 font-medium text-accent-text"
      >
        Luyện các câu này
      </Link>
    </article>
  );
}
