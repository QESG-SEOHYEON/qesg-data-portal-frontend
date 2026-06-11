// 검색 전 — 검색 도우미. 큰 검색창(자동완성) + 키워드 바로가기 + 카테고리 지표 칩.
// 통합 검색 = 키워드 검색(문장형 질의는 AI 워크벤치). 평가·순위 표현 없음.
import { useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { KEYWORD_EXAMPLES } from "@/mock/indicatorSearch";
import { colors } from "@/theme/tokens";
import { SearchWidget } from "@/pages/search/components/SearchWidget";
import { CategoryBrowse } from "./CategoryBrowse";

// 키워드 칩을 4개씩 페이지로 묶어 위/아래로 넘기듯 회전
const KW_PER_PAGE = 4;
const KW_PAGES: (typeof KEYWORD_EXAMPLES)[] = [];
for (let i = 0; i < KEYWORD_EXAMPLES.length; i += KW_PER_PAGE) {
  KW_PAGES.push(KEYWORD_EXAMPLES.slice(i, i + KW_PER_PAGE));
}

export function SearchEntry({ onKeyword }: { onKeyword: (term: string) => void }) {
  const [kwPage, setKwPage] = useState(0);
  const [kwPaused, setKwPaused] = useState(false);
  useEffect(() => {
    if (KW_PAGES.length <= 1 || kwPaused) return;
    const t = setInterval(() => setKwPage((p) => (p + 1) % KW_PAGES.length), 3200);
    return () => clearInterval(t);
  }, [kwPaused]);
  const kwChips = KW_PAGES[kwPage] ?? [];
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", paddingTop: "7vh", textAlign: "center" }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: colors.textBase, marginBottom: 10 }}>
        통합 검색
      </div>
      <div style={{ fontSize: 16.5, color: colors.textSub, marginBottom: 28 }}>
        찾으시는 ESG 데이터를 조회하세요.
      </div>

      {/* 큰 검색창 (자동완성 드롭다운 포함) — 기업/지표 선택 시 SearchWidget이 라우팅 */}
      <SearchWidget maxWidth={880} />

      {/* 키워드 바로가기 */}
      <div style={{ fontSize: 14, color: colors.textHint, margin: "30px 0 14px" }}>
        이렇게 검색해보세요
      </div>
      <div
        onMouseEnter={() => setKwPaused(true)}
        onMouseLeave={() => setKwPaused(false)}
        style={{
          minHeight: 52,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          marginBottom: 30,
          overflow: "hidden",
        }}
      >
        <div
          key={kwPage}
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
            animation: "kwSlide 0.45s ease",
          }}
        >
          {kwChips.map((k) => (
            <button
              key={k.label}
              onClick={() => onKeyword(k.term)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                border: `1px solid ${colors.border}`,
                background: colors.bgSurface,
                color: colors.textBase,
                fontSize: 15,
                fontWeight: 600,
                padding: "11px 18px",
                borderRadius: 24,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <SearchOutlined style={{ fontSize: 13, color: colors.textHint }} />
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리로 둘러보기 — 소그룹 접이식 트리 (검색과 역할 다름: 둘러보기 입구) */}
      <CategoryBrowse />
    </div>
  );
}
