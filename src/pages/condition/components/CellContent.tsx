// 타입별 셀 렌더 (개별 기업 페이지와 동일 규칙) — 수치/도입3구분/서술.
// ⚠️ 출처(데이터 소스) 표시는 사내 정책 확정 전까지 화면에서 끔 — cell.source 데이터는 유지, 렌더만 생략.
// ⚠️ 그리드 셀은 "기업 상세로 이동"으로 일원화 → 서술형 원문 링크는 그리드에서 끔(원문은 상세 페이지에서).
import type { Cell, IndicatorColumn, BoolState } from "@/mock/indicatorSearch";
import { colors } from "@/theme/tokens";

const numFmt = (v: number, unit?: string) => {
  const n = v.toLocaleString("ko-KR");
  return unit === "%" ? `${n}%` : n;
};

export function CellContent({ col, cell, locked }: { col: IndicatorColumn; cell: Cell; locked: boolean }) {
  if (locked) {
    return (
      <span style={{ filter: "blur(4px)", userSelect: "none", color: colors.textBase, fontWeight: 600, fontSize: 13 }}>0,000</span>
    );
  }

  if (col.type === "numeric") {
    const v = cell.value as number | null;
    return v === null ? (
      <span style={{ fontSize: 13, color: colors.textHint }}>비공개</span>
    ) : (
      <span style={{ fontSize: 13, fontWeight: 600, color: colors.textBase, fontVariantNumeric: "tabular-nums" }}>{numFmt(v, col.unit)}</span>
    );
  }
  if (col.type === "boolean") {
    const s = cell.value as BoolState;
    return s === "adopted" ? (
      <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent, background: `${colors.accent}14`, padding: "2px 8px", borderRadius: 5 }}>도입</span>
    ) : s === "not_adopted" ? (
      <span style={{ fontSize: 12, color: colors.textSub, background: colors.bgPage, padding: "2px 8px", borderRadius: 5 }}>미도입</span>
    ) : (
      <span style={{ fontSize: 12, color: colors.textHint }}>비공개</span>
    );
  }
  // 서술형: 원문 링크 대신 상태 텍스트만 (셀 클릭은 기업 상세로 — 원문은 상세 페이지에서)
  const t = cell.value as { disclosed: boolean; url?: string };
  return t.disclosed ? (
    <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.primary }}>공시</span>
  ) : (
    <span style={{ fontSize: 13, color: colors.textHint }}>비공개</span>
  );
}
