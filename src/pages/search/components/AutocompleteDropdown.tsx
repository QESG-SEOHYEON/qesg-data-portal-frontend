// 자동완성 드롭다운 (명세 4.3) — 최상단 '통합검색' + 기업/지표 두 그룹
import { SearchOutlined } from "@ant-design/icons";
import type { CompanyItem, IndicatorItem, SearchResult, SearchResultItem } from "@/types";
import { colors, radius, layout } from "@/theme/tokens";
import { CompanyResultRow, IndicatorResultRow } from "./ResultRows";

interface Props {
  result: SearchResult;
  query: string;
  onSelect: (item: SearchResultItem) => void;
  /** '{키워드}으로 통합검색' 실행 */
  onSubmitQuery: () => void;
  /** 통합검색 행 강조 여부(키보드 기본 선택 = activeIndex -1) */
  submitActive?: boolean;
  /** 키보드 방향키로 강조된 항목의 평탄 인덱스(기업→지표 순). -1이면 없음 */
  activeIndex?: number;
  /** 빈 결과 시 카테고리 브라우징 유도 콜백 */
  onBrowseHint?: () => void;
}

// 한글 받침 유무로 조사 결정: 받침 있으면 '으로', 없으면 '로' (비한글은 안전하게 '(으)로')
function particleRo(word: string): string {
  const last = word.trim().slice(-1);
  if (!last) return "(으)로";
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 0 ? "로" : "으로";
  return "(으)로";
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

export function AutocompleteDropdown({
  result,
  query,
  onSelect,
  onSubmitQuery,
  submitActive = false,
  activeIndex = -1,
}: Props) {
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
        textAlign: "left",
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
      {/* 최상단: 통합검색 (우선 노출) */}
      <div
        role="option"
        aria-selected={submitActive}
        onClick={onSubmitQuery}
        onMouseEnter={(e) => (e.currentTarget.style.background = colors.rowHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = submitActive ? colors.rowHover : "transparent")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          minHeight: layout.rowHeight,
          borderRadius: 8,
          cursor: "pointer",
          background: submitActive ? colors.rowHover : "transparent",
        }}
      >
        <SearchOutlined style={{ color: colors.textSub, fontSize: 14 }} />
        <span style={{ fontSize: 14, color: colors.textBase }}>
          <b>{query}</b>
          {particleRo(query)} 통합검색
        </span>
      </div>

      {isEmpty ? (
        <div style={{ padding: "12px", textAlign: "center", fontSize: 12, color: colors.textHint }}>
          일치하는 기업·지표가 없습니다
        </div>
      ) : (
        <>
          {companies.length > 0 && (
            <section>
              <GroupHeader title="기업" />
              {companies.map((c: CompanyItem, ci: number) => (
                <CompanyResultRow key={c.id} item={c} query={query} onSelect={onSelect} active={activeIndex === ci} />
              ))}
            </section>
          )}
          {indicators.length > 0 && (
            <section>
              <GroupHeader title="지표" />
              {indicators.map((i: IndicatorItem, ii: number) => (
                <IndicatorResultRow key={i.id} item={i} query={query} onSelect={onSelect} active={activeIndex === companies.length + ii} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
