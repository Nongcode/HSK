const POS_VI: Record<string, string> = {
  n: "danh từ", v: "động từ", a: "tính từ", d: "phó từ", m: "số từ", q: "lượng từ",
  r: "đại từ", p: "giới từ", c: "liên từ", u: "trợ từ", e: "thán từ", y: "ngữ khí",
  ns: "địa danh", nr: "tên người", nz: "danh từ riêng", t: "từ chỉ thời gian",
  f: "phương vị", i: "thành ngữ", l: "quán ngữ", b: "từ phân biệt", j: "viết tắt",
  k: "hậu tố", h: "tiền tố", o: "từ tượng thanh", g: "hình vị", x: "khác",
};

export function posLabel(code: string): string {
  return POS_VI[code] ?? code;
}
