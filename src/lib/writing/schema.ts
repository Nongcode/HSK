import { z } from "zod";
import { ERROR_TAGS, type ErrorTag } from "@/lib/storage/types";

const tag = z.enum(ERROR_TAGS);

const isPermutation = (order: number[], n: number) =>
  order.length === n && new Set(order).size === n && order.every((i) => Number.isInteger(i) && i >= 0 && i < n);

export const SentenceSchema = z
  .object({
    id: z.string().min(1),
    chunks: z.array(z.string().min(1)).min(3).max(8),
    accepted: z.array(z.array(z.number().int())).min(1),
    pinyin: z.string(),
    meaningVi: z.string().min(1),
    pattern: z.string(),
    ruleId: z.string().min(1),
    mistakes: z.array(z.object({ order: z.array(z.number().int()), tag })),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    reviewed: z.boolean(),
  })
  .superRefine((s, ctx) => {
    const n = s.chunks.length;
    const identity = s.chunks.map((_, i) => i);
    for (const o of s.accepted) {
      if (!isPermutation(o, n)) ctx.addIssue({ code: "custom", message: "accepted phải là hoán vị hợp lệ" });
    }
    for (const m of s.mistakes) {
      if (!isPermutation(m.order, n)) ctx.addIssue({ code: "custom", message: "mistakes.order phải là hoán vị hợp lệ" });
    }
    if (!s.accepted.some((o) => o.join() === identity.join())) {
      ctx.addIssue({ code: "custom", message: "accepted phải chứa thứ tự chuẩn" });
    }
  });

export type Sentence = z.infer<typeof SentenceSchema>;

export function parseSentences(raw: unknown): Sentence[] {
  const list = z.array(SentenceSchema).parse(raw);
  if (new Set(list.map((s) => s.id)).size !== list.length) throw new Error("Có id câu trùng lặp");
  return list;
}

export const RuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  explanation: z.string().min(1),
  examples: z.array(z.object({ zh: z.string(), pinyin: z.string(), vi: z.string() })),
  tag,
});

export type Rule = z.infer<typeof RuleSchema>;

export function parseRules(raw: unknown): Rule[] {
  return z.array(RuleSchema).parse(raw);
}

export type { ErrorTag };
