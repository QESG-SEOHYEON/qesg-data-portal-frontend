// 자동완성 결과 행 — 기업/지표는 형태가 다르므로 별도 컴포넌트 (명세 2)
import type { CompanyItem, IndicatorItem } from "@/types";
import { colors, categoryColors, layout } from "@/theme/tokens";
import { HighlightText } from "./HighlightText";
import { CategoryBadge } from "./CategoryBadge";

const rowBaseStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minHeight: layout.rowHeight,
  padding: "0 12px",
  cursor: "pointer",
  borderRadius: 8,
};

function useHoverStyle() {
  // hover 배경 강조(명세 5.4) — 인라인 이벤트로 처리
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.background = colors.rowHover;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.background = "transparent";
    },
  };
}

export function CompanyResultRow({
  item,
  query,
  onSelect,
}: {
  item: CompanyItem;
  query: string;
  onSelect: (item: CompanyItem) => void;
}) {
  const hover = useHoverStyle();
  return (
    <div
      role="option"
      style={rowBaseStyle}
      onClick={() => onSelect(item)}
      {...hover}
    >
      <span style={{ fontSize: 14, color: colors.textBase, flex: 1 }}>
        <HighlightText text={item.label} query={query} />
      </span>
      {/* 종목코드는 공개 식별자이므로 보조라벨로 노출 가능 */}
      <span style={{ fontSize: 12, color: colors.textSub, fontVariantNumeric: "tabular-nums" }}>
        {item.id}
      </span>
    </div>
  );
}

export function IndicatorResultRow({
  item,
  query,
  onSelect,
}: {
  item: IndicatorItem;
  query: string;
  onSelect: (item: IndicatorItem) => void;
}) {
  const hover = useHoverStyle();
  const cat = categoryColors[item.category];
  return (
    <div
      role="option"
      style={rowBaseStyle}
      onClick={() => onSelect(item)}
      {...hover}
    >
      <CategoryBadge category={item.category} />
      <span style={{ fontSize: 14, color: colors.textBase, flex: 1 }}>
        <HighlightText text={item.label} query={query} />
      </span>
      {/* "환경 지표" 보조라벨 — 기업/지표 시각 구분(명세 6) */}
      <span style={{ fontSize: 12, color: colors.textSub }}>{cat.name} 지표</span>
    </div>
  );
}
