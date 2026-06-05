// 자동완성 드롭다운 (명세 4.3) — 기업/지표 두 그룹으로 분리 표시
import type { CompanyItem, IndicatorItem, SearchResult, SearchResultItem } from "@/types";
import { colors, radius, layout } from "@/theme/tokens";
import { CompanyResultRow, IndicatorResultRow } from "./ResultRows";

interface Props {
  result: SearchResult;
  query: string;
  onSelect: (item: SearchResultItem) => void;
  /** 빈 결과 시 카테고리 브라우징 유도 콜백 */
  onBrowseHint?: () => void;
}

function GroupHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: colors.textSub,
        padding: "8px 12px 4px",
        letterSpacing: 0.2,
      }}
    >
      {title}
    </div>
  );
}

export function AutocompleteDropdown({ result, query, onSelect }: Props) {
  const { companies, indicators } = result;
  const isEmpty = companies.length === 0 && indicators.length === 0;

  return (
    <div
      role="listbox"
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        background: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        maxHeight: layout.dropdownMaxHeight,
        overflowY: "auto",
        padding: 6,
        zIndex: 20,
      }}
    >
      {isEmpty ? (
        <div style={{ padding: "16px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: colors.textBase, marginBottom: 4 }}>
            검색 결과가 없습니다
          </div>
          <div style={{ fontSize: 12, color: colors.textHint }}>
            아래 E·S·G 카테고리에서 지표를 둘러볼 수 있어요
          </div>
        </div>
      ) : (
        <>
          {companies.length > 0 && (
            <section>
              <GroupHeader title="기업" />
              {companies.map((c: CompanyItem) => (
                <CompanyResultRow key={c.id} item={c} query={query} onSelect={onSelect} />
              ))}
            </section>
          )}
          {indicators.length > 0 && (
            <section>
              <GroupHeader title="지표" />
              {indicators.map((i: IndicatorItem) => (
                <IndicatorResultRow key={i.id} item={i} query={query} onSelect={onSelect} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
