import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { AppProvider } from "@/lib/app-context";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSerif = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "HSK4 · Ôn tập tiếng Trung",
  description: "Ôn từ vựng, luyện viết và thi thử HSK4 một cách tập trung.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><RegisterSW />
        <AppProvider>{children}</AppProvider></body>
    </html>
  );
}
