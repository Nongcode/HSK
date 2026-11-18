"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { WritingSession } from "@/components/writing/WritingSession";
import rulesData from "@/content/writing/rules.json";
import sentencesData from "@/content/writing/sentences.json";
import { parseRules, parseSentences } from "@/lib/writing/schema";

const sentences = parseSentences(sentencesData);
const rules = parseRules(rulesData);

function Practice() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode") === "wrong" ? "wrong" : "practice";
  const ruleId = params.get("rule");
  const pool = mode === "practice" && ruleId ? sentences.filter((s) => s.ruleId === ruleId) : sentences;
  return (
    <WritingSession
      mode={mode}
      sentences={pool}
      rules={rules}
      onExit={() => router.push("/writing")}
    />
  );
}

export default function WritingPracticePage() {
  return (
    <Suspense fallback={null}>
      <Practice />
    </Suspense>
  );
}
