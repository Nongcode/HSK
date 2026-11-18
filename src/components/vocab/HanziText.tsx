export function HanziText({
  hanzi,
  pinyin,
  showPinyin = true,
  size = "text-3xl",
}: {
  hanzi: string;
  pinyin: string;
  showPinyin?: boolean;
  size?: string;
}) {
  return (
    <span className="inline-flex flex-col">
      <span lang="zh-Hans" className={`font-hanzi ${size} leading-tight`}>
        {hanzi}
      </span>
      {showPinyin && <span className="text-sm text-muted">{pinyin}</span>}
    </span>
  );
}
