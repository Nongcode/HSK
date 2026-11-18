import { WordDetail } from "@/components/vocab/WordDetail";

export default async function WordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WordDetail id={decodeURIComponent(id)} />;
}
