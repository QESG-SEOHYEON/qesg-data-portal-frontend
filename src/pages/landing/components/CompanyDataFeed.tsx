// 기업 ESG 데이터 피드 — 우리 DB 특성에 맞춤
// theVC식 '공시 날짜'(우리 데이터엔 무의미) 대신 회계연도(FY) 선택.
// 셀마다 출처 뱃지(출처 투명성). 잠금은 우리 출처 tier(공개=무료/SR·NICE 가공=프리미엄) 기준.
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button, Segmented } from "antd";
import { RightOutlined, LockOutlined } from "@ant-design/icons";
import type { Category } from "@/types";
import { BULK_COMPANIES, BULK_YEARS, BULK_LATEST_YEAR, getBulkCell } from "@/mock/bulkData";
import { CATALOG_RAW } from "@/mock/catalogData";
import type { CatalogRaw } from "@/mock/catalogData";
import { tierOf, canAccess } from "@/mock/access";
import { colors, categoryColors } from "@/theme/tokens";
import { sourceBadgeColors } from "@/mock/sources";
import { Section } from "./Section";

type Tab = "all" | Category;
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "E", label: "환경" },
  { key: "S", label: "사회" },
  { key: "G", label: "지배구조" },
];

// 탭별 노출 지표 (코드는 catalogData 실제 코드, 라벨은 짧게)
const TAB_COLS: Record<Tab, { code: string; label: string }[]> = {
  all: [
    { code: "E3_1", label: "온실가스 배출량" },
    { code: "S13", label: "여성 임직원 비율" },
    { code: "G5", label: "사외이사 비중" },
  ],
  E: [
    { code: "E3_1", label: "온실가스 배출량" },
    { code: "E5", label: "에너지 사용량" },
    { code: "E16", label: "폐기물 배출량" },
  ],
  S: [
    { code: "S13", label: "여성 임직원 비율" },
    { code: "S9", label: "1인당 평균임금" },
    { code: "S11", label: "노사분규 작업중단" },
  ],
  G: [
    { code: "G5", label: "사외이사 비중" },
    { code: "G7", label: "이사회 개최 건수" },
    { code: "G29", label: "등기임원 여성비율" },
  ],
};

const CODE_MAP = new Map(CATALOG_RAW.map((i) => [i.code, i]));
const LOGO_PALETTE = ["#3D5A80", "#0F8A6A", "#185FA5", "#6E5A36", "#534AB7"];
const PAGE_SIZE = 5;
const PAGES = 3;

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function CompanyDataFeed() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");
  const [year, setYear] = useState<number>(BULK_LATEST_YEAR);
  const [page, setPage] = useState(0);

  const pool = useMemo(() => shuffled(BULK_COMPANIES).slice(0, PAGE_SIZE * PAGES), []);
  const rows = pool.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const cols = TAB_COLS[tab];

  return (
    <Section
      title="기업 ESG 데이터"
      extra={
        <Link to="/bulk" style={{ color: colors.primary, fontWeight: 600 }}>
          더 보기 <RightOutlined style={{ fontSize: 11 }} />
        </Link>
      }
    >
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* 상단: 카테고리 탭(좌) + 회계연도 선택(우) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "0 18px",
            borderBottom: `1px solid ${colors.border}`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 18 }}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "14px 0",
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    color: active ? colors.textBase : colors.textSub,
                    borderBottom: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
            <span style={{ fontSize: 12, color: colors.textSub }}>회계연도</span>
            <Segmented
              size="small"
              value={year}
              onChange={(v) => setYear(v as number)}
              options={[...BULK_YEARS].reverse().map((y) => ({ value: y, label: `${y}` }))}
            />
          </div>
        </div>

        {/* 기업 행 목록 */}
        {rows.map((company, ri) => {
          const logoColor = LOGO_PALETTE[ri % LOGO_PALETTE.length];
          return (
            <div
              key={company.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 18px",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              {/* 기업 */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: 220, flexShrink: 0 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: logoColor,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {company.name.slice(0, 2)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: colors.textBase,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {company.name}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSub }}>{company.sector}</div>
                </div>
              </div>

              {/* 데이터 필드 (선택 FY 기준, 셀마다 출처 뱃지) */}
              <div style={{ display: "flex", gap: 20, flex: 1, minWidth: 0 }}>
                {cols.map((col) => {
                  const item = CODE_MAP.get(col.code) as CatalogRaw | undefined;
                  const cell = item ? getBulkCell(company.id, item, year) : undefined;
                  // 잠금 = 출처 tier가 프리미엄(SR·NICE)일 때 (비로그인 기준)
                  const locked = cell
                    ? !canAccess("guest", tierOf(cell.sourceCode, year, year))
                    : false;
                  const sb = cell ? sourceBadgeColors[cell.sourceCode] : undefined;
                  return (
                    <div key={col.code} style={{ minWidth: 96, flex: 1 }}>
                      <div style={{ fontSize: 11, color: colors.textSub, marginBottom: 3 }}>
                        {col.label}
                      </div>
                      {locked ? (
                        <div style={{ fontSize: 13, color: colors.primary, fontWeight: 600 }}>
                          <LockOutlined /> 로그인 필요
                          {sb && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: sb.fg,
                                background: sb.bg,
                                padding: "1px 4px",
                                borderRadius: 3,
                                marginLeft: 6,
                              }}
                            >
                              {cell?.sourceCode}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: cell?.value === null ? colors.textHint : colors.textBase,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {cell?.display ?? "-"}
                          {sb && cell?.value !== null && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: sb.fg,
                                background: sb.bg,
                                padding: "1px 4px",
                                borderRadius: 3,
                              }}
                            >
                              {cell?.sourceCode}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 상세페이지 보기 */}
              <Button onClick={() => navigate(`/company/${company.id}`)} style={{ flexShrink: 0 }}>
                상세페이지 보기
              </Button>
            </div>
          );
        })}

        {/* 페이지네이션 */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "14px 0" }}>
          <button
            onClick={() => setPage((p) => (p + 1) % PAGES)}
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
            {page + 1} / {PAGES}
          </span>
        </div>
      </div>

      {/* 안내: 셀마다 출처가 다름 (우리 데이터 차별점) */}
      <div style={{ marginTop: 8, fontSize: 12, color: colors.textHint }}>
        {tab !== "all" && (
          <>
            <span style={{ color: categoryColors[tab].fg, fontWeight: 700 }}>● </span>
            {categoryColors[tab].name} 지표 ·{" "}
          </>
        )}
        FY{year} 기준 · 값마다 출처(DART·SR·환경정보공개 등)가 셀 단위로 표시됩니다
      </div>
    </Section>
  );
}
