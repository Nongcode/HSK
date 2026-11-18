// Usage: tsx scripts/import-tatoeba.ts <tatoeba-dir> <out.json>
// <tatoeba-dir> holds cmn_sentences.tsv, vie_sentences.tsv, links.csv (downloaded, kept outside the repo).
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { parseVocab } from "../src/lib/content/schema";
import { parseSentences } from "../src/lib/writing/schema";
import { allowedChars } from "./lib/validate-writing";
import { isCandidate, parseSentenceTsv, segment, suggestRule } from "./lib/tatoeba";

const [dir, out] = process.argv.slice(2);
if (!dir || !out) {
  console.error("Usage: tsx scripts/import-tatoeba.ts <tatoeba-dir> <out.json>");
  process.exit(1);
}

const vocab = parseVocab(JSON.parse(readFileSync("src/content/vocab/hsk-words.json", "utf8")));
const allowed = allowedChars(vocab);
const hanzi = vocab.map((w) => w.hanzi);
const existing = new Set(
  parseSentences(JSON.parse(readFileSync("src/content/writing/sentences.json", "utf8"))).map((s) => s.chunks.join("")),
);

const cmn = parseSentenceTsv(readFileSync(`${dir}/cmn_sentences.tsv`, "utf8"));
const vie = parseSentenceTsv(readFileSync(`${dir}/vie_sentences.tsv`, "utf8"));
const good = new Set([...cmn].filter(([, zh]) => isCandidate(zh, allowed) && !existing.has(zh.replace(/[，。？！、]/g, ""))).map(([id]) => id));

async function main() {
const found = new Map<number, number[]>();
const rl = createInterface({ input: createReadStream(`${dir}/links.csv`) });
for await (const line of rl) {
  const [a, b] = line.split("\t").map(Number);
  if (good.has(a) && vie.has(b)) found.set(a, [...(found.get(a) ?? []), b]);
}

const candidates = [...found].sort((x, y) => x[0] - y[0]).map(([id, vids]) => {
  const zh = cmn.get(id)!;
  return { source: `tatoeba:${id}`, zh, vi: vie.get(vids[0])!, words: segment(zh, hanzi), rule: suggestRule(zh) };
});
writeFileSync(out, JSON.stringify(candidates, null, 1));
const byRule = candidates.reduce<Record<string, number>>((m, c) => ((m[c.rule ?? "?"] = (m[c.rule ?? "?"] ?? 0) + 1), m), {});
console.log(`✓ ${candidates.length} ứng viên → ${out}`, byRule);
}
void main();
