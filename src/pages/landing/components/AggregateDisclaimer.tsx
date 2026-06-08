// 집계 위젯 공통 면책 (안전선 섹션 5-4)
import { colors } from "@/theme/tokens";

export function AggregateDisclaimer({ note }: { note?: string }) {
  return (
    <div style={{ marginTop: 12, fontSize: 11.5, color: colors.textHint, lineHeight: 1.5 }}>
      {note ? `${note} ` : ""}
      본 통계는 공시 데이터의 산술 집계이며, 평가·등급·투자 자문이 아닙니다.
    </div>
  );
}
