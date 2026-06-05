// 대량 조회 Glide 그리드 (읽기 전용)
// 행=기업, 열=지표(E/S/G 그룹 헤더). 기업 식별 열 2개 고정.
// 잠금 시: 행/열 골격은 노출, 셀 값만 🔒 (기획안 "행/열 분리 잠금").
import { useCallback, useMemo } from "react";
import DataEditor, {
  type GridColumn,
  type GridCell,
  type Item,
  GridCellKind,
} from "@glideapps/glide-data-grid";
import type { CatalogRaw } from "@/mock/catalogData";
import type { BulkCompany } from "@/mock/bulkData";
import { getBulkCell } from "@/mock/bulkData";
import { categoryColors, colors } from "@/theme/tokens";
import { qesgGridTheme } from "@/theme/gridTheme";

interface Props {
  companies: BulkCompany[];
  indicators: CatalogRaw[];
  /** true면 셀 값 잠금(골격만 노출) */
  locked: boolean;
}

const FIXED_COLS = 2; // 기업명 + 종목코드

export function BulkGrid({ companies, indicators, locked }: Props) {
  const columns = useMemo<GridColumn[]>(() => {
    const fixed: GridColumn[] = [
      { title: "기업명", id: "name", width: 160 },
      { title: "종목코드", id: "code", width: 92 },
    ];
    const indCols: GridColumn[] = indicators.map((ind) => ({
      title: ind.name,
      id: ind.code,
      width: 150,
      group: categoryColors[ind.category].name, // 환경/사회/지배구조
    }));
    return [...fixed, ...indCols];
  }, [indicators]);

  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const company = companies[row];
      // 고정 열
      if (col === 0) {
        return {
          kind: GridCellKind.Text,
          data: company.name,
          displayData: company.name,
          allowOverlay: false,
          readonly: true,
          themeOverride: { textDark: colors.textBase, baseFontStyle: "600 13px" },
        };
      }
      if (col === 1) {
        return {
          kind: GridCellKind.Text,
          data: company.id,
          displayData: company.id,
          allowOverlay: false,
          readonly: true,
          themeOverride: { textDark: colors.textSub },
        };
      }

      const ind = indicators[col - FIXED_COLS];

      // 잠금: 값 대신 자물쇠 (골격은 유지)
      if (locked) {
        return {
          kind: GridCellKind.Text,
          data: "",
          displayData: "🔒",
          allowOverlay: false,
          readonly: true,
          themeOverride: { textDark: colors.textHint, bgCell: "#FAFBFC" },
        };
      }

      const cell = getBulkCell(company.id, ind);
      const undisclosed = cell.value === null;
      return {
        kind: GridCellKind.Text,
        data: cell.display,
        displayData: cell.display,
        allowOverlay: false,
        readonly: true,
        themeOverride: undisclosed
          ? { textDark: colors.textHint }
          : { textDark: colors.textBase },
      };
    },
    [companies, indicators, locked],
  );

  if (columns.length === 0 || companies.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: colors.textHint }}>
        조건에 맞는 데이터가 없습니다
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "calc(100vh - 230px)", minHeight: 360 }}>
      <DataEditor
        columns={columns}
        rows={companies.length}
        getCellContent={getCellContent}
        theme={qesgGridTheme}
        freezeColumns={FIXED_COLS}
        width="100%"
        height="100%"
        headerHeight={40}
        groupHeaderHeight={32}
        rowHeight={36}
        smoothScrollX
        smoothScrollY
        rowMarkers="number"
        getCellsForSelection={true}
        keybindings={{ search: true, selectAll: true }}
      />
    </div>
  );
}
