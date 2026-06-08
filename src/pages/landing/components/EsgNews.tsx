// ESG 뉴스 (크롤링 데이터) — 테마/날짜(일주일) 필터 + 언급 기업 태그 + 원문 링크
// theVC '많이 본 뉴스'를 참고하되 구성은 우리 식: E/S/G·정책 테마 탭 + 7일 날짜 칩 + 카드.
import { useMemo, useState } from "react";
import { RightOutlined } from "@ant-design/icons";
import { getEsgNews, NEWS_THEME_LABELS } from "@/mock/landing";
import type { NewsTheme } from "@/mock/landing";
import { colors, categoryColors } from "@/theme/tokens";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Section } from "./Section";
import { LoginModal } from "./LoginModal";

type ThemeKey = "all" | NewsTheme;
const THEME_TABS: { key: ThemeKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "E", label: "환경" },
  { key: "S", label: "사회" },
  { key: "G", label: "지배구조" },
  { key: "policy", label: "정책/규제" },
];
const NEWS_BASE = new Date(2026, 5, 8); // 기준일 2026-06-08
const LOGO_PALETTE = ["#3D5A80", "#0F8A6A", "#185FA5", "#6E5A36", "#534AB7"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function themeColor(t: NewsTheme): { bg: string; fg: string } {
  if (t === "policy") return { bg: "#EEF1F4", fg: colors.textSub };
  return { bg: categoryColors[t].bg, fg: categoryColors[t].fg };
}

// 언급 기업 태그 (첫 기업 + 외 N)
function CompanyTag({ companies }: { companies: string[] }) {
  if (companies.length === 0)
    return <span style={{ fontSize: 12, color: colors.textHint }}>정책·규제</span>;
  const first = companies[0];
  const rest = companies.length - 1;
  let h = 0;
  for (let i = 0; i < first.length; i++) h = (h * 31 + first.charCodeAt(i)) >>> 0;
  const color = LOGO_PALETTE[h % LOGO_PALETTE.length];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: color,
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {first.slice(0, 1)}
      </span>
      <span
        style={{
          fontSize: 12,
          color: colors.textBase,
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {first}
      </span>
      {rest > 0 && (
        <span style={{ fontSize: 11, color: colors.textSub, flexShrink: 0 }}>+{rest}</span>
      )}
    </span>
  );
}

// date 필터: "YYYY-MM-DD" 특정일 | "popular"(최근 일주일 조회순)
type DateKey = string;

export function EsgNews() {
  const bp = useBreakpoint();
  const oneCol = bp === "mobile"; // 좁아져 2열이 깨지면 1열
  const pageSize = oneCol ? 2 : 4; // 1열일 땐 페이지당 2개(페이지 증설)
  const [theme, setTheme] = useState<ThemeKey>("all");
  const [loginOpen, setLoginOpen] = useState(false);

  const all = useMemo(() => getEsgNews(), []);

  // 날짜탭: 오늘 → 하루 전 … 일주일 (최신순), 마지막에 '조회순'
  const week = useMemo(() => {
    const arr: { date: string; mmdd: string; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(NEWS_BASE);
      d.setDate(d.getDate() - i);
      arr.push({
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        mmdd: `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`,
        isToday: i === 0,
      });
    }
    return arr;
  }, []);
  const weekSet = useMemo(() => new Set(week.map((w) => w.date)), [week]);

  const [date, setDate] = useState<DateKey>(week[0].date); // 기본: 오늘
  const [page, setPage] = useState(0);

  const byTheme = all.filter((n) => theme === "all" || n.theme === theme);
  const filtered =
    date === "popular"
      ? byTheme.filter((n) => weekSet.has(n.date)).sort((a, b) => b.views - a.views) // 최근 일주일 조회순
      : byTheme.filter((n) => n.date === date);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const shown = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const reset = (fn: () => void) => () => {
    fn();
    setPage(0);
  };

  return (
    <Section
      title="ESG 뉴스"
      extra={
        <span
          style={{ color: colors.primary, fontWeight: 600, cursor: "pointer" }}
          onClick={() => setLoginOpen(true)}
        >
          더 보기 <RightOutlined style={{ fontSize: 11 }} />
        </span>
      }
    >
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 18,
        }}
      >
        {/* 테마 탭 */}
        <div
          style={{
            display: "flex",
            gap: 22,
            borderBottom: `1px solid ${colors.border}`,
            marginBottom: 14,
            overflowX: "auto",
          }}
        >
          {THEME_TABS.map((t) => {
            const active = theme === t.key;
            return (
              <button
                key={t.key}
                onClick={reset(() => setTheme(t.key))}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "12px 2px",
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  color: active ? colors.textBase : colors.textSub,
                  borderBottom: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 날짜 칩: 오늘(MM.DD) → 하루 전 … 일주일, 마지막에 전체 -> 로그인 */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14 }}>
          {week.map((w) => (
            <DateChip
              key={w.date}
              label={w.isToday ? `오늘 (${w.mmdd})` : w.mmdd}
              active={date === w.date}
              onClick={reset(() => setDate(w.date))}
            />
          ))}
          <DateChip
            label="최근 일주일"
            active={date === "popular"}
            onClick={reset(() => setDate("popular"))}
          />
        </div>

        {/* 뉴스 카드 그리드 */}
        {shown.length === 0 ? (
          <div
            style={{ padding: "32px 0", textAlign: "center", color: colors.textHint, fontSize: 13 }}
          >
            해당 조건의 뉴스가 없습니다
          </div>
        ) : (
          <div
            style={{ display: "grid", gridTemplateColumns: oneCol ? "1fr" : "1fr 1fr", gap: 12 }}
          >
            {shown.map((n) => {
              const tc = themeColor(n.theme);
              return (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
                  style={{
                    display: "block",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    padding: 14,
                    textDecoration: "none",
                    transition: "border-color 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        background: tc.bg,
                        color: tc.fg,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                      }}
                    >
                      {NEWS_THEME_LABELS[n.theme]}
                    </span>
                    <span style={{ fontSize: 12, color: colors.textHint }}>{n.date}</span>
                    <span style={{ fontSize: 12, color: colors.textHint, marginLeft: "auto" }}>
                      {n.source}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: colors.textBase,
                      lineHeight: 1.4,
                      marginBottom: 6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: colors.textSub,
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      marginBottom: 10,
                    }}
                  >
                    {n.summary}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CompanyTag companies={n.companies} />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {pages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: 14,
            }}
          >
            <button
              onClick={() => setPage((p) => (p + 1) % pages)}
              style={{
                border: "none",
                background: "transparent",
                color: colors.textSub,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              다음 페이지 보기
            </button>
            <span style={{ fontSize: 13, color: colors.textHint }}>
              {safePage + 1} / {pages}
            </span>
          </div>
        )}
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Section>
  );
}

function DateChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        border: `1px solid ${active ? colors.primary : colors.border}`,
        background: active ? colors.primary : colors.bgSurface,
        color: active ? "#fff" : colors.textSub,
        fontSize: 14,
        fontWeight: 600,
        padding: "10px 18px",
        borderRadius: 10,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
