import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SentenceBoard } from "./SentenceBoard";

const chunks = ["我们", "都", "喜欢", "电影"];
// Tray starts shuffled: 喜欢, 我们, 电影, 都.
const initialOrder = [2, 0, 3, 1];

function setup(over: Partial<React.ComponentProps<typeof SentenceBoard>> = {}) {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  render(
    <SentenceBoard chunks={chunks} initialOrder={initialOrder} disabled={false} onChange={onChange} onSubmit={onSubmit} {...over} />,
  );
  const tray = () => screen.getByRole("group", { name: "Các cụm từ" });
  const answer = () => screen.getByRole("list", { name: "Câu của bạn" });
  return { onChange, onSubmit, tray, answer, user: userEvent.setup() };
}

describe("SentenceBoard", () => {
  it("moves a tapped chunk to the end of the answer line and reports the order", async () => {
    const { user, tray, answer, onChange } = setup();
    await user.click(within(tray()).getByRole("button", { name: /我们/ }));
    await user.click(within(tray()).getByRole("button", { name: /喜欢/ }));
    expect(within(answer()).getAllByRole("button").map((b) => b.textContent)).toEqual(["我们", "喜欢"]);
    expect(onChange).toHaveBeenLastCalledWith([0, 2]);
    expect(within(tray()).queryByRole("button", { name: /我们/ })).toBeNull();
  });

  it("returns a tapped answer chunk to the tray", async () => {
    const { user, tray, answer, onChange } = setup();
    await user.click(within(tray()).getByRole("button", { name: /都/ }));
    await user.click(within(answer()).getByRole("button", { name: "都" }));
    expect(within(answer()).queryAllByRole("button")).toHaveLength(0);
    expect(within(tray()).getByRole("button", { name: /都/ })).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("number keys pick the k-th chunk currently in the tray", async () => {
    const { user, onChange } = setup();
    await user.keyboard("2");
    expect(onChange).toHaveBeenLastCalledWith([0]);
    await user.keyboard("2"); // tray is now 喜欢, 电影, 都 → second is 电影
    expect(onChange).toHaveBeenLastCalledWith([0, 3]);
  });

  it("Backspace removes the last placed chunk", async () => {
    const { user, onChange } = setup();
    await user.keyboard("12");
    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith([2]);
  });

  it("Enter submits only when every chunk is placed, exactly once", async () => {
    const { user, onSubmit } = setup();
    await user.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard("1111");
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("ignores shortcuts with modifier keys", async () => {
    const { user, onChange } = setup();
    await user.keyboard("{Control>}1{/Control}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", async () => {
    const { user, tray, onChange, onSubmit } = setup({ disabled: true });
    await user.click(within(tray()).getByRole("button", { name: /我们/ }));
    await user.keyboard("1{Backspace}{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("treats identical chunks independently", async () => {
    const { user, tray, answer, onChange } = setup({ chunks: ["好", "好", "吗"], initialOrder: [0, 1, 2] });
    await user.click(within(tray()).getAllByRole("button", { name: /好/ })[1]);
    expect(onChange).toHaveBeenLastCalledWith([1]);
    expect(within(tray()).getAllByRole("button", { name: /好/ })).toHaveLength(1);
    await user.click(within(answer()).getByRole("button", { name: "好" }));
    expect(within(tray()).getAllByRole("button", { name: /好/ })).toHaveLength(2);
  });
});
