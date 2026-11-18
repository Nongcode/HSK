import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { parseVocab } from "../src/lib/content/schema";
import { inScope, mergeWord, type BaseHskEntry } from "./lib/merge";

const CACHE = ".cache";
const OUT = "src/content/vocab/hsk-words.json";
const SOURCES = {
  hsk: {
    file: "complete.min.json",
    url: "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.min.json",
  },
  opencidian: {
    file: "entries.jsonl.gz",
    url: "https://github.com/OpenCidian/opencidian-data/releases/download/data-2026-11-10-dc2df3f/entries.jsonl.gz",
  },
};

interface OcEntry {
  simp: string;
  pinyinNum: string;
  hanviet?: { readings: string[] }[];
  vi?: { senses: string[] };
}

async function download(src: { file: string; url: string }): Promise<Buffer> {
  const path = `${CACHE}/${src.file}`;
  if (!existsSync(path)) {
    mkdirSync(CACHE, { recursive: true });
    const res = await fetch(src.url);
    if (!res.ok) throw new Error(`Không tải được ${src.url}: HTTP ${res.status}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  return readFileSync(path);
}

function loadOpenCidian(gz: Buffer): { exact: Map<string, OcEntry>; bySimp: Map<string, OcEntry> } {
  const exact = new Map<string, OcEntry>();
  const bySimp = new Map<string, OcEntry>();
  for (const line of gunzipSync(gz).toString("utf8").split("\n")) {
    if (!line) continue;
    const e = JSON.parse(line) as OcEntry;
    exact.set(`${e.simp}|${e.pinyinNum.toLowerCase()}`, e);
    if (!bySimp.has(e.simp)) bySimp.set(e.simp, e);
  }
  return { exact, bySimp };
}

async function main() {
  const base = (JSON.parse((await download(SOURCES.hsk)).toString("utf8")) as BaseHskEntry[]).filter(inScope);
  const oc = loadOpenCidian(await download(SOURCES.opencidian));

  let withVi = 0;
  const words = base.map((b) => {
    const matched = b.f
      .map((f) => oc.exact.get(`${b.s}|${f.i.n.toLowerCase()}`))
      .filter((e): e is OcEntry => Boolean(e));
    if (!matched.length) {
      const fallback = oc.bySimp.get(b.s);
      if (fallback) matched.push(fallback);
    }
    const senses = [...new Set(matched.flatMap((e) => e.vi?.senses ?? []))].slice(0, 6);
    const vi = senses.join("; ");
    const hv = matched[0]?.hanviet?.map((h) => h.readings[0]).filter(Boolean).join(" ");
    if (vi) withVi++;
    return mergeWord(b, vi || undefined, hv || undefined);
  });

  const parsed = parseVocab(words);
  mkdirSync("src/content/vocab", { recursive: true });
  writeFileSync(OUT, JSON.stringify(parsed));

  const count = (k: "hsk2" | "hsk3", n: number) => parsed.filter((w) => w[k] === n).length;
  console.log(`Đã ghi ${parsed.length} từ → ${OUT} (có nghĩa Việt: ${withVi})`);
  for (const k of ["hsk2", "hsk3"] as const)
    console.log(k, [1, 2, 3, 4].map((n) => `HSK${n}: ${count(k, n)}`).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
