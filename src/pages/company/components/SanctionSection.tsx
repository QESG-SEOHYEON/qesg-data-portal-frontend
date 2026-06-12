// 법규위반·제재 내역 (개별 기업) — 테마별 건수 + 필터 + 사건 리스트.
// ⚠️ 안전선: 제재 건수로 우열·등급·투자 판단 금지. 가치색 금지. 근거법령·처분기관 명시(공시 사실). 면책 필수.
import { useMemo, useState } from "react";
import { Select } from "antd";
import { LinkOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import { getSanctions, SANCTION_THEMES, themeOf } from "@/mock/sanctions";
import type { Sanction } from "@/mock/sanctions";
import type { ViewerPlan } from "@/types";
import { CAN, lockCta } from "@/mock/accessRules";
import { Locked } from "@/components/Locked";
import { colors } from "@/theme/tokens";

const PREVIEW = 8;

export function SanctionSection({
  companyId,
  tier,
  onLocked,
}: {
  companyId: string;
  tier: ViewerPlan;
  onLocked?: () => void;
}) {
  const all = useMemo(() => getSanctions(companyId), [companyId]);
  const canDetail = CAN(tier, "sanctionDetail"); // 비회원: 건수만, 상세 잠금
  const [theme, setTheme] = useState<string | undefined>();
  const [penalty, setPenalty] = useState<string | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [order, setOrder] = useState<"new" | "old">("new");
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of all) m[s.themeKey] = (m[s.themeKey] ?? 0) + 1;
    return m;
  }, [all]);

  const penaltyTypes = useMemo(() => Array.from(new Set(all.map((s) => s.penaltyType))), [all]);
  const years = all.map((s) => s.year);
  const yearOptions = useMemo(
    () => Array.from(new Set(years)).sort((a, b) => b - a),
    [years],
  );
  const period = years.length ? `FY${Math.min(...years)}~${Math.max(...years)}` : "FY2023~2025";

  const filtered = useMemo(() => {
    let list = all.filter(
      (s) =>
        (!theme || s.themeKey === theme) &&
        (!penalty || s.penaltyType === penalty) &&
        (!year || s.year === year),
    );
    list = [...list].sort((a, b) =>
      order === "new" ? (a.date < b.date ? 1 : -1) : a.date < b.date ? -1 : 1,
    );
    return list;
  }, [all, theme, penalty, year, order]);

  const shown = showAll ? filtered : filtered.slice(0, PREVIEW);

  return (
    <section id="sanctions" style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textBase }}>
          법규위반·제재 내역
        </h2>
        <span style={{ fontSize: 12.5, color: colors.textHint }}>{period}</span>
      </div>
      <div style={{ fontSize: 11.5, color: colors.textHint, marginBottom: 14 }}>
        공시·수집된 제재 사실의 집계입니다. 우열·등급·투자 판단이 아닙니다.
      </div>

      {all.length === 0 ? (
        <div
          style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: "32px 20px",
            textAlign: "center",
            color: colors.textSub,
            fontSize: 13.5,
          }}
        >
          공시·수집된 법규위반·제재 내역이 없습니다.
        </div>
      ) : (
        <div
          style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          {/* 테마별 건수 칩 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span
              style={{ fontSize: 13, fontWeight: 700, color: colors.textBase, alignSelf: "center" }}
            >
              전체 {all.length}건
            </span>
            {SANCTION_THEMES.filter((t) => counts[t.key]).map((t) => (
              <span
                key={t.key}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  background: t.tone.bg,
                  color: t.tone.fg,
                  padding: "3px 9px",
                  borderRadius: 12,
                }}
              >
                {t.label} {counts[t.key]}
              </span>
            ))}
          </div>

          {!canDetail ? (
            <Locked cta={lockCta(tier)} onClick={onLocked}>
              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
                {all.slice(0, PREVIEW).map((s, i) => (
                  <SanctionRow key={s.id} s={s} first={i === 0} open={false} onToggle={() => {}} />
                ))}
              </div>
            </Locked>
          ) : (
          <>
          {/* 필터 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <Select
              size="small"
              allowClear
              placeholder="테마"
              style={{ width: 130 }}
              value={theme}
              onChange={setTheme}
              options={SANCTION_THEMES.filter((t) => counts[t.key]).map((t) => ({
                value: t.key,
                label: t.label,
              }))}
            />
            <Select
              size="small"
              allowClear
              placeholder="처벌구분"
              style={{ width: 120 }}
              value={penalty}
              onChange={setPenalty}
              options={penaltyTypes.map((p) => ({ value: p, label: p }))}
            />
            <Select
              size="small"
              allowClear
              placeholder="위반연도"
              style={{ width: 110 }}
              value={year}
              onChange={setYear}
              options={yearOptions.map((y) => ({ value: y, label: `FY${y}` }))}
            />
            <Select
              size="small"
              style={{ width: 110 }}
              value={order}
              onChange={setOrder}
              options={[
                { value: "new", label: "최신순" },
                { value: "old", label: "오래된순" },
              ]}
            />
          </div>

          {/* 사건 리스트 */}
          <div
            style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}
          >
            {shown.map((s, i) => (
              <SanctionRow
                key={s.id}
                s={s}
                first={i === 0}
                open={open === s.id}
                onToggle={() => setOpen(open === s.id ? null : s.id)}
              />
            ))}
          </div>

          {filtered.length > PREVIEW && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <a
                style={{ fontSize: 12.5, color: colors.primary, cursor: "pointer" }}
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "접기" : `전체 ${filtered.length}건 중 ${PREVIEW}건 표시 — 전체 보기`}
              </a>
            </div>
          )}
          </>
          )}
          <div style={{ marginTop: 10, fontSize: 11.5, color: colors.textHint }}>
            각 건의 근거법령·처분기관은 공시된 사실이며, 원문 링크로 확인할 수 있습니다.
          </div>
        </div>
      )}
    </section>
  );
}

function SanctionRow({
  s,
  first,
  open,
  onToggle,
}: {
  s: Sanction;
  first: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const tone = themeOf(s.themeKey)?.tone ?? { bg: colors.bgPage, fg: colors.textSub };
  return (
    <div style={{ borderTop: first ? "none" : `1px solid ${colors.border}` }}>
      <div
        onClick={onToggle}
        onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgPage)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: colors.textHint,
            width: 84,
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {s.date}
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            background: tone.bg,
            color: tone.fg,
            padding: "2px 8px",
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          {s.theme}
        </span>
        <span style={{ fontSize: 12, color: colors.textSub, flexShrink: 0 }}>{s.penaltyType}</span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            color: colors.textBase,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {s.reason}
        </span>
        {open ? (
          <DownOutlined style={{ fontSize: 10, color: colors.textHint }} />
        ) : (
          <RightOutlined style={{ fontSize: 10, color: colors.textHint }} />
        )}
      </div>
      {open && (
        <div
          style={{
            padding: "0 12px 12px 106px",
            fontSize: 12.5,
            color: colors.textSub,
            lineHeight: 1.7,
          }}
        >
          <div>위반일자: {s.date} (위반연도 FY{s.year})</div>
          <div>
            처분기관: {s.agency} · 대상: {s.target}
          </div>
          <div>처벌/조치: {s.penaltyDetail}</div>
          <div>근거법령: {s.law}</div>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: colors.primary, fontWeight: 600 }}
          >
            원문 보기 <LinkOutlined style={{ fontSize: 10 }} />
          </a>
        </div>
      )}
    </div>
  );
}
