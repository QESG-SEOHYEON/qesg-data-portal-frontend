// DataCatalog (랜딩 명세 2.5, 축① 구체화) — E/S/G 지표 카드 그리드
// 카드 메타 3종: 출처 뱃지 · 보유 연도 · 커버리지(기업 수). 내부코드 비노출.
// 맛보기: 그룹당 CATALOG_PREVIEW_PER_CATEGORY 개만 노출 → 하단 "더 보기"가 로그인 유도.
import { useState } from "react";
import { RightOutlined } from "@ant-design/icons";
import type { Category } from "@/types";
import { getCatalog, toSourceCode, CATALOG_PREVIEW_PER_CATEGORY } from "@/mock/landing";
import type { CatalogItem } from "@/mock/landing";
import { colors, categoryColors } from "@/theme/tokens";
import { SOURCES, sourceBadgeColors } from "@/mock/sources";
import { Section } from "./Section";
import { Marquee } from "./Marquee";
import { LoginModal } from "./LoginModal";

const CATEGORIES: Category[] = ["E", "S", "G"];
// 카테고리별 마퀴 속도(초) — 약간씩 다르게 둬서 줄이 동기화돼 보이지 않게
const MARQUEE_DUR: Record<Category, number> = { E: 38, S: 46, G: 34 };

function SourceTag({ label }: { label: string }) {
  const code = toSourceCode(label);
  const c = sourceBadgeColors[code];
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 6px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
      title={SOURCES[code].label}
    >
      {label}
    </span>
  );
}

function Card({ item, onClick }: { item: CatalogItem; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.primary)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
      style={{
        width: 240,
        minHeight: 132,
        flexShrink: 0,
        background: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textBase, lineHeight: 1.4 }}>
        {item.label}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {item.sources.map((s) => (
          <SourceTag key={s} label={s} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: colors.textSub,
          marginTop: "auto",
        }}
      >
        <span>{item.years}</span>
        <span style={{ fontWeight: 600 }}>{item.coverage}</span>
      </div>
    </div>
  );
}

export function DataCatalog() {
  const [loginOpen, setLoginOpen] = useState(false);
  const catalog = getCatalog();

  return (
    <Section title="ESG 테마별 데이터 조회">
      {CATEGORIES.map((cat) => {
        const meta = categoryColors[cat];
        const all = catalog.filter((c) => c.category === cat);
        const shown = all.slice(0, CATALOG_PREVIEW_PER_CATEGORY);

        return (
          <div key={cat} style={{ marginBottom: 28 }}>
            {/* 그룹 헤더: E/S/G 색 뱃지 + N개 지표 (전체 규모를 먼저 각인) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  background: meta.bg,
                  color: meta.fg,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 6,
                }}
              >
                {meta.name}
              </span>
              <span style={{ fontSize: 13, color: colors.textSub }}>{all.length}개 지표</span>
            </div>

            {/* 카드가 좌→우로 흐르는 마퀴 (hover 시 일시정지). 클릭 → 로그인 유도 */}
            <Marquee direction="ltr" durationSec={MARQUEE_DUR[cat]}>
              {shown.map((item) => (
                <Card key={item.label} item={item} onClick={() => setLoginOpen(true)} />
              ))}
            </Marquee>
          </div>
        );
      })}

      {/* 더 보기 → 로그인 유도 (맛보기 잠금의 funnel 버전) */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <button
          onClick={() => setLoginOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "12px 22px",
            borderRadius: 24,
            border: `1px solid ${colors.border}`,
            background: colors.bgSurface,
            color: colors.textBase,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ESG 지표 더 보기
          <RightOutlined style={{ fontSize: 12 }} />
        </button>
      </div>

      {/* 로그인 유도 모달 (2단: 로그인 폼 + 가입 혜택) */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Section>
  );
}
