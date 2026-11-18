import Link from "next/link";
import rulesData from "@/content/writing/rules.json";
import { parseRules } from "@/lib/writing/schema";

const rules = parseRules(rulesData);

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-medium">Quy tắc trật tự từ</h1>
      <ul className="space-y-3">
        {rules.map((r) => (
          <li key={r.id}>
            <Link
              href={`/writing/rules/${r.id}`}
              className="block min-h-11 space-y-1 rounded-2xl border border-line bg-surface p-5 hover:border-accent"
            >
              <span className="block text-lg font-medium">{r.title}</span>
              <span className="block text-sm text-muted">{r.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
