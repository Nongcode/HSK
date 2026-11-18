import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/lib/app-context";
import { MemoryStorage } from "@/lib/storage/memory-storage";
import { AppShell } from "./AppShell";
import { EphemeralBanner } from "./EphemeralBanner";
import { FocusLayout } from "./FocusLayout";

vi.mock("next/navigation", () => ({ usePathname: () => "/vocab" }));

describe("FocusLayout", () => {
  it("calls onExit when Escape is pressed", async () => {
    const onExit = vi.fn();
    render(
      <FocusLayout title="Ôn tập" progress={0.5} onExit={onExit}>
        <p>thẻ</p>
      </FocusLayout>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("shows session progress and no site navigation", () => {
    render(
      <FocusLayout title="Ôn tập" progress={0.25} onExit={() => {}}>
        <p>thẻ</p>
      </FocusLayout>,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

describe("AppShell", () => {
  it("lists the four sections and disables the writing section", async () => {
    render(
      <AppProvider words={[]} load={async () => ({ storage: new MemoryStorage(), isEphemeral: false })}>
        <AppShell>nội dung</AppShell>
      </AppProvider>,
    );
    await screen.findByRole("navigation");
    expect(screen.getByRole("link", { name: "Trang chủ" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Từ vựng" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Cài đặt" })).toHaveAttribute("href", "/settings");
    const writing = screen.getByText(/Luyện viết/);
    expect(writing.closest("a")).toBeNull();
    expect(writing.closest("[aria-disabled='true']")).not.toBeNull();
  });
});

describe("EphemeralBanner", () => {
  const renderWith = (isEphemeral: boolean) =>
    render(
      <AppProvider words={[]} load={async () => ({ storage: new MemoryStorage(), isEphemeral })}>
        <EphemeralBanner />
        <span>ok</span>
      </AppProvider>,
    );

  it("warns when progress cannot be saved", async () => {
    renderWith(true);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/không lưu được/i));
  });

  it("stays hidden when storage works", async () => {
    renderWith(false);
    await waitFor(() => expect(screen.getByText("ok")).toBeInTheDocument());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
