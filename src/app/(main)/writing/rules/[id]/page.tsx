import { RuleView } from "@/components/writing/RuleView";
import rulesData from "@/content/writing/rules.json";
import { parseRules } from "@/lib/writing/schema";

const rules = parseRules(rulesData);

export function generateStaticParams() {
  return rules.map((r) => ({ id: r.id }));
}

export default async function RulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RuleView id={decodeURIComponent(id)} rules={rules} />;
}
