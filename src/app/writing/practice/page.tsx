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
  const mode = useSearchParams().get("mode") === "wrong" ? "wrong" : "practice";
  return (
    <WritingSession
      mode={mode}
      sentences={sentences}
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
