// CoverageStats (랜딩 명세 2.2, 축①) — 큰 숫자 4개로 "다 있다"를 한눈에
import { getCoverageStats } from "@/mock/landing";
import { colors } from "@/theme/tokens";
import { Section } from "./Section";

export function CoverageStats() {
  const stats = getCoverageStats();
  const items = [
    { value: stats.companies, label: "상장사" },
    { value: String(stats.indicators), label: "ESG 지표" },
    { value: String(stats.sources), label: "데이터 출처" },
    { value: stats.years, label: "보유 연도" },
  ];

  return (
    <Section>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "28px 20px",
        }}
      >
        {items.map((it) => (
          <div key={it.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: colors.accent,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              {it.value}
            </div>
            <div style={{ fontSize: 13, color: colors.textSub, marginTop: 6 }}>{it.label}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
