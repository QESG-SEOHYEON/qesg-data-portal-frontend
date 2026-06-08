// IndustryCompare (스펙 2.3) — 산업별 환경 데이터 비교 (집계 막대 + 표본수)
// 안전선: 업종 평균만, 개별기업·순위·우열 라벨 없음, 표본수 병기, 면책.
import { useState } from "react";
import { getIndustryCompare, INDUSTRY_METRIC_OPTIONS } from "@/mock/landing";
import { colors } from "@/theme/tokens";
import { Section } from "./Section";
import { FieldTabs } from "./FieldTabs";
import { AggregateDisclaimer } from "./AggregateDisclaimer";

export function IndustryCompare({ embedded = false }: { embedded?: boolean }) {
  const [metric, setMetric] = useState("ghg_intensity");
  const data = getIndustryCompare(metric);
  const max = Math.max(...data.industries.map((i) => i.value));

  return (
    <Section title="산업군 데이터" embedded={embedded}>
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "20px 22px",
        }}
      >
        {/* 지표 선택 — 상단 탭 */}
        <FieldTabs options={INDUSTRY_METRIC_OPTIONS} value={metric} onChange={setMetric} />

        <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 16 }}>
          {data.metric} · 단위 {data.unit} · 업종 평균
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.industries.map((ind) => {
            const pct = Math.round((ind.value / max) * 100);
            return (
              <div key={ind.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 130, flexShrink: 0, lineHeight: 1.25 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: colors.textBase,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {ind.name}
                  </div>
                  <div style={{ color: colors.textHint, fontSize: 11, whiteSpace: "nowrap" }}>
                    {ind.sample}개사 기준
                  </div>
                </div>
                <div style={{ flex: 1, background: colors.bgPage, borderRadius: 6, height: 22 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: colors.primary,
                      borderRadius: 6,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 56,
                    textAlign: "right",
                    fontSize: 13,
                    fontWeight: 700,
                    color: colors.textBase,
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                  }}
                >
                  {ind.value}
                </div>
              </div>
            );
          })}
        </div>

        <AggregateDisclaimer />
      </div>
    </Section>
  );
}
