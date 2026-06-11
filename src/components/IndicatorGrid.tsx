// 공용 지표 그리드(표현 전용) — 통합검색·워크스페이스가 공유.
// 3단 헤더(소그룹>지표>sub) · 다타입 셀(수치/도입/서술) · 제재 컬럼(타입 D) · sub 접기 · 정렬.
// 상태는 모두 props로 제어(controlled) — 손 조작/AI 조작이 같은 상태를 공유할 수 있게.
import { useMemo } from "react";
import { CaretUpOutlined, CaretDownOutlined, CaretRightOutlined, CloseOutlined } from "@ant-design/icons";
import type { IndicatorColumn, IndicatorRow, SubDef, Cell } from "@/mock/indicatorSearch";
import { cellKey } from "@/mock/indicatorSearch";
import { SUBGROUPS } from "@/mock/indicatorGrouping";
import { SANCTION_THEMES } from "@/mock/sanctions";
import { colors, categoryColors } from "@/theme/tokens";
import { CellContent } from "@/pages/condition/components/CellContent";

const colW = (t: "numeric" | "boolean" | "text") =>
  t === "text" ? 150 : t === "boolean" ? 104 : 116;
const H1 = 30; // 소그룹
const H2 = 50; // 지표
const H3 = 30; // sub/연도

function isUndisclosed(cell: { value: unknown } | undefined, type: "numeric" | "boolean" | "text"): boolean {
  if (!cell) return true;
  const v = cell.value as unknown;
  if (type === "numeric") return v === null || v === undefined;
  if (type === "boolean") return v === "undisclosed";
  return !(v && (v as { disclosed?: boolean }).disclosed);
}

export interface SortState {
  colId: string;
  subCode: string | null;
  year: number;
  dir: "asc" | "desc";
}

export function IndicatorGrid({
  cols,
  sortedYears,
  multiYear,
  rows,
  expandedSubs,
  onToggleSubs,
  showSanctions,
  sanctionExpanded,
  onToggleSanctionExpanded,
  onRemoveSanctions,
  sanctionCounts,
  sort,
  onToggleSort,
  onSanctionSort,
  onRemoveColumn,
  onCompanyOpen,
  onIndicatorOpen,
  onSanctionOpen,
  lockedFrom = Infinity,
  addColumnSlot,
}: {
  cols: IndicatorColumn[];
  sortedYears: number[];
  multiYear: boolean;
  rows: IndicatorRow[];
  expandedSubs: Set<string>;
  onToggleSubs: (colId: string) => void;
  showSanctions: boolean;
  sanctionExpanded: boolean;
  onToggleSanctionExpanded: () => void;
  onRemoveSanctions: () => void;
  sanctionCounts: Record<string, Record<string, number>>;
  sort: SortState | null;
  onToggleSort: (colId: string, subCode: string | null, year: number) => void;
  onSanctionSort: (themeKey: string) => void;
  onRemoveColumn: (id: string) => void;
  onCompanyOpen: (id: string) => void;
  onIndicatorOpen: (id: string, category: IndicatorColumn["category"], code: string) => void;
  onSanctionOpen: (id: string) => void;
  lockedFrom?: number;
  addColumnSlot?: React.ReactNode;
}) {
  const hasTotal = (col: IndicatorColumn) => !!col.subs?.some((s) => s.code === "total");
  const subsOf = (col: IndicatorColumn): (SubDef | null)[] => {
    if (!col.subs || !col.subs.length) return [null];
    if (hasTotal(col) && !expandedSubs.has(col.id)) {
      return [col.subs.find((s) => s.code === "total") ?? col.subs[0]];
    }
    return col.subs;
  };

  const headerGroups = useMemo(() => {
    const order = SUBGROUPS.filter((sg) => cols.some((c) => c.groupCode === sg.code));
    return order.map((sg) => {
      const inds = cols
        .filter((c) => c.groupCode === sg.code)
        .map((col) => {
          const items = subsOf(col).flatMap((sub) => sortedYears.map((year) => ({ col, sub, year })));
          return { col, span: items.length, items };
        });
      return { sg, inds, span: inds.reduce((a, b) => a + b.span, 0) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, sortedYears, expandedSubs]);

  const viewCols = useMemo(
    () => headerGroups.flatMap((g) => g.inds.flatMap((i) => i.items)),
    [headerGroups],
  );

  const sanctionSpan = sanctionExpanded ? SANCTION_THEMES.length : 1;
  const tableMinWidth = 140 + viewCols.length * 130 + (showSanctions ? sanctionSpan * 150 : 0) + 130;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: tableMinWidth }}>
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
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
              {addColumnSlot}
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
                      ...(noSubSingle ? { width: colW(col.type), maxWidth: colW(col.type) } : {}),
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", maxWidth: "100%" }}>
                      {hasTotal(col) && (
                        <button
                          onClick={() => onToggleSubs(col.id)}
                          title={expandedSubs.has(col.id) ? "세부 항목 접기" : "세부 항목 펼치기"}
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
                        {col.unit ? <span style={{ color: colors.textHint, fontWeight: 400 }}> ({col.unit})</span> : null}
                      </span>
                      <CloseOutlined
                        onClick={() => onRemoveColumn(col.id)}
                        style={{ fontSize: 10, color: colors.textHint, cursor: "pointer", flexShrink: 0 }}
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                  <button
                    onClick={onToggleSanctionExpanded}
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
                    {sanctionExpanded ? <CaretDownOutlined style={{ fontSize: 9 }} /> : <CaretRightOutlined style={{ fontSize: 9 }} />}
                    테마
                  </button>
                  법규위반·제재
                  <CloseOutlined
                    onClick={onRemoveSanctions}
                    style={{ fontSize: 10, color: colors.textHint, cursor: "pointer" }}
                  />
                </span>
              </th>
            )}
          </tr>

          {/* 3행: sub / 연도 */}
          <tr>
            {headerGroups.flatMap((g) =>
              g.inds.flatMap(({ col, items }) => {
                const noSubSingle = items.length === 1 && items[0].sub == null;
                if (noSubSingle) return [];
                return items.map(({ sub, year }) => {
                  const subCode = sub?.code ?? null;
                  const active = sort?.colId === col.id && sort?.subCode === subCode && sort?.year === year;
                  const parts: string[] = [];
                  if (sub) parts.push(sub.name);
                  if (multiYear) parts.push(`FY${year}`);
                  if (parts.length === 0) parts.push("값");
                  return (
                    <th
                      key={cellKey(col.id, year, subCode)}
                      onClick={col.type === "numeric" ? () => onToggleSort(col.id, subCode, year) : undefined}
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
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                        {parts.join(" · ")}
                        {col.type === "numeric" && (active ? (sort!.dir === "desc" ? <CaretDownOutlined /> : <CaretUpOutlined />) : null)}
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
                      onClick={() => onSanctionSort(t.key)}
                      title={t.label}
                      style={{
                        height: H3,
                        textAlign: "right",
                        padding: "0 10px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: colors.textSub,
                        borderBottom: `1px solid ${colors.border}`,
                        borderLeft: i === 0 ? `2px solid ${colors.border}` : `1px solid ${colors.border}`,
                        background: colors.bgPage,
                        cursor: "pointer",
                        width: 92,
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                        {t.short}
                        {active ? (sort!.dir === "desc" ? <CaretDownOutlined /> : <CaretUpOutlined />) : null}
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
          {rows.map((r, idx) => {
            const locked = idx >= lockedFrom;
            return (
              <tr key={r.id}>
                <td
                  onClick={() => onCompanyOpen(r.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.rowHover;
                    const nameEl = e.currentTarget.querySelector("[data-company-name]") as HTMLElement | null;
                    if (nameEl) nameEl.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.bgSurface;
                    const nameEl = e.currentTarget.querySelector("[data-company-name]") as HTMLElement | null;
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
                  const off = isUndisclosed(r.cells[key] as Cell | undefined, col.type);
                  return (
                    <td
                      key={key}
                      onClick={off ? undefined : () => onIndicatorOpen(r.id, col.category, col.id)}
                      onMouseEnter={off ? undefined : (e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={off ? undefined : (e) => (e.currentTarget.style.textDecoration = "none")}
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
                {showSanctions &&
                  (sanctionExpanded
                    ? SANCTION_THEMES.map((t, i) => {
                        const n = sanctionCounts[r.id]?.[t.key] ?? 0;
                        const off = n === 0;
                        return (
                          <td
                            key={t.key}
                            onClick={off ? undefined : () => onSanctionOpen(r.id)}
                            onMouseEnter={off ? undefined : (e) => (e.currentTarget.style.textDecoration = "underline")}
                            onMouseLeave={off ? undefined : (e) => (e.currentTarget.style.textDecoration = "none")}
                            style={{
                              padding: "5px 10px",
                              borderBottom: `1px solid ${colors.border}`,
                              borderLeft: i === 0 ? `2px solid ${colors.border}` : `1px solid ${colors.border}`,
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
                        const has = SANCTION_THEMES.some((t) => (sanctionCounts[r.id]?.[t.key] ?? 0) > 0);
                        return (
                          <td
                            onClick={has ? () => onSanctionOpen(r.id) : undefined}
                            onMouseEnter={has ? (e) => (e.currentTarget.style.textDecoration = "underline") : undefined}
                            onMouseLeave={has ? (e) => (e.currentTarget.style.textDecoration = "none") : undefined}
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
  );
}

// 제재 컬럼 접힌 셀 — 테마 칩 몇 개 + "+N"
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
