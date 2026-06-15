// 기업 관련 뉴스 (개별 기업 페이지) — 이 기업이 언급된 ESG 뉴스. 없으면 최신 ESG 뉴스로 폴백.
// 데이터 경계: mock/landing.ts:getEsgNews(). 카드 = 테마·날짜·출처 + 원문 링크.
import { useMemo } from "react";
import { LinkOutlined } from "@ant-design/icons";
import { getEsgNews, NEWS_THEME_LABELS } from "@/mock/landing";
import type { NewsTheme } from "@/mock/landing";
import { colors, categoryColors } from "@/theme/tokens";

function themeColor(t: NewsTheme): { bg: string; fg: string } {
  if (t === "policy") return { bg: "#EEF1F4", fg: colors.textSub };
  return { bg: categoryColors[t].bg, fg: categoryColors[t].fg };
}

export function CompanyNews({ name }: { name: string }) {
  const all = useMemo(() => getEsgNews(), []);
  const related = useMemo(
    () => all.filter((n) => n.companies.includes(name)).slice(0, 4),
    [all, name],
  );
  const fallback = related.length === 0;
  const items = useMemo(
    () => (fallback ? [...all].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3) : related),
    [all, related, fallback],
  );

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textBase }}>
          기업 관련 뉴스
        </h2>
        <span style={{ fontSize: 12.5, color: colors.textHint }}>{name} ESG 뉴스</span>
      </div>
      <div style={{ fontSize: 11.5, color: colors.textHint, marginBottom: 14 }}>
        {fallback
          ? "이 기업이 직접 언급된 뉴스는 아직 없어요. 최신 ESG 뉴스를 보여드립니다."
          : "공개 매체에서 이 기업이 언급된 ESG 관련 기사입니다."}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((n) => {
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
                background: colors.bgSurface,
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
                  marginBottom: 8,
                }}
              >
                {n.body}
              </div>
              <span style={{ fontSize: 12, color: colors.primary, fontWeight: 600 }}>
                원문 <LinkOutlined style={{ fontSize: 10 }} />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
