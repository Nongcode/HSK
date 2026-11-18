"use client";

import { useRouter } from "next/navigation";
import { ReviewSession } from "@/components/review/ReviewSession";

export default function ReviewPage() {
  const router = useRouter();
  return <ReviewSession onExit={() => router.push("/")} />;
}
