// E/S/G 카테고리 뱃지 (명세 5.2 / 6: 시각 구분 보조)
import type { Category } from "@/types";
import { categoryColors } from "@/theme/tokens";

interface Props {
  category: Category;
  /** true면 "환경"·"사회"·"지배구조" 풀네임, false면 "E"·"S"·"G" */
  showName?: boolean;
}

export function CategoryBadge({ category, showName = false }: Props) {
  const c = categoryColors[category];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        padding: "3px 7px",
        borderRadius: 6,
        whiteSpace: "nowrap",
      }}
    >
      {showName ? c.name : category}
    </span>
  );
}
