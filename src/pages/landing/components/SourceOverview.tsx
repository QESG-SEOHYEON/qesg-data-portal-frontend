// SourceOverview (랜딩 명세 2.4, 축③) — 출처별 보유량 막대 비교 + 차별점 카피
import { getSourceOverview, toSourceCode } from "@/mock/landing";
import { colors } from "@/theme/tokens";
import { sourceBadgeColors } from "@/mock/sources";
import { Section } from "./Section";

export function SourceOverview() {
  const sources = getSourceOverview();
  const max = Math.max(...sources.map((s) => s.companies));

  return (
    <Section title="데이터 출처 현황">
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "22px 20px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sources.map((s) => {
            const c = sourceBadgeColors[toSourceCode(s.source)];
            const pct = Math.round((s.companies / max) * 100);
            return (
              <div key={s.source} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 180, fontSize: 13, color: colors.textBase, flexShrink: 0 }}>
                  {s.source}
                </span>
                <div style={{ flex: 1, background: colors.bgPage, borderRadius: 6, height: 22 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: c.fg,
                      borderRadius: 6,
                      opacity: 0.85,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 92,
                    textAlign: "right",
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.textSub,
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                  }}
                >
                  {s.companies.toLocaleString("ko-KR")}사
                </span>
              </div>
            );
          })}
        </div>

        <p
          style={{
            margin: "20px 0 0",
            paddingTop: 16,
            borderTop: `1px solid ${colors.border}`,
            fontSize: 14,
            color: colors.textSub,
            lineHeight: 1.6,
          }}
        >
          모든 수치는 <strong style={{ color: colors.primary }}>출처와 공시 연도가 셀 단위로 추적</strong>
          됩니다 — 등급이 아닌 원본 데이터.
        </p>
      </div>
    </Section>
  );
}
