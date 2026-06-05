// 차트 뷰 (기획안 4.2: 차트↔테이블 토글) — 지표별 스몰 멀티플 라인 차트
import { LockOutlined } from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { IndicatorSeries } from "@/types";
import { colors } from "@/theme/tokens";
import { chartValue } from "@/utils/format";
import { SourceBadge } from "./SourceBadge";

interface Props {
  series: IndicatorSeries[];
}

function MiniChart({ s }: { s: IndicatorSeries }) {
  const data = s.points.map((p) => ({ year: p.fiscalYear, value: chartValue(p) }));
  const lockedCount = s.points.filter((p) => p.locked).length;
  const visibleCount = data.filter((d) => d.value !== null).length;
  // 대표 출처(첫 포인트 기준)
  const source = s.points[0]?.source;

  return (
    <div
      style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.textBase }}>
          {s.indicator.label}
        </div>
        {source && <SourceBadge source={source} />}
      </div>
      {s.indicator.unit && (
        <div style={{ fontSize: 11, color: colors.textHint, marginTop: 2 }}>
          단위: {s.indicator.unit}
        </div>
      )}

      <div style={{ height: 140, marginTop: 10, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: colors.textSub }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: colors.textSub }} tickLine={false} width={48} />
            <RTooltip
              formatter={(v) => [Number(v).toLocaleString("ko-KR"), "값"]}
              labelFormatter={(l) => `${l}년`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors.primary}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>

        {lockedCount > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 4,
              right: 8,
              fontSize: 11,
              color: colors.textHint,
            }}
          >
            <LockOutlined /> {lockedCount}개 항목 회원 전용
          </div>
        )}
      </div>

      {visibleCount === 0 && (
        <div style={{ fontSize: 12, color: colors.textHint, textAlign: "center", marginTop: -100, paddingBottom: 80 }}>
          표시할 공개 데이터가 없습니다
        </div>
      )}
    </div>
  );
}

export function DataChartView({ series }: Props) {
  if (series.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: colors.textHint, fontSize: 14 }}>
        이 카테고리의 보유 지표가 없습니다
      </div>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 14,
      }}
    >
      {series.map((s) => (
        <MiniChart key={s.indicator.id} s={s} />
      ))}
    </div>
  );
}
