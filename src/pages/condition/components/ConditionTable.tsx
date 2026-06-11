// 통합 검색 대량 테이블 — 상태/필터바/페이지네이션 관리 + 공용 IndicatorGrid로 표 렌더.
// 종합점수·등급·순위 컬럼 없음(안전선). 잠금은 플랜(행 단위) 기준.
import { useMemo, useState } from "react";
import { Button, Tooltip, Tag, Badge, Pagination } from "antd";
import { DownloadOutlined, ApiOutlined, FilterOutlined } from "@ant-design/icons";
import type { Category, ViewerPlan } from "@/types";
import {
  getIndicatorColumns,
  getIndicatorRows,
  cellKey,
  DEFAULT_COLUMN_IDS,
  FREE_ROW_LIMIT,
  SEARCH_LATEST_YEAR,
} from "@/mock/indicatorSearch";
import type { IndicatorRow } from "@/mock/indicatorSearch";
import { getSanctionCounts } from "@/mock/sanctions";
import { isEnterprise } from "@/mock/access";
import { colors } from "@/theme/tokens";
import { IndicatorGrid } from "@/components/IndicatorGrid";
import type { SortState } from "@/components/IndicatorGrid";
import { ConditionFilterModal } from "./ConditionFilterModal";
import { DataNotFoundCta } from "@/components/DataNotFoundCta";
import { AddIndicatorColumn } from "@/components/AddIndicatorColumn";

const SECTORS = [
  "반도체",
  "화학",
  "자동차",
  "2차전지",
  "바이오·제약",
  "금융",
  "유통",
  "철강·금속",
  "건설",
  "IT·서비스",
  "통신",
  "식품",
];
const PAGE = 10;

export function ConditionTable({
  plan,
  initialColumnId,
  initialSectors,
  initialCategory,
  initialGroupCode,
  fullCategory,
  onCompanyOpen,
  onIndicatorOpen,
  onSanctionOpen,
  onUpgrade,
  companyIds,
  onSetCompanyIds,
}: {
  plan: ViewerPlan;
  initialColumnId?: string;
  initialSectors?: string[];
  initialCategory?: Category;
  initialGroupCode?: string;
  fullCategory?: boolean;
  onCompanyOpen: (id: string) => void;
  onIndicatorOpen: (id: string, category: Category, code: string) => void;
  onSanctionOpen: (id: string) => void;
  onUpgrade: () => void;
  companyIds?: string[];
  onSetCompanyIds: (ids?: string[]) => void;
}) {
  const allCols = getIndicatorColumns();
  const [filterOpen, setFilterOpen] = useState(false);
  const [sectors, setSectors] = useState<string[]>(initialSectors ?? []);
  const [years, setYears] = useState<number[]>([SEARCH_LATEST_YEAR]);
  const [visibleIds, setVisibleIds] = useState<string[]>(() => {
    if (initialColumnId === "__sanctions") return [];
    if (initialColumnId && allCols.some((c) => c.id === initialColumnId)) return [initialColumnId];
    if (initialGroupCode)
      return allCols.filter((c) => c.groupCode === initialGroupCode).map((c) => c.id);
    if (initialCategory)
      return allCols
        .filter((c) => c.category === initialCategory && (fullCategory || c.star))
        .map((c) => c.id);
    return [...DEFAULT_COLUMN_IDS];
  });
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(0);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const toggleSubs = (colId: string) =>
    setExpandedSubs((prev) => {
      const n = new Set(prev);
      n.has(colId) ? n.delete(colId) : n.add(colId);
      return n;
    });
  const [showSanctions, setShowSanctions] = useState(initialColumnId === "__sanctions");
  const [sanctionExpanded, setSanctionExpanded] = useState(initialColumnId === "__sanctions");

  const canExport = isEnterprise(plan);
  const multiYear = years.length > 1;
  const sortedYears = useMemo(() => [...years].sort((a, b) => a - b), [years]);

  const cols = useMemo(() => allCols.filter((c) => visibleIds.includes(c.id)), [allCols, visibleIds]);

  const rows = useMemo(
    () => getIndicatorRows({ sectors, companyIds, years }),
    [sectors, companyIds, years],
  );
  const sanctionCounts = useMemo(
    () => (showSanctions ? getSanctionCounts(rows.map((r) => r.id), years) : {}),
    [showSanctions, rows, years],
  );

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    if (sort.colId === "__sanction") {
      const theme = sort.subCode;
      const val = (r: IndicatorRow) => (theme ? (sanctionCounts[r.id]?.[theme] ?? 0) : 0);
      return [...rows].sort((a, b) => (sort.dir === "desc" ? val(b) - val(a) : val(a) - val(b)));
    }
    const col = allCols.find((c) => c.id === sort.colId);
    if (!col || col.type !== "numeric") return rows;
    const key = cellKey(sort.colId, sort.year, sort.subCode);
    const val = (r: IndicatorRow) => {
      const v = r.cells[key]?.value;
      return typeof v === "number" ? v : null;
    };
    return [...rows].sort((a, b) => {
      const va = val(a),
        vb = val(b);
      if (va === null) return 1;
      if (vb === null) return -1;
      return sort.dir === "desc" ? vb - va : va - vb;
    });
  }, [rows, sort, allCols, sanctionCounts]);

  const pages = Math.max(1, Math.ceil(sortedRows.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const pageRows = sortedRows.slice(safePage * PAGE, safePage * PAGE + PAGE);

  function toggleSort(colId: string, subCode: string | null, year: number) {
    setSort((s) =>
      s?.colId === colId && s.subCode === subCode && s.year === year
        ? { colId, subCode, year, dir: s.dir === "desc" ? "asc" : "desc" }
        : { colId, subCode, year, dir: "desc" },
    );
  }
  function sanctionSort(key: string) {
    setSort((s) =>
      s?.colId === "__sanction" && s.subCode === key
        ? { colId: "__sanction", subCode: key, year: 0, dir: s.dir === "desc" ? "asc" : "desc" }
        : { colId: "__sanction", subCode: key, year: 0, dir: "desc" },
    );
  }

  const yearDefault = years.length === 1 && years[0] === SEARCH_LATEST_YEAR;
  const activeCount = (sectors.length ? 1 : 0) + (companyIds ? 1 : 0) + (yearDefault ? 0 : 1);

  const removeColumn = (id: string) => setVisibleIds((prev) => prev.filter((x) => x !== id));
  const singleIndicator = cols.length === 1;
  type FilterSection = "columns" | "year" | "sector" | "codes";
  const [filterSection, setFilterSection] = useState<FilterSection>("columns");
  const openFilter = (s: FilterSection) => {
    setFilterSection(s);
    setFilterOpen(true);
  };

  return (
    <div>
      {/* 필터 바 — 필터 버튼 1개 + 활성 칩 + 추출 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 14,
        }}
      >
        <Badge count={activeCount} color={colors.accent} offset={[-2, 2]}>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={() => openFilter("year")}
            style={{ background: colors.primary, borderColor: colors.primary }}
          >
            필터
          </Button>
        </Badge>

        {companyIds && companyIds.length > 0 && (
          <Tag closable onClose={() => onSetCompanyIds(undefined)} color="processing">
            {companyIds.length === 1 ? (rows[0]?.name ?? companyIds[0]) : `기업 ${companyIds.length}개`}{" "}
            <span style={{ opacity: 0.6 }}>(기업)</span>
          </Tag>
        )}
        {sectors.map((s) => (
          <Tag key={s} closable onClose={() => setSectors((prev) => prev.filter((x) => x !== s))} color="default">
            {s} <span style={{ opacity: 0.6 }}>(업종)</span>
          </Tag>
        ))}
        <Tag closable onClose={() => setYears([SEARCH_LATEST_YEAR])} color="default">
          {sortedYears.map((y) => `FY${y}`).join("·")} <span style={{ opacity: 0.6 }}>(회계연도)</span>
        </Tag>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Tooltip title={canExport ? "" : "플랜 회원 전용"}>
            <Button icon={<DownloadOutlined />} disabled={!canExport} onClick={() => console.log("excel")}>
              다운로드
            </Button>
          </Tooltip>
          <Tooltip title={canExport ? "" : "플랜 회원 전용"}>
            <Button icon={<ApiOutlined />} disabled={!canExport} onClick={() => console.log("api")}>
              API
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 표 사용 안내 */}
      <div style={{ fontSize: 12, color: colors.textHint, margin: "0 2px 8px", lineHeight: 1.5 }}>
        지표명 옆 <span style={{ color: colors.accent, fontWeight: 700 }}>세부</span> 버튼으로 Scope 등 하위
        항목을 펼치고, 헤더 ✕로 컬럼을 제거할 수 있어요. 숫자 컬럼 헤더를 누르면 정렬됩니다.
      </div>

      {/* 테이블 카드 */}
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <IndicatorGrid
          cols={cols}
          sortedYears={sortedYears}
          multiYear={multiYear}
          rows={pageRows}
          expandedSubs={expandedSubs}
          onToggleSubs={toggleSubs}
          showSanctions={showSanctions}
          sanctionExpanded={sanctionExpanded}
          onToggleSanctionExpanded={() => setSanctionExpanded((v) => !v)}
          onRemoveSanctions={() => setShowSanctions(false)}
          sanctionCounts={sanctionCounts}
          sort={sort}
          onToggleSort={toggleSort}
          onSanctionSort={sanctionSort}
          onRemoveColumn={removeColumn}
          onCompanyOpen={onCompanyOpen}
          onIndicatorOpen={onIndicatorOpen}
          onSanctionOpen={onSanctionOpen}
          lockedFrom={isEnterprise(plan) ? Infinity : Math.max(0, FREE_ROW_LIMIT - safePage * PAGE)}
          addColumnSlot={
            <AddIndicatorColumn
              count={visibleIds.length}
              plan={plan}
              onOpen={() => openFilter("columns")}
              onUpgrade={onUpgrade}
              emphasize={singleIndicator}
            />
          }
        />

        {/* 비회원 미리보기 안내 (2페이지부터 가입/플랜 유도) */}
        {!isEnterprise(plan) && pages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              background: "#FFF8EC",
              borderTop: `1px solid #F3E2BE`,
              fontSize: 13,
              color: "#7A5B17",
            }}
          >
            <span style={{ flex: 1 }}>더 많은 기업의 ESG 데이터를 열람해보세요.</span>
            <Button size="small" type="primary" onClick={onUpgrade}>
              {plan === "guest" ? "로그인하고 더 보기" : "플랜 알아보기"}
            </Button>
          </div>
        )}

        {/* 페이지네이션 — 번호 + 점프 */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
          <Pagination
            size="small"
            current={safePage + 1}
            total={sortedRows.length}
            pageSize={PAGE}
            showSizeChanger={false}
            showQuickJumper
            onChange={(p) => {
              if (p > 1 && !isEnterprise(plan)) {
                onUpgrade();
                return;
              }
              setPage(p - 1);
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11.5, color: colors.textHint, lineHeight: 1.5 }}>
        본 화면은 공시·수집된 원본 데이터의 나열이며, 평가·등급·순위·투자 자문이 아닙니다.
      </div>

      <DataNotFoundCta />

      <ConditionFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={{ sectors, visibleIds, companyIds, years, sanctions: showSanctions }}
        allCols={allCols}
        initialSection={filterSection}
        sectors={SECTORS}
        onApply={(next) => {
          setSectors(next.sectors ?? []);
          setVisibleIds(next.visibleIds);
          setYears(next.years);
          setShowSanctions(next.sanctions);
          onSetCompanyIds(next.companyIds);
        }}
      />
    </div>
  );
}
