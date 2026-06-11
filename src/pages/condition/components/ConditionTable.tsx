// 통합 검색 대량 테이블 — 기업(행)×지표(컬럼), 타입별 셀, 컬럼피커·필터·정렬·잠금·페이지네이션.
// 종합점수·등급·순위 컬럼 없음(안전선). 잠금은 플랜(행 단위) 기준.
import { useMemo, useState } from "react";
import { Button, Tooltip, Tag, Badge } from "antd";
import {
  DownloadOutlined,
  ApiOutlined,
  FilterOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import type { Category, ViewerPlan } from "@/types";
import {
  getIndicatorColumns,
  getIndicatorRows,
  cellKey,
  DEFAULT_COLUMN_IDS,
  FREE_ROW_LIMIT,
  SEARCH_LATEST_YEAR,
} from "@/mock/indicatorSearch";
import type { IndicatorRow, SubDef } from "@/mock/indicatorSearch";
import { CloseOutlined } from "@ant-design/icons";
import { colors, categoryColors } from "@/theme/tokens";
import { CellContent } from "./CellContent";
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
  initialSector,
  initialCategory,
  onCompanyOpen,
  onUpgrade,
  companyIds,
  onSetCompanyIds,
}: {
  plan: ViewerPlan;
  initialColumnId?: string;
  initialSector?: string;
  initialCategory?: Category;
  onCompanyOpen: (id: string) => void;
  onUpgrade: () => void;
  companyIds?: string[];
  onSetCompanyIds: (ids?: string[]) => void;
}) {
  const allCols = getIndicatorColumns();
  const [filterOpen, setFilterOpen] = useState(false);
  const [sector, setSector] = useState<string | undefined>(initialSector);
  const [years, setYears] = useState<number[]>([SEARCH_LATEST_YEAR]);
  const [visibleIds, setVisibleIds] = useState<string[]>(() => {
    // 지표 진입(지표 클릭/검색): 그 지표 1개 컬럼만 ("지표 페이지")
    if (initialColumnId && allCols.some((c) => c.id === initialColumnId)) return [initialColumnId];
    // 카테고리 진입(환경/사회/지배구조 메뉴): 해당 분류 앞쪽 8개 (지표가 많아 일부만)
    if (initialCategory)
      return allCols
        .filter((c) => c.category === initialCategory)
        .slice(0, 8)
        .map((c) => c.id);
    return [...DEFAULT_COLUMN_IDS];
  });
  const [sort, setSort] = useState<{
    colId: string;
    subCode: string | null;
    year: number;
    dir: "asc" | "desc";
  } | null>(null);
  const [page, setPage] = useState(0);

  const canExport = plan === "enterprise";
  const multiYear = years.length > 1;
  const sortedYears = useMemo(() => [...years].sort((a, b) => a - b), [years]);

  // 표시 지표(선택된 것만)
  const cols = useMemo(
    () => allCols.filter((c) => visibleIds.includes(c.id)),
    [allCols, visibleIds],
  );
  // 실제 표 열 = 지표 × sub × 연도 (sub 없으면 1, 다년도면 연도별)
  const viewCols = useMemo(
    () =>
      cols.flatMap((col) => {
        const subs: (SubDef | null)[] = col.subs && col.subs.length ? col.subs : [null];
        return subs.flatMap((sub) => sortedYears.map((y) => ({ col, sub, year: y })));
      }),
    [cols, sortedYears],
  );
  // 상단 그룹 헤더 = 지표(여러 sub·연도 span)
  const groups = useMemo(
    () =>
      cols.map((col) => {
        const subCount = col.subs && col.subs.length ? col.subs.length : 1;
        return { col, span: subCount * sortedYears.length };
      }),
    [cols, sortedYears],
  );

  const rows = useMemo(
    () => getIndicatorRows({ sector, companyIds, years }),
    [sector, companyIds, years],
  );

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
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
  }, [rows, sort, allCols]);

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

  // 활성 필터 수 (섹터 / 기업코드 / 비기본 연도)
  const yearDefault = years.length === 1 && years[0] === SEARCH_LATEST_YEAR;
  const activeCount = (sector ? 1 : 0) + (companyIds ? 1 : 0) + (yearDefault ? 0 : 1);

  // 컬럼 제거(헤더 ×). 추가는 필터 모달의 "표시 지표" 섹션으로 연동
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

        {/* 활성 필터 칩 */}
        <Tag color="default">회계연도 {sortedYears.map((y) => `FY${y}`).join("·")}</Tag>
        {sector && (
          <Tag closable onClose={() => setSector(undefined)} color="default">
            섹터: {sector}
          </Tag>
        )}
        {companyIds && (
          <Tag closable onClose={() => onSetCompanyIds(undefined)} color="processing">
            기업코드 {companyIds.length}개
          </Tag>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Tooltip title={canExport ? "" : "기업 회원 전용"}>
            <Button
              icon={<DownloadOutlined />}
              disabled={!canExport}
              onClick={() => console.log("excel")}
            >
              다운로드
            </Button>
          </Tooltip>
          <Tooltip title={canExport ? "" : "기업 회원 전용"}>
            <Button icon={<ApiOutlined />} disabled={!canExport} onClick={() => console.log("api")}>
              API
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 테이블 */}
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: 200 + viewCols.length * 130 + 160,
            }}
          >
            <thead>
              {/* 1행: 기업 / 지표 그룹 헤더 / + 지표 추가 */}
              <tr>
                <th
                  rowSpan={2}
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    background: colors.bgPage,
                    textAlign: "left",
                    padding: "10px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSub,
                    borderBottom: `1px solid ${colors.border}`,
                    minWidth: 180,
                  }}
                >
                  기업
                </th>
                {groups.map(({ col, span }) => (
                  <th
                    key={col.id}
                    colSpan={span}
                    style={{
                      textAlign: "center",
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: colors.textBase,
                      background: colors.bgPage,
                      borderBottom: `1px solid ${colors.border}`,
                      borderLeft: `1px solid ${colors.border}`,
                      whiteSpace: "normal",
                      wordBreak: "keep-all",
                      verticalAlign: "top",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          marginTop: 5,
                          background: categoryColors[col.category].fg,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      {col.label}
                      {col.unit ? (
                        <span style={{ color: colors.textHint, fontWeight: 400 }}> ({col.unit})</span>
                      ) : null}
                      <CloseOutlined
                        onClick={() => removeColumn(col.id)}
                        style={{ fontSize: 10, color: colors.textHint, cursor: "pointer", marginTop: 4 }}
                      />
                    </span>
                  </th>
                ))}
                <th
                  rowSpan={2}
                  style={{
                    position: "sticky",
                    right: 0,
                    zIndex: 2,
                    background: colors.bgPage,
                    borderBottom: `1px solid ${colors.border}`,
                    padding: "8px 12px",
                    minWidth: 150,
                    verticalAlign: "top",
                    boxShadow: "-6px 0 8px -8px rgba(0,0,0,0.2)",
                  }}
                >
                  <AddIndicatorColumn
                    count={visibleIds.length}
                    plan={plan}
                    onOpen={() => openFilter("columns")}
                    onUpgrade={onUpgrade}
                    emphasize={singleIndicator}
                  />
                </th>
              </tr>
              {/* 2행: sub / 연도 디테일 헤더 */}
              <tr>
                {viewCols.map(({ col, sub, year }) => {
                  const subCode = sub?.code ?? null;
                  const active =
                    sort?.colId === col.id && sort?.subCode === subCode && sort?.year === year;
                  const parts: string[] = [];
                  if (sub) parts.push(sub.name);
                  if (multiYear) parts.push(`FY${year}`);
                  if (parts.length === 0) parts.push(col.unit ? `(${col.unit})` : "값");
                  return (
                    <th
                      key={cellKey(col.id, year, subCode)}
                      onClick={col.type === "numeric" ? () => toggleSort(col.id, subCode, year) : undefined}
                      style={{
                        textAlign: "right",
                        padding: "8px 12px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: colors.textSub,
                        borderBottom: `1px solid ${colors.border}`,
                        borderLeft: `1px solid ${colors.border}`,
                        background: colors.bgPage,
                        cursor: col.type === "numeric" ? "pointer" : "default",
                        minWidth: 120,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                        {parts.join(" · ")}
                        {col.type === "numeric" &&
                          (active ? (
                            sort!.dir === "desc" ? (
                              <CaretDownOutlined />
                            ) : (
                              <CaretUpOutlined />
                            )
                          ) : null)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => {
                const globalIdx = safePage * PAGE + idx;
                const locked = plan !== "enterprise" && globalIdx >= FREE_ROW_LIMIT;
                return (
                  <tr key={r.id}>
                    {/* 기업 필드만 클릭 → 개별 페이지 (데이터 셀은 비클릭) */}
                    <td
                      onClick={() => onCompanyOpen(r.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.rowHover;
                        const nameEl = e.currentTarget.querySelector(
                          "[data-company-name]",
                        ) as HTMLElement | null;
                        if (nameEl) nameEl.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = colors.bgSurface;
                        const nameEl = e.currentTarget.querySelector(
                          "[data-company-name]",
                        ) as HTMLElement | null;
                        if (nameEl) nameEl.style.textDecoration = "none";
                      }}
                      style={{
                        position: "sticky",
                        left: 0,
                        background: colors.bgSurface,
                        padding: "12px 14px",
                        borderBottom: `1px solid ${colors.border}`,
                        minWidth: 180,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        data-company-name
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: colors.primary,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: colors.textSub }}>
                        {r.id} · {r.sector}
                      </div>
                    </td>
                    {viewCols.map(({ col, sub, year }) => {
                      const key = cellKey(col.id, year, sub?.code);
                      return (
                        <td
                          key={key}
                          style={{
                            padding: "10px 12px",
                            borderBottom: `1px solid ${colors.border}`,
                            borderLeft: `1px solid ${colors.border}`,
                            textAlign: "right",
                          }}
                        >
                          <CellContent col={col} cell={r.cells[key]} locked={locked} />
                        </td>
                      );
                    })}
                    {/* + 지표 추가 컬럼(오른쪽 고정) — 셀은 비움 */}
                    <td
                      style={{
                        position: "sticky",
                        right: 0,
                        background: colors.bgSurface,
                        borderBottom: `1px solid ${colors.border}`,
                        boxShadow: "-6px 0 8px -8px rgba(0,0,0,0.2)",
                      }}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 잠금 안내 */}
        {plan !== "enterprise" && sortedRows.length > FREE_ROW_LIMIT && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              background: "#FFF8EC",
              borderTop: `1px solid #F3E2BE`,
              fontSize: 13,
              color: "#7A5B17",
            }}
          >
            <span style={{ flex: 1 }}>
              상위 {FREE_ROW_LIMIT}개 기업만 공개 중입니다. 전체 기업·Excel·API는 기업 회원 전용.
            </span>
            <Button size="small" type="primary" onClick={onUpgrade}>
              가입하고 전체 보기
            </Button>
          </div>
        )}

        {/* 페이지네이션 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            padding: "12px 0",
          }}
        >
          <Button size="small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            이전
          </Button>
          <span style={{ fontSize: 13, color: colors.textHint }}>
            {safePage + 1} / {pages}
          </span>
          <Button
            size="small"
            disabled={safePage >= pages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            다음
          </Button>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11.5, color: colors.textHint, lineHeight: 1.5 }}>
        본 화면은 공시·수집된 원본 데이터의 나열이며, 평가·등급·순위·투자 자문이 아닙니다.
      </div>

      <DataNotFoundCta />

      <ConditionFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={{ sector, visibleIds, companyIds, years }}
        allCols={allCols}
        initialSection={filterSection}
        sectors={SECTORS}
        onApply={(next) => {
          setSector(next.sector);
          setVisibleIds(next.visibleIds);
          setYears(next.years);
          onSetCompanyIds(next.companyIds);
        }}
      />
    </div>
  );
}
