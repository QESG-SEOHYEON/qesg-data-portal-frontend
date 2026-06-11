// 검색 후 결과 요약 — 탭(전체|기업|지표|뉴스|공시) + 카드/리스트.
import { useState } from "react";
import { useNavigate } from "react-router";
import { searchMock } from "@/mock/search";
import {
  getEsgNews,
  getRecentDisclosures,
  NEWS_THEME_LABELS,
  DOC_TYPE_LABELS,
  DOC_TYPE_SHORT,
} from "@/mock/landing";
import type { EsgNewsItem, DisclosureDocRow } from "@/mock/landing";
import { getCompanyCardMeta } from "@/mock/companyDetail";
import { BULK_COMPANIES } from "@/mock/bulkData";
import { colors, categoryColors } from "@/theme/tokens";

type Tab = "all" | "company" | "indicator" | "news" | "disclosure";

export function ResultsSummary({
  query,
  onOpenCompany,
  onOpenTable,
}: {
  query: string;
  onOpenCompany: (id: string) => void;
  onOpenTable: (indicatorId?: string) => void;
}) {
  const navigate = useNavigate();
  const result = searchMock(query, "all");
  const q = query.trim();
  const news = getEsgNews()
    .filter(
      (n) =>
        q === "" ||
        n.title.includes(q) ||
        n.body.includes(q) ||
        n.companies.some((c) => c.includes(q)),
    )
    .slice(0, 4);
  const disclosures = getRecentDisclosures()
    .filter((d) => q === "" || d.company.includes(q) || d.stockCode.includes(q))
    .slice(0, 6);

  // 결과 없을 때 보여줄 최근 데이터(검색어 무관)
  const recentNews = [...getEsgNews()].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4);
  const recentDisclosures = getRecentDisclosures().slice(0, 6);

  // 관련 기업 태그 클릭 → 그 기업으로 (이름→종목코드 매핑, 없으면 검색)
  function openCompanyByName(name: string) {
    const hit = BULK_COMPANIES.find((c) => c.name === name);
    if (hit) navigate(`/company/${hit.id}`);
    else navigate(`/bulk?q=${encodeURIComponent(name)}`);
  }

  const counts = {
    company: result.companies.length,
    indicator: result.indicators.length,
    news: news.length,
    disclosure: disclosures.length,
  };
  const [tab, setTab] = useState<Tab>("all");

  const TABS: { key: Tab; label: string; n?: number }[] = [
    { key: "all", label: "전체" },
    { key: "company", label: "기업", n: counts.company },
    { key: "indicator", label: "지표", n: counts.indicator },
    { key: "news", label: "뉴스", n: counts.news },
    { key: "disclosure", label: "공시", n: counts.disclosure },
  ];

  const showCompany = tab === "all" || tab === "company";
  const showIndicator = tab === "all" || tab === "indicator";
  const showNews = tab === "all" || tab === "news";
  const showDisc = tab === "all" || tab === "disclosure";

  // 현재 탭에 보여줄 결과가 하나도 없는가 (전체 탭은 4종 합산)
  const tabEmpty =
    tab === "all"
      ? counts.company + counts.indicator + counts.news + counts.disclosure === 0
      : tab === "company"
        ? counts.company === 0
        : tab === "indicator"
          ? counts.indicator === 0
          : tab === "news"
            ? counts.news === 0
            : counts.disclosure === 0;

  return (
    <div>
      {/* 탭 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 20, flex: 1, overflowX: "auto" }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "10px 2px",
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  color: active ? colors.textBase : colors.textSub,
                  borderBottom: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
                {t.n !== undefined && (
                  <span style={{ marginLeft: 6, color: colors.textHint, fontWeight: 600 }}>
                    {t.n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 결과 없음 — 상단 안내 + 최근 ESG 뉴스/공시 위젯(둘러보기) */}
      {tabEmpty && (
        <>
          <div
            style={{
              background: colors.bgSurface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: "44px 20px",
              textAlign: "center",
              color: colors.textSub,
              fontSize: 14,
              marginBottom: 28,
            }}
          >
            "{query}" 검색 결과가 없습니다. 위 검색창에서 다시 시도해보세요.
          </div>
          {recentNews.length > 0 && (
            <Section title="최근 ESG 뉴스">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {recentNews.map((n) => (
                  <NewsCard key={n.id} n={n} query="" onCompany={openCompanyByName} />
                ))}
              </div>
            </Section>
          )}
          {recentDisclosures.length > 0 && (
            <Section title="최근 공시">
              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden", background: colors.bgSurface }}>
                {recentDisclosures.map((d, i) => (
                  <DisclosureRow key={`${d.stockCode}-${d.docType}`} d={d} first={i === 0} />
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11.5, color: colors.textHint }}>
                원문 링크로 직접 확인 (파일 다운로드 미제공)
              </div>
            </Section>
          )}
        </>
      )}

      {/* 기업 결과 */}
      {showCompany && counts.company > 0 && (
        <Section title={`기업 검색 결과 ${counts.company}개`}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {result.companies.map((c) => {
              const meta = getCompanyCardMeta(c.id);
              return (
                <Card key={c.id} onClick={() => onOpenCompany(c.id)}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <strong style={{ fontSize: 14.5, color: colors.textBase }}>{c.label}</strong>
                    <span
                      style={{
                        fontSize: 12,
                        color: colors.textSub,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {c.id}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Chip tone={CHIP_TONES.sector}>{meta.sector}</Chip>
                    <Chip tone={CHIP_TONES.market}>{meta.market}</Chip>
                    <Chip tone={CHIP_TONES.size}>{meta.size}</Chip>
                    {meta.srPublished && <Chip tone={CHIP_TONES.sr}>지속가능경영보고서 발간</Chip>}
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* 지표 결과 */}
      {showIndicator && counts.indicator > 0 && (
        <Section title={`지표 검색 결과 ${counts.indicator}개`}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {result.indicators.map((ind) => {
              const meta = categoryColors[ind.category];
              return (
                <Card key={ind.id} onClick={() => onOpenTable(ind.id)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        background: meta.bg,
                        color: meta.fg,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {ind.category}
                    </span>
                    <strong style={{ fontSize: 13.5, color: colors.textBase }}>{ind.label}</strong>
                  </span>
                  <span style={{ fontSize: 12, color: colors.primary, fontWeight: 600 }}>
                    표에서 비교 →
                  </span>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* 뉴스 — 2열 카드 (카테고리·날짜·매체 / 제목 / 본문 발췌+키워드 / 관련 기업 / 카드=원문) */}
      {showNews && news.length > 0 && (
        <Section title={`ESG 뉴스 ${counts.news}개`}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {news.map((n) => (
              <NewsCard key={n.id} n={n} query={q} onCompany={openCompanyByName} />
            ))}
          </div>
        </Section>
      )}

      {/* 공시 — 리스트(문서). 문서종류 태그 · 기업 · 문서명+연도 · 등록일, 행=원문 */}
      {showDisc && disclosures.length > 0 && (
        <Section title={`공시 ${counts.disclosure}개`}>
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              overflow: "hidden",
              background: colors.bgSurface,
            }}
          >
            {disclosures.map((d, i) => (
              <DisclosureRow key={`${d.stockCode}-${d.docType}`} d={d} first={i === 0} />
            ))}
          </div>
        </Section>
      )}

    </div>
  );
}

// 공시 문서 행 — 문서종류 태그 + 기업 + 문서명·연도 + 등록일. 행 전체 클릭 → 원문(다운로드 X)
const DOC_TONES: Record<DisclosureDocRow["docType"], { bg: string; fg: string }> = {
  sr: { bg: "#E9F3EF", fg: "#3E6B5C" },
  business: { bg: "#EEF3F8", fg: "#3F5E7A" },
  governance: { bg: "#F2EFF8", fg: "#5A4F86" },
};

function DisclosureRow({ d, first }: { d: DisclosureDocRow; first: boolean }) {
  const tone = DOC_TONES[d.docType];
  return (
    <a
      href={d.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgPage)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        textDecoration: "none",
        borderTop: first ? "none" : `1px solid ${colors.border}`,
      }}
    >
      <span
        style={{
          width: 64,
          flexShrink: 0,
          textAlign: "center",
          background: tone.bg,
          color: tone.fg,
          fontSize: 11,
          fontWeight: 700,
          padding: "3px 0",
          borderRadius: 4,
        }}
      >
        {DOC_TYPE_SHORT[d.docType]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.textBase }}>
          {d.company}
          <span
            style={{
              fontSize: 12,
              color: colors.textSub,
              fontWeight: 400,
              marginLeft: 6,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {d.stockCode}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: colors.textSub }}>
          {DOC_TYPE_LABELS[d.docType]} {d.year}
        </div>
      </div>
      <span
        style={{
          fontSize: 12,
          color: colors.textHint,
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {d.disclosedAt}
      </span>
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: colors.textBase, marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// 뉴스 카드 — 본문에서 검색어 대목 발췌 + 하이라이트(원문 그대로, AI 요약 아님)
function themeTone(theme: EsgNewsItem["theme"]): { bg: string; fg: string } {
  if (theme === "policy") return { bg: "#EEF1F4", fg: colors.textSub };
  return categoryColors[theme];
}
function excerptParts(body: string, q: string): { t: string; hl: boolean }[] {
  const query = q.trim();
  let idx = -1;
  let key = query;
  if (query) {
    idx = body.indexOf(query);
    if (idx === -1) {
      const first = query.split(/\s+/)[0];
      if (first && first !== query) {
        idx = body.indexOf(first);
        key = first;
      }
    }
  }
  if (idx === -1) {
    return [{ t: body.length > 100 ? body.slice(0, 100) + "…" : body, hl: false }];
  }
  const start = Math.max(0, idx - 26);
  const end = idx + key.length + 64;
  return [
    { t: (start > 0 ? "…" : "") + body.slice(start, idx), hl: false },
    { t: body.slice(idx, idx + key.length), hl: true },
    { t: body.slice(idx + key.length, end) + (end < body.length ? "…" : ""), hl: false },
  ];
}

function NewsCard({
  n,
  query,
  onCompany,
}: {
  n: EsgNewsItem;
  query: string;
  onCompany: (name: string) => void;
}) {
  const tone = themeTone(n.theme);
  const parts = excerptParts(n.body, query);
  return (
    <a
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
        background: colors.bgSurface,
      }}
    >
      {/* 카테고리 · 날짜 · 매체 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span
          style={{
            background: tone.bg,
            color: tone.fg,
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
          }}
        >
          {NEWS_THEME_LABELS[n.theme]}
        </span>
        <span style={{ fontSize: 11.5, color: colors.textHint }}>{n.date}</span>
        <span style={{ fontSize: 11.5, color: colors.textHint }}>· {n.source}</span>
      </div>

      {/* 제목 */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: colors.textBase,
          lineHeight: 1.4,
          marginBottom: 6,
        }}
      >
        {n.title}
      </div>

      {/* 본문 발췌 + 키워드 하이라이트 */}
      <div
        style={{
          fontSize: 12.5,
          color: colors.textSub,
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {parts.map((p, i) =>
          p.hl ? (
            <mark
              key={i}
              style={{
                background: "#FFF3C4",
                color: colors.textBase,
                padding: "0 1px",
                borderRadius: 2,
              }}
            >
              {p.t}
            </mark>
          ) : (
            <span key={i}>{p.t}</span>
          ),
        )}
      </div>

      {/* 관련 기업 태그 */}
      {n.companies.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {n.companies.map((name) => (
            <span
              key={name}
              role="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCompany(name);
              }}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: colors.textSub,
                background: colors.bgPage,
                border: `1px solid ${colors.border}`,
                padding: "2px 8px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

// 속성별 칩 톤 — 서로 구분되되 모두 낮은 채도(우열/좋고나쁨 암시 색 아님)
const CHIP_TONES = {
  sector: { bg: "#EEF3F8", fg: "#3F5E7A" },
  market: { bg: "#F2EFF8", fg: "#5A4F86" },
  size: { bg: "#F4F1EA", fg: "#6E5A36" },
  sr: { bg: "#E9F3EF", fg: "#3E6B5C" },
};

function Chip({ tone, children }: { tone: { bg: string; fg: string }; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color: tone.fg,
        background: tone.bg,
        padding: "2px 8px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.primary)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: 14,
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      {children}
    </div>
  );
}
