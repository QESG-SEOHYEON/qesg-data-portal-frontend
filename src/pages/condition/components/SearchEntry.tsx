// 검색 전 — 검색 도우미. 큰 검색창(중앙) + 단계 안내 + 키워드 바로가기 + 카테고리 지표 칩.
// 조건 검색 = 키워드 검색(문장형 질의는 AI 워크벤치). 평가·순위 표현 없음.
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { KEYWORD_EXAMPLES, CATEGORY_KEYWORDS } from "@/mock/indicatorSearch";
import type { Category } from "@/types";
import { colors, categoryColors } from "@/theme/tokens";

const CATS: Category[] = ["E", "S", "G"];

export function SearchEntry({
  value,
  onChange,
  onSubmit,
  onKeyword,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onKeyword: (term: string) => void;
}) {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: "12vh", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: colors.textBase, marginBottom: 6 }}>
        무엇을 조회할까요?
      </div>
      <div style={{ fontSize: 14, color: colors.textSub, marginBottom: 20 }}>
        기업명·종목코드 또는 지표를 검색해 표로 비교하세요
      </div>

      {/* 큰 검색창 */}
      <Input
        size="large"
        autoFocus
        prefix={<SearchOutlined style={{ color: colors.textHint, fontSize: 18 }} />}
        placeholder="기업명·종목코드 또는 지표를 검색하세요"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPressEnter={onSubmit}
        allowClear
        style={{ height: 56, fontSize: 16, borderRadius: 12 }}
      />

      {/* 단계 안내 */}
      <div style={{ fontSize: 13, color: colors.textHint, margin: "16px 0 22px" }}>
        ① 기업·지표 검색 &nbsp;→&nbsp; ② 분류·업종·포트폴리오로 좁히기 &nbsp;→&nbsp; ③ 표로 보고 추출
      </div>

      {/* 키워드 바로가기 */}
      <div style={{ fontSize: 12.5, color: colors.textHint, marginBottom: 10 }}>이렇게 검색해보세요</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 22 }}>
        {KEYWORD_EXAMPLES.map((k) => (
          <button
            key={k.label}
            onClick={() => onKeyword(k.term)}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${colors.border}`,
              background: colors.bgSurface,
              color: colors.textBase,
              fontSize: 13.5,
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: 20,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <SearchOutlined style={{ fontSize: 12, color: colors.textHint }} />
            {k.label}
          </button>
        ))}
      </div>

      {/* 카테고리별 주요 지표 칩 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "16px 18px",
          textAlign: "left",
        }}
      >
        {CATS.map((c) => {
          const meta = categoryColors[c];
          return (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  width: 64,
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: meta.fg,
                }}
              >
                {meta.name}
              </span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CATEGORY_KEYWORDS[c].map((k) => (
                  <button
                    key={k.label}
                    onClick={() => onKeyword(k.term)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = meta.bg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = colors.bgPage)}
                    style={{
                      border: "none",
                      background: colors.bgPage,
                      color: colors.textBase,
                      fontSize: 12.5,
                      padding: "5px 11px",
                      borderRadius: 14,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
