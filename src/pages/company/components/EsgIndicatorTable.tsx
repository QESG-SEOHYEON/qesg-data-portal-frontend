// ESG 다타입 지표 테이블 — 수치/도입/서술이 한 테이블에 섞임(타입 소제목 없음).
// 셀 모양만 타입별 분기. 수치형 클릭 시 다개년 추이 아코디언 펼침. 잠금 행 blur(출처뱃지 유지).
import { useEffect, useMemo, useRef, useState } from "react";
import { LockOutlined, LinkOutlined, CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { CompanyDetail, DetailIndicator } from "@/mock/companyDetail";
import type { ViewerPlan } from "@/types";
import { VISIBLE_COUNT, trendMode, lockCta } from "@/mock/accessRules";
import { colors } from "@/theme/tokens";

const PAGE = 8; // 탭당 기본 노출 수

function numText(ind: DetailIndicator): string {
  if (ind.value === null) return "미공개";
  const n = ind.value.toLocaleString("ko-KR");
  return ind.unit === "%" ? `${n}%` : ind.unit ? `${n} ${ind.unit}` : n;
}

function ValueCell({ ind }: { ind: DetailIndicator }) {
  if (ind.locked) {
    return <span style={{ filter: "blur(5px)", userSelect: "none", color: colors.textBase, fontWeight: 600 }}>000,000</span>;
  }
  if (ind.type === "numeric") {
    const undisclosed = ind.value === null;
    return (
      <span style={{ fontSize: 13.5, fontWeight: undisclosed ? 400 : 600, color: undisclosed ? colors.textHint : colors.textBase, fontVariantNumeric: "tabular-nums" }}>
        {numText(ind)}
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
  tier,
  focusCode,
  onSeeAll,
}: {
  rows: DetailIndicator[];
  trend: CompanyDetail["trend"];
  tier: ViewerPlan;
  focusCode?: string;
  onSeeAll?: () => void; // 전체 보기 → 데이터 조회(통합)로 이동
}) {
  // 등급 분기: 카테고리당 노출 지표 수 / 다개년 추이 허용 여부 (CAN/VISIBLE_COUNT만 참조)
  const limit = VISIBLE_COUNT(tier, "indicatorsPerCategory");
  const multiTrend = trendMode(tier) === "multi";
  const limited = limit !== Infinity; // 비회원만 상위 N개 제한
  const [expanded, setExpanded] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const focusRef = useRef<HTMLTableRowElement>(null);

  // 탭 전환(rows 변경) 시 펼침/하이라이트 초기화 (포커싱 진입은 아래 effect가 재적용)
  useEffect(() => {
    setExpanded(null);
    setHighlight(null);
  }, [rows]);

  // 그리드 셀 클릭 코드 → 동일 분류 코드로 정확 매칭
  const matchCode = useMemo(
    () => (focusCode && rows.some((r) => r.code === focusCode) ? focusCode : null),
    [focusCode, rows],
  );

  // 탭당 8개만 노출. 셀 클릭(포커싱)으로 들어온 지표는 항상 맨 앞으로 끌어와
  // 노출 한도(상위 N개) 안에 들도록 핀 — 홈에서 보이던 값이 기업 페이지에서 잠기지 않게.
  const visible = useMemo(() => {
    if (matchCode) {
      const fr = rows.find((r) => r.code === matchCode);
      if (fr) return [fr, ...rows.filter((r) => r.code !== matchCode)].slice(0, PAGE);
    }
    return rows.slice(0, PAGE);
  }, [rows, matchCode]);
  const hiddenCount = rows.length - visible.length;

  useEffect(() => {
    if (!matchCode) return;
    const ind = rows.find((r) => r.code === matchCode);
    if (ind && ind.type === "numeric" && trend[ind.code]) setExpanded(matchCode);
    setHighlight(matchCode);
    const t1 = setTimeout(
      () => focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      250,
    );
    const t2 = setTimeout(() => setHighlight(null), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [matchCode]); // eslint-disable-line react-hooks/exhaustive-deps

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
          {visible.map((ind, i) => {
            const t = trend[ind.code];
            const hasSubs = !!ind.subs?.length;
            // 잠긴 행: 값만 가림(형태·연도 유지). 상위 N개 밖 → 등급 잠금
            const locked = ind.locked || (limited && i >= limit);
            const expandable = !locked && ((ind.type === "numeric" && !!t && multiTrend) || hasSubs);
            const isOpen = expanded === ind.code;
            return (
              <RowGroup
                key={ind.code}
                ind={ind}
                trend={t}
                locked={locked}
                multiTrend={multiTrend}
                expandable={expandable}
                isOpen={isOpen}
                highlighted={highlight === ind.code}
                rowRef={matchCode === ind.code ? focusRef : undefined}
                onToggle={() => expandable && setExpanded(isOpen ? null : ind.code)}
              />
            );
          })}
        </tbody>
      </table>

      {(hiddenCount > 0 || limited) && (
        <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
          {limited && (
            <div style={{ fontSize: 12, color: colors.textHint, marginBottom: 8 }}>
              <LockOutlined style={{ fontSize: 11, marginRight: 4 }} />
              상위 {limit}개 지표만 표시됩니다 — 나머지는 흐림 처리됩니다
            </div>
          )}
          <button
            onClick={() => onSeeAll?.()}
            style={{
              border: `1px solid ${colors.primary}`,
              background: colors.primary,
              borderRadius: 8,
              padding: "7px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {limited ? lockCta(tier) : "전체 보기"}
          </button>
        </div>
      )}
    </div>
  );
}

function RowGroup({
  ind,
  trend,
  locked,
  multiTrend,
  expandable,
  isOpen,
  highlighted,
  rowRef,
  onToggle,
}: {
  ind: DetailIndicator;
  trend?: CompanyDetail["trend"][string];
  locked: boolean;
  multiTrend: boolean;
  expandable: boolean;
  isOpen: boolean;
  highlighted?: boolean;
  rowRef?: React.Ref<HTMLTableRowElement>;
  onToggle: () => void;
}) {
  // 잠긴 행은 값/전년대비만 가림 — 지표명 형태는 그대로 유지
  const lockedInd = locked ? { ...ind, locked: true } : ind;
  return (
    <>
      <tr
        ref={rowRef}
        onClick={expandable ? onToggle : undefined}
        style={{
          cursor: expandable ? "pointer" : "default",
          background: highlighted ? `${colors.accent}1A` : undefined,
          transition: "background 0.4s ease",
        }}
      >
        <td style={{ padding: "12px", borderBottom: `1px solid ${colors.border}` }}>
          <span style={{ fontSize: 14, color: colors.textBase, fontWeight: 500 }}>{ind.label}</span>
        </td>
        <td style={{ padding: "12px", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
            <ValueCell ind={lockedInd} />
            {expandable &&
              (isOpen ? (
                <CaretDownOutlined style={{ fontSize: 10, color: colors.textHint }} />
              ) : (
                <CaretRightOutlined style={{ fontSize: 10, color: colors.textHint }} />
              ))}
          </span>
        </td>
        <td style={{ padding: "12px", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>
          {ind.type === "numeric" && !locked ? (
            <span style={{ fontSize: 13, color: colors.textSub, fontVariantNumeric: "tabular-nums" }}>{ind.yoy ?? "—"}</span>
          ) : locked ? (
            <LockOutlined style={{ color: colors.textHint, fontSize: 12 }} />
          ) : (
            <span style={{ color: colors.textHint }}></span>
          )}
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={3} style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bgPage, padding: "14px 16px" }}>
            {ind.subs?.length ? (
              <SubDetail ind={ind} />
            ) : multiTrend && trend ? (
              <>
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
                </div>
              </>
            ) : null}
          </td>
        </tr>
      )}
    </>
  );
}

// sub컬럼 상세 — 수치형은 sub별 막대, 도입형은 sub별 도입 현황 칩
function SubDetail({ ind }: { ind: DetailIndicator }) {
  // 도입형은 대표(total) 제외하고 실제 항목만 칩으로 (수치형은 합계 막대 유지)
  const subs = (ind.subs ?? []).filter((s) => (ind.type === "boolean" ? s.code !== "total" : true));
  if (ind.type === "numeric") {
    const data = subs.map((s) => ({ name: s.name, value: s.value ?? 0, na: s.value === null }));
    return (
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSub, marginBottom: 8 }}>
          세부 항목별 값{ind.unit ? ` (${ind.unit})` : ""}
        </div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEE" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.textSub }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: colors.textSub }} tickLine={false} width={56} />
              <RTooltip formatter={(v) => [Number(v).toLocaleString("ko-KR"), ind.label]} />
              <Bar dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {data.some((d) => d.na) && (
          <div style={{ fontSize: 11.5, color: colors.textHint, marginTop: 6 }}>
            · 표시: 비공개(미공시) 항목은 0으로 표기
          </div>
        )}
      </div>
    );
  }
  // boolean: sub별 도입 현황 칩
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSub, marginBottom: 10 }}>세부 항목별 현황</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {subs.map((s) => {
          const adopted = s.state === "adopted";
          const notAdopted = s.state === "not_adopted";
          const tone = adopted
            ? { bg: `${colors.accent}14`, fg: colors.accent, mark: "✓" }
            : notAdopted
              ? { bg: colors.bgPage, fg: colors.textSub, mark: "" }
              : { bg: colors.bgPage, fg: colors.textHint, mark: "" };
          return (
            <span
              key={s.code}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                background: tone.bg,
                color: tone.fg,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: "4px 11px",
              }}
            >
              <span style={{ fontWeight: 600 }}>{s.name}</span>
              <span>{adopted ? `${tone.mark} 도입` : notAdopted ? "미도입" : "비공개"}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
