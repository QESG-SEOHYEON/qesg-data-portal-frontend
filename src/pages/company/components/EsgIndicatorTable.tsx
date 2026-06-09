// ESG 다타입 지표 테이블 — 수치/도입/서술이 한 테이블에 섞임(타입 소제목 없음).
// 셀 모양만 타입별 분기. 수치형 클릭 시 다개년 추이 아코디언 펼침. 잠금 행 blur(출처뱃지 유지).
import { useState } from "react";
import { LockOutlined, LinkOutlined, CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { CompanyDetail, DetailIndicator } from "@/mock/companyDetail";
import { colors } from "@/theme/tokens";

function numText(ind: DetailIndicator): string {
  if (ind.value === null) return "미공개";
  const n = ind.value.toLocaleString("ko-KR");
  return ind.unit === "%" ? `${n}%` : ind.unit ? `${n} ${ind.unit}` : n;
}

function ValueCell({ ind, expandable, expanded }: { ind: DetailIndicator; expandable: boolean; expanded: boolean }) {
  if (ind.locked) {
    return <span style={{ filter: "blur(5px)", userSelect: "none", color: colors.textBase, fontWeight: 600 }}>000,000</span>;
  }
  if (ind.type === "numeric") {
    const undisclosed = ind.value === null;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13.5, fontWeight: undisclosed ? 400 : 600, color: undisclosed ? colors.textHint : colors.textBase, fontVariantNumeric: "tabular-nums" }}>
          {numText(ind)}
        </span>
        {expandable && (expanded ? <CaretDownOutlined style={{ fontSize: 10, color: colors.textHint }} /> : <CaretRightOutlined style={{ fontSize: 10, color: colors.textHint }} />)}
      </span>
    );
  }
  if (ind.type === "boolean") {
    if (ind.state === "adopted") return <span style={{ fontSize: 13, fontWeight: 600, color: colors.accent }}>✓ 도입</span>;
    if (ind.state === "not_adopted") return <span style={{ fontSize: 13, color: colors.textSub }}>미도입</span>;
    return <span style={{ fontSize: 13, color: colors.textHint }}>비공개</span>;
  }
  // text
  if (ind.disclosed) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.accent }}>✓ 공시</span>
        <a href={ind.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: colors.primary, fontWeight: 600 }}>
          원문 <LinkOutlined style={{ fontSize: 10 }} />
        </a>
      </span>
    );
  }
  return <span style={{ fontSize: 13, color: colors.textHint }}>비공개</span>;
}

export function EsgIndicatorTable({
  rows,
  trend,
  onCompare,
}: {
  rows: DetailIndicator[];
  trend: CompanyDetail["trend"];
  onCompare?: (label: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
        <thead>
          <tr>
            {["지표명", "값·현황", "전년 대비"].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: i === 0 ? "left" : "right",
                  padding: "10px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.textSub,
                  borderBottom: `1px solid ${colors.border}`,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((ind) => {
            const t = trend[ind.label];
            const expandable = ind.type === "numeric" && !ind.locked && !!t;
            const isOpen = expanded === ind.label;
            return (
              <RowGroup
                key={ind.label}
                ind={ind}
                trend={t}
                expandable={expandable}
                isOpen={isOpen}
                onToggle={() => expandable && setExpanded(isOpen ? null : ind.label)}
                onCompare={onCompare}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RowGroup({
  ind,
  trend,
  expandable,
  isOpen,
  onToggle,
  onCompare,
}: {
  ind: DetailIndicator;
  trend?: CompanyDetail["trend"][string];
  expandable: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onCompare?: (label: string) => void;
}) {
  return (
    <>
      <tr
        onClick={expandable ? onToggle : undefined}
        style={{ cursor: expandable ? "pointer" : "default" }}
      >
        <td style={{ padding: "12px", borderBottom: `1px solid ${colors.border}` }}>
          <span style={{ fontSize: 14, color: colors.textBase, fontWeight: 500 }}>{ind.label}</span>
        </td>
        <td style={{ padding: "12px", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>
          <ValueCell ind={ind} expandable={expandable} expanded={isOpen} />
        </td>
        <td style={{ padding: "12px", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>
          {ind.type === "numeric" && !ind.locked ? (
            <span style={{ fontSize: 13, color: colors.textSub, fontVariantNumeric: "tabular-nums" }}>{ind.yoy ?? "—"}</span>
          ) : ind.locked ? (
            <LockOutlined style={{ color: colors.textHint, fontSize: 12 }} />
          ) : (
            <span style={{ color: colors.textHint }}></span>
          )}
        </td>
      </tr>
      {isOpen && trend && (
        <tr>
          <td colSpan={3} style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bgPage, padding: "14px 16px" }}>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend.series} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEE" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: colors.textSub }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: colors.textSub }} tickLine={false} width={56} />
                  <RTooltip formatter={(v) => [Number(v).toLocaleString("ko-KR"), ind.label]} labelFormatter={(l) => `${l}년`} />
                  <Bar dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, fontSize: 12, color: colors.textSub }}>
              {trend.unit && <span>단위: {trend.unit}</span>}
              <span>· {trend.series[0]?.year}→{trend.series[trend.series.length - 1]?.year}</span>
              <a
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare?.(ind.label);
                }}
                style={{ marginLeft: "auto", color: colors.primary, fontWeight: 600, cursor: "pointer" }}
              >
                다른 기업과 비교 →
              </a>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
