// 테이블 뷰 (기획안 4.2: 차트↔테이블 토글)
// 행 = 지표, 열 = 연도. 셀 = 값 + 출처 뱃지. 잠금 셀은 값 가리고 자물쇠 + 출처 뱃지 유지.
import { LockOutlined } from "@ant-design/icons";
import type { IndicatorSeries, SeriesPoint } from "@/types";
import { colors } from "@/theme/tokens";
import { formatValue } from "@/utils/format";
import { SourceBadge } from "./SourceBadge";

interface Props {
  series: IndicatorSeries[];
  years: number[];
}

function Cell({ point }: { point: SeriesPoint }) {
  if (point.locked) {
    const lockLabel = point.tier === "enterprise" ? "기업 전용" : "회원 전용";
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
        <span style={{ color: colors.textHint, fontSize: 13 }}>
          <LockOutlined /> {lockLabel}
        </span>
        {/* 잠겨도 출처·연도 뱃지는 유지 — "어디서 왔는지는 보이되 값은 회원만" */}
        <SourceBadge source={point.source} year={point.fiscalYear} />
      </div>
    );
  }
  const undisclosed = point.value === null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
      <span
        style={{
          fontSize: 13,
          color: undisclosed ? colors.textHint : colors.textBase,
          fontWeight: undisclosed ? 400 : 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatValue(point)}
      </span>
      {/* 비공개여도 출처 뱃지는 유지 — 커버리지/출처 각인 */}
      <SourceBadge source={point.source} year={point.fiscalYear} />
    </div>
  );
}

export function DataTableView({ series, years }: Props) {
  if (series.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: colors.textHint, fontSize: 14 }}>
        이 카테고리의 보유 지표가 없습니다
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "10px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: colors.textSub,
                borderBottom: `1px solid ${colors.border}`,
                position: "sticky",
                left: 0,
                background: colors.bgSurface,
              }}
            >
              지표
            </th>
            {years.map((y) => (
              <th
                key={y}
                style={{
                  textAlign: "right",
                  padding: "10px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.textSub,
                  borderBottom: `1px solid ${colors.border}`,
                  minWidth: 110,
                }}
              >
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.map(({ indicator, points }) => (
            <tr key={indicator.id}>
              <td
                style={{
                  padding: "12px",
                  borderBottom: `1px solid ${colors.border}`,
                  position: "sticky",
                  left: 0,
                  background: colors.bgSurface,
                }}
              >
                <div style={{ fontSize: 14, color: colors.textBase, fontWeight: 500 }}>
                  {indicator.label}
                </div>
                {indicator.unit && (
                  <div style={{ fontSize: 11, color: colors.textHint, marginTop: 2 }}>
                    단위: {indicator.unit}
                  </div>
                )}
              </td>
              {points.map((p) => (
                <td
                  key={p.fiscalYear}
                  style={{
                    padding: "12px",
                    borderBottom: `1px solid ${colors.border}`,
                    verticalAlign: "top",
                  }}
                >
                  <Cell point={p} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
