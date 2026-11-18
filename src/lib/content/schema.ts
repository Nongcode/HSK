import { z } from "zod";

export const WordShape = z.object({
  id: z.string().min(1),
  hanzi: z.string().min(1),
  pinyin: z.string().min(1),
  pos: z.array(z.string()),
  meaningVi: z.string(),
  meaningEn: z.array(z.string()),
  hanViet: z.string().optional(),
  example: z.object({ zh: z.string(), pinyin: z.string(), vi: z.string() }).optional(),
  hsk2: z.number().int().min(1).max(6).nullable(),
  hsk3: z.number().int().min(1).max(9).nullable(),
  reviewed: z.boolean(),
});

export const WordSchema = WordShape
  .refine((w) => w.hsk2 !== null || w.hsk3 !== null, {
    message: "word must belong to HSK 2.0 or 3.0",
  })
  .refine((w) => w.meaningVi !== "" || w.meaningEn.length > 0, {
    message: "word needs a Vietnamese or English meaning",
  });

export type Word = z.infer<typeof WordSchema>;

export function parseVocab(raw: unknown): Word[] {
  return z.array(WordSchema).parse(raw);
}
