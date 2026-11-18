import { WritingHome } from "@/components/writing/WritingHome";
import sentencesData from "@/content/writing/sentences.json";
import { parseSentences } from "@/lib/writing/schema";

const sentences = parseSentences(sentencesData);

export default function WritingPage() {
  return <WritingHome sentences={sentences} />;
}
