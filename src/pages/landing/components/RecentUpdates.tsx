// RecentUpdates (랜딩 명세 2.3, 축②) — 신선도. 대상·건수·시점 리스트
// ⚠️ 출처(데이터 소스) 표시는 사내 정책 확정 전까지 화면에서 끔 — u.source 데이터는 유지, 렌더만 생략.
import { ClockCircleOutlined } from "@ant-design/icons";
import { getRecentUpdates, DATA_LAST_UPDATED } from "@/mock/landing";
import { colors } from "@/theme/tokens";
import { Section } from "./Section";

export function RecentUpdates({ embedded = false }: { embedded?: boolean }) {
  const updates = getRecentUpdates();

  return (
    <Section title="최근 업데이트" extra={`최종 갱신: ${DATA_LAST_UPDATED}`} embedded={embedded}>
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {updates.map((u, idx) => {
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 18px",
                borderTop: idx === 0 ? "none" : `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  color: colors.textBase,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {u.target}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: colors.textSub,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {u.count.toLocaleString("ko-KR")}건
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: colors.textHint,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  minWidth: 56,
                  justifyContent: "flex-end",
                }}
              >
                <ClockCircleOutlined /> {u.when}
              </span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
