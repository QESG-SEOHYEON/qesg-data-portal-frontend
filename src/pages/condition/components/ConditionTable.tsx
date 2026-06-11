// 통합 검색 대량 테이블 — 기업(행)×지표(컬럼), 타입별 셀, 컬럼피커·필터·정렬·잠금·페이지네이션.
// 종합점수·등급·순위 컬럼 없음(안전선). 잠금은 플랜(행 단위) 기준.
import { useMemo, useState } from "react";
import { Button, Tooltip, Tag, Badge, Pagination } from "antd";
import {
  DownloadOutlined,
  ApiOutlined,
  FilterOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
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
import { SUBGROUPS } from "@/mock/indicatorGrouping";
import { getSanctionCounts, SANCTION_THEMES } from "@/mock/sanctions";
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
// 데이터타입별 컬럼 폭 표준화 (수치·도입 좁게 / 서술 넓게)
const colW = (t: "numeric" | "boolean" | "text") =>
  t === "text" ? 150 : t === "boolean" ? 104 : 116;
// 헤더 3단 높이 고정 (격자 정렬)
const H1 = 30; // 소그룹
const H2 = 50; // 지표
const H3 = 30; // sub/연도

// 비공개(데이터 없음) 셀 판별 — 클릭/호버 비활성화 대상
function isUndisclosed(
  cell: { value: unknown } | undefined,
  type: "numeric" | "boolean" | "text",
): boolean {
  if (!cell) return true;
  const v = cell.value as unknown;
  if (type === "numeric") return v === null || v === undefined;
  if (type === "boolean") return v === "undisclosed";
  return !(v && (v as { disclosed?: boolean }).disclosed); // text
}

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
  initialGroupCode?: string; // 소그룹 전체 조회(둘러보기)
  fullCategory?: boolean; // 카테고리 전체 지표 표시(개별기업 "전체 보기")
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
    // 법규위반·제재 검색 진입: 제재 컬럼만 (지표 컬럼 없음)
    if (initialColumnId === "__sanctions") return [];
    // 지표 진입(지표 클릭/검색): 그 지표 1개 컬럼만 ("지표 페이지")
    if (initialColumnId && allCols.some((c) => c.id === initialColumnId)) return [initialColumnId];
    // 소그룹 둘러보기 진입: 그 소그룹의 노출 지표 전부
    if (initialGroupCode)
      return allCols.filter((c) => c.groupCode === initialGroupCode).map((c) => c.id);
    // 카테고리 진입(환경/사회/지배구조): 전체 보기면 분류 전체, 아니면 탭 기본세트(★)
    if (initialCategory)
      return allCols
        .filter((c) => c.category === initialCategory && (fullCategory || c.star))
        .map((c) => c.id);
    // 그 외: 전체 탭 기본세트(★)
    return [...DEFAULT_COLUMN_IDS];
  });
  const [sort, setSort] = useState<{
    colId: string;
    subCode: string | null;
    year: number;
    dir: "asc" | "desc";
  } | null>(null);
  const [page, setPage] = useState(0);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const toggleSubs = (colId: string) =>
    setExpandedSubs((prev) => {
      const n = new Set(prev);
      n.has(colId) ? n.delete(colId) : n.add(colId);
      return n;
    });
  // 법규위반·제재 컬럼 (타입 D) — 검색 진입(__sanctions) 시 켜진 채 시작
  const [showSanctions, setShowSanctions] = useState(initialColumnId === "__sanctions");
  const [sanctionExpanded, setSanctionExpanded] = useState(initialColumnId === "__sanctions");
  const sanctionSpan = sanctionExpanded ? SANCTION_THEMES.length : 1;

  const canExport = plan === "enterprise";
  const multiYear = years.length > 1;
  const sortedYears = useMemo(() => [...years].sort((a, b) => a - b), [years]);

  // 표시 지표(선택된 것만)
  const cols = useMemo(
    () => allCols.filter((c) => visibleIds.includes(c.id)),
    [allCols, visibleIds],
  );

  // sub 접기: total 보유 지표는 기본 합계(total)만, 펼치면 전체 sub
  const hasTotal = (col: (typeof cols)[number]) => !!col.subs?.some((s) => s.code === "total");
  const subsOf = (col: (typeof cols)[number]): (SubDef | null)[] => {
    if (!col.subs || !col.subs.length) return [null];
    if (hasTotal(col) && !expandedSubs.has(col.id)) {
      return [col.subs.find((s) => s.code === "total") ?? col.subs[0]];
    }
    return col.subs;
  };

  // 3단 헤더 구조: 소그룹 > 지표 > sub/연도
  const headerGroups = useMemo(() => {
    const order = SUBGROUPS.filter((sg) => cols.some((c) => c.groupCode === sg.code));
    return order.map((sg) => {
      const inds = cols
        .filter((c) => c.groupCode === sg.code)
        .map((col) => {
          const items = subsOf(col).flatMap((sub) =>
            sortedYears.map((year) => ({ col, sub, year })),
          );
          return { col, span: items.length, items };
        });
      return { sg, inds, span: inds.reduce((a, b) => a + b.span, 0) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, sortedYears, expandedSubs]);

  // 실제 표 열(본문) = 소그룹>지표>sub/연도 평탄화
  const viewCols = useMemo(
    () => headerGroups.flatMap((g) => g.inds.flatMap((i) => i.items)),
    [headerGroups],
  );

  const rows = useMemo(
    () => getIndicatorRows({ sectors, companyIds, years }),
    [sectors, companyIds, years],
  );
  // 제재 테마별 건수 (그리드용)
  const sanctionCounts = useMemo(
    () =>
      showSanctions
        ? getSanctionCounts(
            rows.map((r) => r.id),
            years,
          )
        : {},
    [showSanctions, rows, years],
  );

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    // 제재 테마 정렬
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

  // 활성 필터 수 (업종 / 기업코드 / 비기본 연도)
  const yearDefault = years.length === 1 && years[0] === SEARCH_LATEST_YEAR;
  const activeCount = (sectors.length ? 1 : 0) + (companyIds ? 1 : 0) + (yearDefault ? 0 : 1);

  // 컬럼 제거(헤더 ×). 추가는 필터 모달의 "표시 지표" 섹션으로 연동
  const removeColumn = (id: string) => setVisibleIds((prev) => prev.filter((x) => x !== id));
  const singleIndicator = cols.length === 1;
  type FilterSection = "columns" | "year" | "sector" | "codes";
  const [filterSection, setFilterSection] = useState<FilterSection>("columns");
  const openFilter = (s: FilterSection) => {
    setFilterSection(s);
    setFilterOpen(true);
  };
  // 표 최소 폭 (기업 140 + 데이터열 + 제재열 + 지표추가 130)
  const tableMinWidth =
    140 + viewCols.length * 130 + (showSanctions ? sanctionSpan * 150 : 0) + 130;

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

        {/* 활성 필터 칩 — [기업] [업종] [회계연도], 종류 라벨 표시(떼면 넓어짐) */}
        {companyIds && companyIds.length > 0 && (
          <Tag closable onClose={() => onSetCompanyIds(undefined)} color="processing">
            {companyIds.length === 1
              ? (rows[0]?.name ?? companyIds[0])
              : `기업 ${companyIds.length}개`}{" "}
            <span style={{ opacity: 0.6 }}>(기업)</span>
          </Tag>
        )}
        {sectors.map((s) => (
          <Tag
            key={s}
            closable
            onClose={() => setSectors((prev) => prev.filter((x) => x !== s))}
            color="default"
          >
            {s} <span style={{ opacity: 0.6 }}>(업종)</span>
          </Tag>
        ))}
        <Tag closable onClose={() => setYears([SEARCH_LATEST_YEAR])} color="default">
          {sortedYears.map((y) => `FY${y}`).join("·")}{" "}
          <span style={{ opacity: 0.6 }}>(회계연도)</span>
        </Tag>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Tooltip title={canExport ? "" : "플랜 회원 전용"}>
            <Button
              icon={<DownloadOutlined />}
              disabled={!canExport}
              onClick={() => console.log("excel")}
            >
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
        지표명 옆 <span style={{ color: colors.accent, fontWeight: 700 }}>세부</span> 버튼으로 Scope
        등 하위 항목을 펼치고, 헤더 ✕로 컬럼을 제거할 수 있어요. 숫자 컬럼 헤더를 누르면 정렬됩니다.
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
              minWidth: tableMinWidth,
            }}
          >
            <thead>
              {/* 1행: 기업 / 소그룹 / + 지표 추가 */}
              <tr>
                <th
                  rowSpan={3}
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    background: colors.bgPage,
                    textAlign: "left",
                    padding: "0 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSub,
                    borderBottom: `1px solid ${colors.border}`,
                    width: 140,
                    minWidth: 140,
                    verticalAlign: "middle",
                  }}
                >
                  기업
                </th>
                {headerGroups.map(({ sg, span }) => (
                  <th
                    key={sg.code}
                    colSpan={span}
                    style={{
                      height: H1,
                      textAlign: "center",
                      padding: "0 12px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: colors.textSub,
                      background: colors.bgPage,
                      borderBottom: `1px solid ${colors.border}`,
                      borderLeft: `1px solid ${colors.border}`,
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: categoryColors[sg.category].fg,
                          display: "inline-block",
                        }}
                      />
                      {sg.name}
                    </span>
                  </th>
                ))}
                {showSanctions && (
                  <th
                    colSpan={sanctionSpan}
                    style={{
                      height: H1,
                      textAlign: "center",
                      padding: "0 12px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: colors.textSub,
                      background: colors.bgPage,
                      borderBottom: `1px solid ${colors.border}`,
                      borderLeft: `2px solid ${colors.border}`,
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                    }}
                  >
                    법규위반·제재
                  </th>
                )}
                <th
                  rowSpan={3}
                  style={{
                    position: "sticky",
                    right: 0,
                    zIndex: 2,
                    background: colors.bgPage,
                    borderBottom: `1px solid ${colors.border}`,
                    padding: "8px 10px",
                    width: 130,
                    minWidth: 130,
                    verticalAlign: "middle",
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
              {/* 2행: 지표 (접기 토글 · × 제거). sub 없는 단일지표는 3행까지 rowspan */}
              <tr>
                {headerGroups.flatMap((g) =>
                  g.inds.map(({ col, span, items }) => {
                    const noSubSingle = items.length === 1 && items[0].sub == null;
                    return (
                      <th
                        key={col.id}
                        colSpan={span}
                        rowSpan={noSubSingle ? 2 : 1}
                        style={{
                          height: H2,
                          textAlign: "center",
                          padding: "4px 8px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: colors.textBase,
                          background: colors.bgPage,
                          borderBottom: `1px solid ${colors.border}`,
                          borderLeft: `1px solid ${colors.border}`,
                          verticalAlign: "middle",
                          ...(noSubSingle
                            ? { width: colW(col.type), maxWidth: colW(col.type) }
                            : {}),
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            justifyContent: "center",
                            maxWidth: "100%",
                          }}
                        >
                          {hasTotal(col) && (
                            <button
                              onClick={() => toggleSubs(col.id)}
                              title={
                                expandedSubs.has(col.id) ? "세부 항목 접기" : "세부 항목 펼치기"
                              }
                              style={{
                                flexShrink: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 2,
                                cursor: "pointer",
                                border: `1px solid ${colors.accent}`,
                                background: `${colors.accent}14`,
                                color: colors.accent,
                                borderRadius: 5,
                                padding: "1px 4px",
                                fontSize: 10,
                                fontWeight: 700,
                                lineHeight: 1.4,
                              }}
                            >
                              {expandedSubs.has(col.id) ? (
                                <CaretDownOutlined style={{ fontSize: 9 }} />
                              ) : (
                                <CaretRightOutlined style={{ fontSize: 9 }} />
                              )}
                              세부
                            </button>
                          )}
                          <span
                            title={col.label}
                            style={{
                              flex: "0 1 auto",
                              minWidth: 0,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.25,
                              wordBreak: "keep-all",
                            }}
                          >
                            {col.label}
                            {col.unit ? (
                              <span style={{ color: colors.textHint, fontWeight: 400 }}>
                                {" "}
                                ({col.unit})
                              </span>
                            ) : null}
                          </span>
                          <CloseOutlined
                            onClick={() => removeColumn(col.id)}
                            style={{
                              fontSize: 10,
                              color: colors.textHint,
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          />
                        </span>
                      </th>
                    );
                  }),
                )}
                {showSanctions && (
                  <th
                    colSpan={sanctionSpan}
                    style={{
                      height: H2,
                      textAlign: "center",
                      padding: "4px 8px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: colors.textBase,
                      background: colors.bgPage,
                      borderBottom: `1px solid ${colors.border}`,
                      borderLeft: `2px solid ${colors.border}`,
                      verticalAlign: "middle",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => setSanctionExpanded((v) => !v)}
                        title={sanctionExpanded ? "테마 접기" : "테마별로 펼치기"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          cursor: "pointer",
                          border: `1px solid ${colors.accent}`,
                          background: `${colors.accent}14`,
                          color: colors.accent,
                          borderRadius: 5,
                          padding: "1px 4px",
                          fontSize: 10,
                          fontWeight: 700,
                          lineHeight: 1.4,
                        }}
                      >
                        {sanctionExpanded ? (
                          <CaretDownOutlined style={{ fontSize: 9 }} />
                        ) : (
                          <CaretRightOutlined style={{ fontSize: 9 }} />
                        )}
                        테마
                      </button>
                      법규위반·제재
                      <CloseOutlined
                        onClick={() => setShowSanctions(false)}
                        style={{ fontSize: 10, color: colors.textHint, cursor: "pointer" }}
                      />
                    </span>
                  </th>
                )}
              </tr>
              {/* 3행: sub / 연도 (sub 없는 단일지표는 2행 rowspan으로 대체 → 스킵) */}
              <tr>
                {headerGroups.flatMap((g) =>
                  g.inds.flatMap(({ col, items }) => {
                    const noSubSingle = items.length === 1 && items[0].sub == null;
                    if (noSubSingle) return [];
                    return items.map(({ sub, year }) => {
                      const subCode = sub?.code ?? null;
                      const active =
                        sort?.colId === col.id && sort?.subCode === subCode && sort?.year === year;
                      const parts: string[] = [];
                      if (sub) parts.push(sub.name);
                      if (multiYear) parts.push(`FY${year}`);
                      if (parts.length === 0) parts.push("값");
                      return (
                        <th
                          key={cellKey(col.id, year, subCode)}
                          onClick={
                            col.type === "numeric"
                              ? () => toggleSort(col.id, subCode, year)
                              : undefined
                          }
                          style={{
                            height: H3,
                            textAlign: "right",
                            padding: "0 12px",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: colors.textSub,
                            borderBottom: `1px solid ${colors.border}`,
                            borderLeft: `1px solid ${colors.border}`,
                            background: colors.bgPage,
                            cursor: col.type === "numeric" ? "pointer" : "default",
                            width: colW(col.type),
                            whiteSpace: "nowrap",
                            verticalAlign: "middle",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              justifyContent: "flex-end",
                            }}
                          >
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
                    });
                  }),
                )}
                {showSanctions &&
                  (sanctionExpanded ? (
                    SANCTION_THEMES.map((t, i) => {
                      const active = sort?.colId === "__sanction" && sort?.subCode === t.key;
                      return (
                        <th
                          key={t.key}
                          onClick={() =>
                            setSort((s) =>
                              s?.colId === "__sanction" && s.subCode === t.key
                                ? {
                                    colId: "__sanction",
                                    subCode: t.key,
                                    year: 0,
                                    dir: s.dir === "desc" ? "asc" : "desc",
                                  }
                                : { colId: "__sanction", subCode: t.key, year: 0, dir: "desc" },
                            )
                          }
                          title={t.label}
                          style={{
                            height: H3,
                            textAlign: "right",
                            padding: "0 10px",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: colors.textSub,
                            borderBottom: `1px solid ${colors.border}`,
                            borderLeft:
                              i === 0 ? `2px solid ${colors.border}` : `1px solid ${colors.border}`,
                            background: colors.bgPage,
                            cursor: "pointer",
                            width: 92,
                            whiteSpace: "nowrap",
                            verticalAlign: "middle",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              justifyContent: "flex-end",
                            }}
                          >
                            {t.short}
                            {active ? (
                              sort!.dir === "desc" ? (
                                <CaretDownOutlined />
                              ) : (
                                <CaretUpOutlined />
                              )
                            ) : null}
                          </span>
                        </th>
                      );
                    })
                  ) : (
                    <th
                      style={{
                        height: H3,
                        textAlign: "center",
                        padding: "0 12px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: colors.textSub,
                        borderBottom: `1px solid ${colors.border}`,
                        borderLeft: `2px solid ${colors.border}`,
                        background: colors.bgPage,
                        width: 200,
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      테마별 건수
                    </th>
                  ))}
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
                        zIndex: 1,
                        background: colors.bgSurface,
                        padding: "7px 12px",
                        borderBottom: `1px solid ${colors.border}`,
                        borderRight: `1px solid ${colors.border}`,
                        width: 140,
                        minWidth: 140,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        data-company-name
                        title={r.name}
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: colors.primary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 116,
                        }}
                      >
                        {r.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: colors.textSub,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 116,
                        }}
                      >
                        {r.id} · {r.sector}
                      </div>
                    </td>
                    {viewCols.map(({ col, sub, year }) => {
                      const key = cellKey(col.id, year, sub?.code);
                      const off = isUndisclosed(r.cells[key], col.type); // 비공개 = 클릭 비활성화
                      return (
                        <td
                          key={key}
                          onClick={
                            off ? undefined : () => onIndicatorOpen(r.id, col.category, col.id)
                          }
                          onMouseEnter={
                            off
                              ? undefined
                              : (e) => (e.currentTarget.style.textDecoration = "underline")
                          }
                          onMouseLeave={
                            off ? undefined : (e) => (e.currentTarget.style.textDecoration = "none")
                          }
                          style={{
                            padding: "5px 12px",
                            borderBottom: `1px solid ${colors.border}`,
                            borderLeft: `1px solid ${colors.border}`,
                            textAlign: "right",
                            width: colW(col.type),
                            verticalAlign: "middle",
                            cursor: off ? "default" : "pointer",
                          }}
                        >
                          <CellContent col={col} cell={r.cells[key]} locked={locked} />
                        </td>
                      );
                    })}
                    {/* 법규위반·제재 셀 (타입 D) */}
                    {showSanctions &&
                      (sanctionExpanded
                        ? SANCTION_THEMES.map((t, i) => {
                            const n = sanctionCounts[r.id]?.[t.key] ?? 0;
                            const off = n === 0; // 기록 없음 = 클릭 비활성화
                            return (
                              <td
                                key={t.key}
                                onClick={off ? undefined : () => onSanctionOpen(r.id)}
                                onMouseEnter={
                                  off
                                    ? undefined
                                    : (e) => (e.currentTarget.style.textDecoration = "underline")
                                }
                                onMouseLeave={
                                  off
                                    ? undefined
                                    : (e) => (e.currentTarget.style.textDecoration = "none")
                                }
                                style={{
                                  padding: "5px 10px",
                                  borderBottom: `1px solid ${colors.border}`,
                                  borderLeft:
                                    i === 0
                                      ? `2px solid ${colors.border}`
                                      : `1px solid ${colors.border}`,
                                  textAlign: "right",
                                  width: 92,
                                  verticalAlign: "middle",
                                  cursor: off ? "default" : "pointer",
                                  fontVariantNumeric: "tabular-nums",
                                  fontSize: 13,
                                  color: n ? colors.textBase : colors.textHint,
                                }}
                              >
                                {n ? n : "·"}
                              </td>
                            );
                          })
                        : (() => {
                            const has = SANCTION_THEMES.some(
                              (t) => (sanctionCounts[r.id]?.[t.key] ?? 0) > 0,
                            );
                            return (
                              <td
                                onClick={has ? () => onSanctionOpen(r.id) : undefined}
                                onMouseEnter={
                                  has
                                    ? (e) => (e.currentTarget.style.textDecoration = "underline")
                                    : undefined
                                }
                                onMouseLeave={
                                  has
                                    ? (e) => (e.currentTarget.style.textDecoration = "none")
                                    : undefined
                                }
                                style={{
                                  padding: "5px 12px",
                                  borderBottom: `1px solid ${colors.border}`,
                                  borderLeft: `2px solid ${colors.border}`,
                                  width: 200,
                                  verticalAlign: "middle",
                                  cursor: has ? "pointer" : "default",
                                }}
                              >
                                <SanctionSummaryChips counts={sanctionCounts[r.id] ?? {}} />
                              </td>
                            );
                          })())}
                    {/* + 지표 추가 컬럼(오른쪽 고정) — 셀은 비움 */}
                    <td
                      style={{
                        position: "sticky",
                        right: 0,
                        zIndex: 1,
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

        {/* 비회원 미리보기 안내 (2페이지부터 가입/플랜 유도) */}
        {plan !== "enterprise" && pages > 1 && (
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
              if (p > 1 && plan !== "enterprise") {
                onUpgrade(); // 비회원/개인은 2페이지부터 잠금
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

// 제재 컬럼 접힌 셀 — 테마 칩 몇 개 + "+N" (총건수 미표시)
function SanctionSummaryChips({ counts }: { counts: Record<string, number> }) {
  const present = SANCTION_THEMES.filter((t) => counts[t.key]);
  if (present.length === 0) return <span style={{ color: colors.textHint }}>·</span>;
  const top = present.slice(0, 3);
  const more = present.length - top.length;
  return (
    <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
      {top.map((t) => (
        <span
          key={t.key}
          style={{
            fontSize: 11,
            fontWeight: 600,
            background: t.tone.bg,
            color: t.tone.fg,
            padding: "1px 7px",
            borderRadius: 10,
            whiteSpace: "nowrap",
          }}
        >
          {t.short} {counts[t.key]}
        </span>
      ))}
      {more > 0 && <span style={{ fontSize: 11, color: colors.textHint }}>+{more}</span>}
    </span>
  );
}
