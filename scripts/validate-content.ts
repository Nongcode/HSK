import { existsSync, readFileSync, readdirSync } from "node:fs";
import { parseVocab } from "../src/lib/content/schema";
import { parseRules, parseSentences } from "../src/lib/writing/schema";
import { validateWriting } from "./lib/validate-writing";

const VOCAB_DIR = "src/content/vocab";

if (!existsSync(VOCAB_DIR)) {
  console.error(`Thiếu ${VOCAB_DIR}. Chạy: npm run build:vocab`);
  process.exit(1);
}

let total = 0;
for (const file of readdirSync(VOCAB_DIR).filter((f) => f.endsWith(".json"))) {
  const words = parseVocab(JSON.parse(readFileSync(`${VOCAB_DIR}/${file}`, "utf8")));
  const ids = new Set(words.map((w) => w.id));
  if (ids.size !== words.length) throw new Error(`${file}: có id trùng lặp`);
  total += words.length;
  console.log(`✓ ${file}: ${words.length} từ`);
}
console.log(`Hợp lệ: ${total} từ`);

const WRITING_DIR = "src/content/writing";
const vocab = parseVocab(JSON.parse(readFileSync(`${VOCAB_DIR}/hsk-words.json`, "utf8")));
const sentences = parseSentences(JSON.parse(readFileSync(`${WRITING_DIR}/sentences.json`, "utf8")));
const rules = parseRules(JSON.parse(readFileSync(`${WRITING_DIR}/rules.json`, "utf8")));
const problems = validateWriting(sentences, rules, vocab);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log(`✓ writing: ${sentences.length} câu, ${rules.length} bài quy tắc`);
