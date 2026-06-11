// ⚠️ [미사용·참고] 향후 워크스페이스 "벌크 데이터 테이블 조회"용 Glide Data Grid 시제품.
//   통합검색 결과 표에는 적용하지 않음(롤백). 워크스페이스 벌크 조회 구현 시 출발점으로 사용.
//   한계: Glide 네이티브 그룹은 1단(현 지표명)만 span → 소그룹>지표>sub 3단은 캔버스 커스텀 드로잉 필요.
// ─────────────────────────────────────────────────────────────────────────
// Glide Data Grid 커스텀: 네이티브 그룹=지표명(sub 묶음), 기업 좌측 고정, 우측 + 지표 추가, 타입별 텍스트 셀.
// 그룹 헤더 클릭 → Scope 펼치기/접기 / 헤더 ▾ 메뉴 → 컬럼 제거 / 셀 클릭(기업) → 상세.
import { useCallback, useMemo } from "react";
import { DataEditor, GridCellKind } from "@glideapps/glide-data-grid";
import type { GridColumn, GridCell, Item } from "@glideapps/glide-data-grid";
import type { IndicatorColumn, IndicatorRow, SubDef, BoolState } from "@/mock/indicatorSearch";
import { cellKey } from "@/mock/indicatorSearch";
import { colors } from "@/theme/tokens";

interface ViewCol {
  col: IndicatorColumn;
  sub: SubDef | null;
  year: number;
}

function numText(v: number, unit?: string) {
  const n = v.toLocaleString("ko-KR");
  return unit === "%" ? `${n}%` : n;
}
function widthByType(t: IndicatorColumn["type"]) {
  return t === "text" ? 120 : t === "boolean" ? 96 : 112;
}

export function ConditionGridGlide({
  cols,
  sortedYears,
  rows,
  expandedSubs,
  onToggleSubs,
  multiYear,
  onToggleSort,
  onRemoveColumn,
  onCompanyOpen,
  rightElement,
}: {
  cols: IndicatorColumn[];
  sortedYears: number[];
  rows: IndicatorRow[];
  expandedSubs: Set<string>;
  onToggleSubs: (id: string) => void;
  multiYear: boolean;
  onToggleSort: (colId: string, subCode: string | null, year: number) => void;
  onRemoveColumn: (id: string) => void;
  onCompanyOpen: (id: string) => void;
  rightElement?: React.ReactNode;
}) {
  // sub 접기: total 보유 지표는 기본 합계만
  const subsOf = useCallback(
    (col: IndicatorColumn): (SubDef | null)[] => {
      if (!col.subs || !col.subs.length) return [null];
      const total = col.subs.find((s) => s.code === "total");
      if (total && !expandedSubs.has(col.id)) return [total];
      return col.subs;
    },
    [expandedSubs],
  );

  const viewCols: ViewCol[] = useMemo(
    () => cols.flatMap((col) => subsOf(col).flatMap((sub) => sortedYears.map((year) => ({ col, sub, year })))),
    [cols, sortedYears, subsOf],
  );

  // Glide 컬럼: [기업] + viewCols (group=지표명)
  const gridColumns: GridColumn[] = useMemo(() => {
    const company: GridColumn = { title: "기업", id: "__company", width: 200 };
    const rest: GridColumn[] = viewCols.map((vc) => {
      const parts: string[] = [];
      if (vc.sub) parts.push(vc.sub.name);
      if (multiYear) parts.push(`FY${vc.year}`);
      if (parts.length === 0) parts.push(vc.col.unit ? `(${vc.col.unit})` : "값");
      return {
        title: parts.join(" · "),
        id: cellKey(vc.col.id, vc.year, vc.sub?.code),
        group: vc.col.unit ? `${vc.col.label} (${vc.col.unit})` : vc.col.label,
        width: widthByType(vc.col.type),
        hasMenu: true,
      };
    });
    return [company, ...rest];
  }, [viewCols, multiYear]);

  const getCellContent = useCallback(
    ([c, r]: Item): GridCell => {
      const row = rows[r];
      if (c === 0) {
        return {
          kind: GridCellKind.Text,
          data: row.name,
          displayData: row.name,
          allowOverlay: false,
          themeOverride: { textDark: colors.primary },
        };
      }
      const vc = viewCols[c - 1];
      const cell = row.cells[cellKey(vc.col.id, vc.year, vc.sub?.code)];
      const t = vc.col.type;
      if (t === "numeric") {
        const v = cell?.value as number | null;
        if (v === null || v === undefined) {
          return { kind: GridCellKind.Text, data: "", displayData: "비공개", allowOverlay: false, themeOverride: { textDark: colors.textHint } };
        }
        return { kind: GridCellKind.Number, data: v, displayData: numText(v, vc.col.unit), allowOverlay: false, contentAlign: "right" };
      }
      if (t === "boolean") {
        const s = cell?.value as BoolState;
        const map = {
          adopted: ["도입", colors.accent],
          not_adopted: ["미도입", colors.textSub],
          undisclosed: ["비공개", colors.textHint],
        } as const;
        const [label, color] = map[s] ?? map.undisclosed;
        return { kind: GridCellKind.Text, data: label, displayData: label, allowOverlay: false, contentAlign: "right", themeOverride: { textDark: color } };
      }
      // text(서술형)
      const tv = cell?.value as { disclosed: boolean } | undefined;
      const disclosed = !!tv?.disclosed;
      return {
        kind: GridCellKind.Text,
        data: disclosed ? "공시" : "비공개",
        displayData: disclosed ? "공시" : "비공개",
        allowOverlay: false,
        contentAlign: "right",
        themeOverride: { textDark: disclosed ? colors.primary : colors.textHint },
      };
    },
    [rows, viewCols],
  );

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        overflow: "hidden",
        background: colors.bgSurface,
      }}
    >
      <DataEditor
        columns={gridColumns}
        rows={rows.length}
        getCellContent={getCellContent}
        freezeColumns={1}
        rowHeight={40}
        headerHeight={36}
        groupHeaderHeight={34}
        smoothScrollX
        smoothScrollY
        width="100%"
        height={Math.min(70 + rows.length * 40, 560)}
        rightElement={rightElement as React.ReactNode}
        rightElementProps={{ sticky: true, fill: false }}
        onCellClicked={([c, r]) => {
          if (c === 0) onCompanyOpen(rows[r].id);
        }}
        onHeaderClicked={(c) => {
          if (c === 0) return;
          const vc = viewCols[c - 1];
          if (vc.col.type === "numeric") onToggleSort(vc.col.id, vc.sub?.code ?? null, vc.year);
        }}
        onGroupHeaderClicked={(c) => {
          const vc = viewCols[c - 1];
          if (vc && vc.col.subs?.some((s) => s.code === "total")) onToggleSubs(vc.col.id);
        }}
        onHeaderMenuClick={(c) => {
          if (c === 0) return;
          onRemoveColumn(viewCols[c - 1].col.id);
        }}
        theme={{
          accentColor: colors.accent,
          textDark: colors.textBase,
          textMedium: colors.textSub,
          textHeader: colors.textSub,
          bgHeader: colors.bgPage,
          bgHeaderHovered: colors.rowHover,
          bgCell: colors.bgSurface,
          borderColor: colors.border,
          fontFamily: "Pretendard, sans-serif",
          headerFontStyle: "700 12px",
          baseFontStyle: "13px",
        }}
      />
    </div>
  );
}
