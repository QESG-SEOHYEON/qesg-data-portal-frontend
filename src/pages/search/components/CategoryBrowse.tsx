// E/S/G 카테고리 브라우징 (명세 4.4) — 검색어 없을 때 둘러보기용
import { useState } from "react";
import type { Category, IndicatorItem } from "@/types";
import { colors, categoryColors, radius } from "@/theme/tokens";
import { listIndicatorsByCategory } from "@/mock/search";
import { CategoryBadge } from "./CategoryBadge";

interface Props {
  onSelect: (item: IndicatorItem) => void;
}

const CATEGORIES: Category[] = ["E", "S", "G"];

export function CategoryBrowse({ onSelect }: Props) {
  // 같은 칩 재클릭 시 접힘(토글)
  const [active, setActive] = useState<Category | null>(null);

  const toggle = (c: Category) => setActive((prev) => (prev === c ? null : c));

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 13, color: colors.textHint, marginBottom: 12, textAlign: "center" }}>
        카테고리로 둘러보기
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {CATEGORIES.map((c) => {
          const meta = categoryColors[c];
          const isActive = active === c;
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 20,
                border: `1px solid ${isActive ? meta.fg : colors.border}`,
                background: isActive ? meta.bg : colors.bgSurface,
                color: isActive ? meta.fg : colors.textBase,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <CategoryBadge category={c} />
              {meta.name}
            </button>
          );
        })}
      </div>

      {active && (
        <div
          style={{
            marginTop: 14,
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            padding: 6,
          }}
        >
          {listIndicatorsByCategory(active).map((i) => (
            <div
              key={i.id}
              role="button"
              onClick={() => onSelect(i)}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.rowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minHeight: 40,
                padding: "0 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                color: colors.textBase,
              }}
            >
              <CategoryBadge category={i.category} />
              {i.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
