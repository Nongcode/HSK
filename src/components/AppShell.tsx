"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EphemeralBanner } from "./EphemeralBanner";
import { ThemeToggle } from "./ThemeToggle";

const ITEMS = [
  { href: "/", label: "Trang chủ" },
  { href: "/vocab", label: "Từ vựng" },
  { href: "/writing", label: "Luyện viết" },
  { href: "/settings", label: "Cài đặt" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const nav = (
    <ul className="flex w-full items-center justify-around gap-1 md:justify-start">
      {ITEMS.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-lg px-3 text-sm ${
              isActive(item.href) ? "bg-surface font-medium text-accent" : "text-muted hover:bg-surface"
            }`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <EphemeralBanner />
      <header className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg md:static md:order-first md:border-b md:border-t-0">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-2 py-1 md:px-4 md:py-2">
          <span className="hidden font-medium md:inline">HSK4</span>
          <nav aria-label="Điều hướng chính" className="flex-1">
            {nav}
          </nav>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-24 md:pb-6">{children}</main>
    </div>
  );
}
