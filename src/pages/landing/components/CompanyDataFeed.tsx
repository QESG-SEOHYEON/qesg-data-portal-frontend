// 기업 ESG 데이터 피드 — 우리 DB 특성에 맞춤
// theVC식 '공시 날짜'(우리 데이터엔 무의미) 대신 회계연도(FY) 선택.
// 노출은 데모 등급(플랜) 기준 — 카테고리당 VISIBLE_COUNT 지표까지 값 공개, 나머지는 흐림+유도.
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Segmented } from "antd";
import { RightOutlined, LeftOutlined, LockOutlined } from "@ant-design/icons";
import type { Category, ViewerPlan } from "@/types";
import { BULK_COMPANIES, BULK_YEARS, BULK_LATEST_YEAR, getBulkCell } from "@/mock/bulkData";
import { CATALOG_RAW } from "@/mock/catalogData";
import type { CatalogRaw } from "@/mock/catalogData";
import { VISIBLE_COUNT, lockCta } from "@/mock/accessRules";
import { colors } from "@/theme/tokens";
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
    { code: "S43", label: "장애인 고용률" },
    { code: "G5", label: "사외이사 비중" },
    { code: "S11", label: "노사분규 작업중단" },
  ],
  E: [
    { code: "E3_1", label: "온실가스 배출량" },
    { code: "E5", label: "에너지 사용량" },
    { code: "E16", label: "폐기물 배출량" },
    { code: "E6", label: "신재생에너지" },
  ],
  S: [
    { code: "S43", label: "장애인 고용률" },
    { code: "S11", label: "노사분규 작업중단" },
    { code: "S30", label: "안전거버넌스" },
    { code: "S31", label: "제품보증 충당부채" },
  ],
  G: [
    { code: "G5", label: "사외이사 비중" },
    { code: "G7", label: "이사회 개최 건수" },
    { code: "G17", label: "IR 공시 건수" },
    { code: "G8", label: "사외이사 출석률" },
  ],
};

const CODE_MAP = new Map(CATALOG_RAW.map((i) => [i.code, i]));
const LOGO_PALETTE = ["#3D5A80", "#0F8A6A", "#185FA5", "#6E5A36", "#534AB7"];

// 지표 코드 → 카테고리 (셀 클릭 시 기업 상세 해당 위치 포커싱용)
function catOf(code: string): Category {
  const c = code[0];
  return c === "S" || c === "G" ? (c as Category) : "E";
}
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

export function CompanyDataFeed({
  plan = "guest",
  onLogin,
}: {
  plan?: ViewerPlan;
  onLogin?: () => void;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");
  const [year, setYear] = useState<number>(BULK_LATEST_YEAR);
  const [page, setPage] = useState(0);

  const pool = useMemo(() => shuffled(BULK_COMPANIES).slice(0, PAGE_SIZE * PAGES), []);
  const rows = pool.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const cols = TAB_COLS[tab]; // 전 컬럼 노출 — 좁으면 가로 스크롤로 자연스럽게 밀림

  // 등급 분기: 카테고리당 노출 지표 수(비회원=상위 N개, 그 외=전체) / 행 페이지 제한
  const limit = VISIBLE_COUNT(plan, "indicatorsPerCategory");
  const limited = limit !== Infinity;
  const rowsUnlimited = VISIBLE_COUNT(plan, "rows") === Infinity; // 비회원만 1페이지로 제한

  // 비회원: 2·3페이지는 로그인 후 — 이동 차단하고 로그인 유도
  const goPage = (i: number) => {
    if (i > 0 && !rowsUnlimited) {
      onLogin?.();
      return;
    }
    setPage(i);
  };

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
          <div style={{ display: "flex", gap: 22 }}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "16px 2px",
                    fontSize: 15,
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

        {/* 기업 행 목록 — 좁으면 가로 스크롤로 자연스럽게 밀림 (theVC 방식) */}
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            {rows.map((company, ri) => {
              const logoColor = LOGO_PALETTE[ri % LOGO_PALETTE.length];
              return (
                <div
                  key={company.id}
                  onClick={() => navigate(`/company/${company.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 18px",
                    borderBottom: `1px solid ${colors.border}`,
                    cursor: "pointer",
                  }}
                >
                  {/* 기업 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: 220,
                      flexShrink: 0,
                    }}
                  >
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
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: colors.textBase,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textUnderlineOffset: 3,
                        }}
                      >
                        {company.name}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textSub }}>{company.sector}</div>
                    </div>
                  </div>

                  {/* 데이터 필드 (선택 FY 기준) — 지표명은 항상 보이고, 잠긴 값만 흐림 */}
                  <div style={{ display: "flex", gap: 20, flex: 1, minWidth: 0 }}>
                    {cols.map((col, ci) => {
                      const item = CODE_MAP.get(col.code) as CatalogRaw | undefined;
                      const cell = item ? getBulkCell(company.id, item, year) : undefined;
                      // 잠금 = 등급 노출 한도(상위 N개) 밖 컬럼 — 값만 가림(형태 유지)
                      const locked = limited && ci >= limit;
                      return (
                        <div key={col.code} style={{ minWidth: 96, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: colors.textSub,
                              marginBottom: 3,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {col.label}
                          </div>
                          {locked ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                onLogin?.();
                              }}
                              title={lockCta(plan)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                whiteSpace: "nowrap",
                                cursor: "pointer",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: colors.textBase,
                                  filter: "blur(4.5px)",
                                  userSelect: "none",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                000,000
                              </span>
                              <LockOutlined style={{ fontSize: 11, color: colors.primary }} />
                            </div>
                          ) : (() => {
                            // 공개 셀 → 클릭 시 기업 상세 해당 지표 포커싱(통합 조회 테이블과 동일). 비공개는 비활성.
                            const hasValue = !!cell && cell.value !== null && !!cell.display;
                            return (
                              <span
                                onClick={
                                  hasValue
                                    ? (e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/company/${company.id}?cat=${catOf(col.code)}&ind=${col.code}`,
                                        );
                                      }
                                    : undefined
                                }
                                onMouseEnter={
                                  hasValue
                                    ? (e) => (e.currentTarget.style.textDecoration = "underline")
                                    : undefined
                                }
                                onMouseLeave={
                                  hasValue
                                    ? (e) => (e.currentTarget.style.textDecoration = "none")
                                    : undefined
                                }
                                title={hasValue ? "클릭하면 기업 상세에서 해당 데이터를 확인할 수 있어요" : undefined}
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: hasValue ? colors.textBase : colors.textHint,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  whiteSpace: "nowrap",
                                  fontVariantNumeric: "tabular-nums",
                                  cursor: hasValue ? "pointer" : "default",
                                  textUnderlineOffset: 3,
                                }}
                              >
                                {cell?.display ?? "-"}
                              </span>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 페이지네이션 — 번호 버튼 (비회원은 2·3페이지 클릭 시 로그인) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            padding: "14px 0",
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <button
            onClick={() => page > 0 && goPage(page - 1)}
            disabled={page === 0}
            aria-label="이전"
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.bgSurface,
              color: page === 0 ? colors.textHint : colors.textSub,
              width: 30,
              height: 30,
              borderRadius: 8,
              cursor: page === 0 ? "default" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LeftOutlined style={{ fontSize: 11 }} />
          </button>
          {Array.from({ length: PAGES }).map((_, i) => {
            const active = i === page;
            return (
              <button
                key={i}
                onClick={() => goPage(i)}
                aria-label={`${i + 1}페이지`}
                style={{
                  minWidth: 30,
                  height: 30,
                  padding: "0 8px",
                  borderRadius: 8,
                  border: `1px solid ${active ? colors.primary : colors.border}`,
                  background: active ? colors.primary : colors.bgSurface,
                  color: active ? "#fff" : colors.textSub,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </button>
            );
          })}
          <button
            onClick={() => goPage((page + 1) % PAGES)}
            disabled={page === PAGES - 1}
            aria-label="다음"
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.bgSurface,
              color: page === PAGES - 1 ? colors.textHint : colors.textSub,
              width: 30,
              height: 30,
              borderRadius: 8,
              cursor: page === PAGES - 1 ? "default" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RightOutlined style={{ fontSize: 11 }} />
          </button>
        </div>
      </div>
    </Section>
  );
}
