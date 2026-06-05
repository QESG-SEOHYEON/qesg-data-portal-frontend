// 입력어와 일치하는 부분을 <mark>로 하이라이트 (명세 4.3)
// 공백 무시 매칭(norm)과 시각 하이라이트는 별개라, 여기서는 단순 부분일치만 강조한다.
import { colors } from "@/theme/tokens";

interface Props {
  text: string;
  query: string;
}

export function HighlightText({ text, query }: Props) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return (
    <>
      {before}
      <mark style={{ background: "transparent", color: colors.primary, fontWeight: 700, padding: 0 }}>
        {match}
      </mark>
      {after}
    </>
  );
}
