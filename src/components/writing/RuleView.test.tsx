import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Rule } from "@/lib/writing/schema";
import { RuleView } from "./RuleView";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const rule: Rule = {
  id: "ba",
  title: "Câu chữ 把",
  summary: "tóm tắt",
  explanation: "giải thích chi tiết",
  examples: [{ zh: "请把门关上。", pinyin: "Qǐng bǎ mén guānshang.", vi: "Xin đóng cửa lại." }],
  tag: "ba-position",
};

describe("RuleView", () => {
  it("shows title, explanation, examples and a link to practise that rule", () => {
    render(<RuleView id="ba" rules={[rule]} />);
    expect(screen.getByRole("heading", { name: "Câu chữ 把" })).toBeInTheDocument();
    expect(screen.getByText("giải thích chi tiết")).toBeInTheDocument();
    expect(screen.getByText("请把门关上。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Luyện các câu này/ })).toHaveAttribute("href", "/writing/practice?rule=ba");
  });

  it("shows a not-found state with a link back for an unknown id", () => {
    render(<RuleView id="nope" rules={[rule]} />);
    expect(screen.getByText(/Không tìm thấy bài quy tắc/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Danh sách quy tắc/ })).toHaveAttribute("href", "/writing/rules");
  });
});
