// 값 표시 포맷 유틸 — 기획안 "0값=비공개" 정책 반영
import type { SeriesPoint } from "@/types";

const BOOLEAN_UNITS = new Set(["도입여부", "설치여부"]);

export function isBooleanUnit(unit?: string): boolean {
  return !!unit && BOOLEAN_UNITS.has(unit);
}

/** 화면 표시 문자열. null(비공개)·잠금은 호출부에서 별도 처리 */
export function formatValue(point: SeriesPoint): string {
  const { value, unit } = point;
  if (value === null) return "비공개";

  if (isBooleanUnit(unit)) {
    const label = unit === "설치여부" ? "설치" : "도입";
    return value >= 1 ? label : "비공개";
  }

  const formatted = value.toLocaleString("ko-KR");
  return unit && unit !== "%" ? `${formatted} ${unit}` : unit === "%" ? `${formatted}%` : formatted;
}

/** 차트용 숫자값(잠금/비공개/불리언은 차트에서 제외 가능하도록 null 반환) */
export function chartValue(point: SeriesPoint): number | null {
  if (point.locked || point.value === null) return null;
  return point.value;
}
