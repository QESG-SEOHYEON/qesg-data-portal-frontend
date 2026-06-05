// 출처 정의 (기획안 7.2 source 코어 / 데이터 출처 5종)
// ⚠️ 목업 전용. url은 자리표시 — 실제 전환 시 원문 링크로 채운다(AI 근거 링크 재사용).
import type { SourceCode, SourceDef } from "@/types";

export const SOURCES: Record<SourceCode, SourceDef> = {
  DART: { code: "DART", label: "DART 사업보고서", url: "#" },
  SR: { code: "SR", label: "지속가능경영보고서", url: "#" },
  NGMS: { code: "NGMS", label: "NGMS", url: "#" },
  ENV: { code: "ENV", label: "환경정보공개시스템", url: "#" },
  NICE: { code: "NICE", label: "NICE", url: "#" },
};

// 출처별 뱃지 색 (셀 단위 출처 뱃지용 — 중립 톤, 카테고리 색과 구분)
export const sourceBadgeColors: Record<SourceCode, { bg: string; fg: string }> = {
  DART: { bg: "#EEF2F7", fg: "#3B5573" },
  SR: { bg: "#F0F4EE", fg: "#4A6340" },
  NGMS: { bg: "#F5F0F6", fg: "#6B4A6E" },
  ENV: { bg: "#EAF4F2", fg: "#2E6E63" },
  NICE: { bg: "#F5F1EA", fg: "#6E5A36" },
};
