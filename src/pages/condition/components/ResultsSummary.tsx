// 검색 후 결과 요약 — 탭(전체|기업|지표|뉴스|공시) + 카드/리스트. "표로 비교"로 대량 테이블 전환.
import { useState } from "react";
import { Button } from "antd";
import { TableOutlined, LinkOutlined } from "@ant-design/icons";
import { searchMock } from "@/mock/search";
import { getEsgNews } from "@/mock/landing";
import { getRecentSrDisclosures } from "@/mock/landing";
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
  const result = searchMock(query, "all");
  const q = query.trim();
  const news = getEsgNews().filter((n) => n.title.includes(q) || q === "").slice(0, 4);
  const disclosures = getRecentSrDisclosures().slice(0, 4);

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

  return (
    <div>
      {/* 탭 + 표로비교 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${colors.border}`, marginBottom: 18, flexWrap: "wrap" }}>
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
                {t.n !== undefined && <span style={{ marginLeft: 6, color: colors.textHint, fontWeight: 600 }}>{t.n}</span>}
              </button>
            );
          })}
        </div>
        <Button type="primary" icon={<TableOutlined />} onClick={() => onOpenTable()}>
          표로 비교
        </Button>
      </div>

      {/* 기업 결과 */}
      {showCompany && counts.company > 0 && (
        <Section title={`기업 검색 결과 ${counts.company}개`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {result.companies.map((c) => (
              <Card key={c.id} onClick={() => onOpenCompany(c.id)}>
                <strong style={{ fontSize: 14, color: colors.textBase }}>{c.label}</strong>
                <span style={{ fontSize: 12, color: colors.textSub }}>{c.id}</span>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* 지표 결과 */}
      {showIndicator && counts.indicator > 0 && (
        <Section title={`지표 검색 결과 ${counts.indicator}개`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {result.indicators.map((ind) => {
              const meta = categoryColors[ind.category];
              return (
                <Card key={ind.id} onClick={() => onOpenTable(ind.id)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ background: meta.bg, color: meta.fg, fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{ind.category}</span>
                    <strong style={{ fontSize: 13.5, color: colors.textBase }}>{ind.label}</strong>
                  </span>
                  <span style={{ fontSize: 12, color: colors.primary, fontWeight: 600 }}>표에서 비교 →</span>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* 뉴스 */}
      {showNews && news.length > 0 && (
        <Section title={`ESG 뉴스 ${counts.news}개`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {news.map((n) => (
              <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none" }}>
                <span style={{ fontSize: 12, color: colors.textHint, width: 86, flexShrink: 0 }}>{n.date}</span>
                <span style={{ flex: 1, fontSize: 13.5, color: colors.textBase, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</span>
                <span style={{ fontSize: 12, color: colors.primary }}>원문 <LinkOutlined style={{ fontSize: 10 }} /></span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* 공시 */}
      {showDisc && disclosures.length > 0 && (
        <Section title={`공시 ${counts.disclosure}개`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {disclosures.map((d) => (
              <a key={d.stockCode} href={d.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none" }}>
                <span style={{ fontSize: 12, color: colors.textHint, width: 86, flexShrink: 0 }}>{d.disclosedAt}</span>
                <span style={{ flex: 1, fontSize: 13.5, color: colors.textBase }}>{d.company} 지속가능경영보고서</span>
                <span style={{ fontSize: 12, color: colors.primary }}>원문 <LinkOutlined style={{ fontSize: 10 }} /></span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {counts.company === 0 && counts.indicator === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", color: colors.textHint }}>
          "{query}" 검색 결과가 없습니다. 위 검색창에서 다시 시도하거나 표로 직접 둘러보세요.
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.textBase, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
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
