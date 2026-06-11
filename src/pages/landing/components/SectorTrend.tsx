// SectorTrend (스펙 2.5) — 업종 평균 시계열 (추이만, 해석·전망 없음)
// 안전선: 증감은 숫자·화살표로만, 가치 라벨·예측 금지.
import { useState } from "react";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getSectorTrend, SECTOR_OPTIONS } from "@/mock/landing";
import { colors } from "@/theme/tokens";
import { Section } from "./Section";
import { FieldTabs } from "./FieldTabs";
import { AggregateDisclaimer } from "./AggregateDisclaimer";

export function SectorTrend({ embedded = false }: { embedded?: boolean }) {
  const [sector, setSector] = useState("manufacturing");
  const data = getSectorTrend(sector);

  const first = data.series[0]?.value ?? 0;
  const last = data.series[data.series.length - 1]?.value ?? 0;
  const delta = Number((last - first).toFixed(1));
  const up = delta > 0;

  return (
    <Section title="업종 트렌드" embedded={embedded}>
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "20px 22px",
        }}
      >
        {/* 업종 선택 — 상단 탭 */}
        <FieldTabs options={SECTOR_OPTIONS} value={sector} onChange={setSector} />

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 12, color: colors.textSub }}>
            {data.sector} · {data.metric} · 단위 {data.unit}
          </div>
          {/* 증감: 숫자·화살표만 (해석 문구 없음) */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: colors.textSub,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {data.series[0]?.year}→{data.series[data.series.length - 1]?.year}{" "}
            <span style={{ color: colors.textBase }}>
              {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(delta)}
            </span>
          </div>
        </div>

        <div style={{ height: 200, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: colors.textSub }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: colors.textSub }} tickLine={false} width={48} />
              <RTooltip
                formatter={(v) => [Number(v).toLocaleString("ko-KR"), "업종 평균"]}
                labelFormatter={(l) => `${l}년`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors.primary}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <AggregateDisclaimer />
      </div>
    </Section>
  );
}
