// 공용 "+ 지표 추가" — 데이터 테이블 맨 오른쪽 컬럼 헤더 버튼.
// 클릭 → 필터 모달의 "표시 지표" 섹션 열기(연동). 컬럼 한도 초과 시 업그레이드 유도.
import { PlusOutlined } from "@ant-design/icons";
import type { ViewerPlan } from "@/types";
import { columnLimitOf } from "@/mock/access";
import { colors } from "@/theme/tokens";

export function AddIndicatorColumn({
  count,
  plan,
  onOpen,
  onUpgrade,
  emphasize = false,
}: {
  count: number; // 현재 표시 지표 수
  plan: ViewerPlan;
  onOpen: () => void; // 필터 모달의 표시 지표 섹션 열기
  onUpgrade: () => void;
  emphasize?: boolean;
}) {
  const overLimit = count >= columnLimitOf(plan);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
      <button
        onClick={() => (overLimit ? onUpgrade() : onOpen())}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          padding: "6px 12px",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: emphasize ? colors.accent : colors.textSub,
          background: colors.bgSurface,
          border: emphasize ? `1.5px dashed ${colors.accent}` : `1px solid ${colors.border}`,
        }}
      >
        <PlusOutlined style={{ fontSize: 11 }} /> 지표 추가
      </button>
      {emphasize && (
        <span style={{ fontSize: 11, color: colors.textHint, fontWeight: 400, whiteSpace: "nowrap" }}>
          지표를 추가해 비교
        </span>
      )}
    </div>
  );
}
