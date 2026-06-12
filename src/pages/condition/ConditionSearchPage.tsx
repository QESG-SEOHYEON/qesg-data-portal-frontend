// 통합 검색 페이지 (통합검색 본진) — 3상태: 검색 전 → 결과 요약 → 표 비교
// 검색 바 상시 상단. 예시 클릭 → 바로 표. 텍스트 검색 → 요약. 표로 비교 → 대량 테이블.
// 잠금은 플랜 셀렉터(access.ts). 종합점수·등급·순위 없음(안전선).
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Category } from "@/types";
import { usePlan } from "@/mock/planContext";
import { colors, categoryColors, layout } from "@/theme/tokens";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { RightRail } from "@/components/RightRail";
import { SearchWidget } from "@/pages/search/components/SearchWidget";
import { SearchEntry } from "./components/SearchEntry";
import { getIndicatorColumns } from "@/mock/indicatorSearch";
import { getPortfolio } from "@/mock/workspace";
import { ResultsSummary } from "./components/ResultsSummary";
import { ConditionTable } from "./components/ConditionTable";
import { LoginModal } from "@/pages/landing/components/LoginModal";
import { PlanModal } from "@/pages/landing/components/PlanModal";

type Mode = "entry" | "summary" | "table";

const CAT_SET = new Set(["E", "S", "G"]);

export function ConditionSearchPage() {
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const [params] = useSearchParams();
  const q0 = params.get("q") ?? ""; // 홈 검색에서 ?q= 로 넘어온 검색어
  const cat0 = params.get("cat"); // GNB 환경/사회/지배구조 메뉴
  const col0 = params.get("col") ?? undefined; // 지표 선택 → 그 컬럼(지표) 표
  const company0 = params.get("company") ?? undefined; // 개별기업 "전체 보기" → 그 기업 필터
  const sector0 = params.get("sector") ?? undefined; // 업종 칩(기업 칩 떼면 동종업계로)
  const group0 = params.get("group") ?? undefined; // 둘러보기: 소그룹 전체 조회
  const pf0 = params.get("pf") ?? undefined; // 내 포트폴리오(기업리스트) 불러오기
  const full0 = params.get("full") === "1"; // 카테고리 전체 지표 표시
  const cat0Valid = cat0 && CAT_SET.has(cat0) ? (cat0 as Category) : undefined;
  const [mode, setMode] = useState<Mode>(
    cat0Valid || col0 || company0 || group0 || pf0 ? "table" : q0 ? "summary" : "entry",
  );
  const [query, setQuery] = useState(q0);
  const [plan, setPlan] = usePlan();

  // 표 진입 컨텍스트
  const [tableColumnId, setTableColumnId] = useState<string | undefined>(col0);
  const [tableCategory, setTableCategory] = useState<Category | undefined>(cat0Valid);
  const [companyIds, setCompanyIds] = useState<string[] | undefined>(
    pf0 ? getPortfolio(pf0)?.companyIds : company0 ? [company0] : undefined,
  );

  // 모달
  const [loginOpen, setLoginOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  // 잠금 접근: 비회원 → 로그인 / 가입했으나 미구매(개인) → 플랜 가입
  const requireUpgrade = () => (plan === "guest" ? setLoginOpen(true) : setPlanOpen(true));

  // URL 쿼리(GNB·홈검색·지표선택)가 바뀌면 동기화 — 같은 라우트라 remount가 없으므로 effect로 반영
  const searchKey = params.toString();
  useEffect(() => {
    const cat = params.get("cat");
    const col = params.get("col");
    const q = params.get("q");
    const company = params.get("company");
    const group = params.get("group");
    const pf = params.get("pf");
    if (pf) {
      // 내 포트폴리오(기업리스트) 불러오기 → 그 기업들로 표 조회
      setCompanyIds(getPortfolio(pf)?.companyIds);
      setTableCategory(undefined);
      setTableColumnId(undefined);
      setMode("table");
    } else if (company) {
      // 개별기업 "전체 보기" → 그 기업 필터 + 카테고리(있으면)
      setCompanyIds([company]);
      setTableCategory(cat && CAT_SET.has(cat) ? (cat as Category) : undefined);
      setTableColumnId(undefined);
      setMode("table");
    } else if (group) {
      // 둘러보기: 소그룹 전체 조회
      setTableCategory(undefined);
      setTableColumnId(undefined);
      setCompanyIds(undefined);
      setMode("table");
    } else if (cat && CAT_SET.has(cat)) {
      setTableCategory(cat as Category);
      setTableColumnId(undefined);
      setCompanyIds(undefined);
      setMode("table");
    } else if (col) {
      setTableColumnId(col);
      setTableCategory(undefined);
      setCompanyIds(undefined);
      setMode("table");
    } else if (q) {
      setQuery(q);
      setMode("summary");
    } else {
      setMode("entry");
      setQuery("");
      setTableCategory(undefined);
      setTableColumnId(undefined);
      setCompanyIds(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  function runText(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setMode("summary");
  }
  function openTable(indicatorId?: string) {
    setTableCategory(undefined); // 요약→표는 전 분류
    setTableColumnId(indicatorId);
    setMode("table");
  }

  // 와이드에서 항상 우측 레일 노출 (표 화면 포함 — 표는 가로 스크롤)
  const showRail = bp === "wide";
  const colLabel = tableColumnId
    ? getIndicatorColumns().find((c) => c.id === tableColumnId)?.label
    : undefined;

  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div
        style={{
          maxWidth: showRail ? layout.wideMaxWidth : layout.contentMaxWidth,
          margin: "0 auto",
          padding: "28px 20px 80px",
          display: showRail ? "flex" : "block",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: showRail ? 1 : undefined, minWidth: 0 }}>
        {/* 검색 전: 검색 도우미(큰 검색창) / 검색 후: 상시 검색창 + 결과 */}
        {mode === "entry" ? (
          <SearchEntry onKeyword={(term) => runText(term)} />
        ) : (
          <>
            <SearchWidget maxWidth={9999} initialQuery={query} />
            <div style={{ fontSize: 12.5, color: colors.textHint, margin: "8px 2px 0" }}>
              {tableCategory
                ? `${categoryColors[tableCategory].name} 지표`
                : tableColumnId
                  ? colLabel ?? "지표 조회"
                  : `"${query}" 결과`}{" "}
              ·{" "}
              <a
                style={{ color: colors.primary }}
                onClick={() => {
                  setMode("entry");
                  setQuery("");
                  setCompanyIds(undefined);
                  setTableCategory(undefined);
                  setTableColumnId(undefined);
                }}
              >
                검색 초기화
              </a>
            </div>

            <div style={{ marginTop: 18 }}>
              {mode === "summary" && (
                <ResultsSummary
                  query={query}
                  onOpenCompany={(id) => navigate(`/company/${id}`)}
                  onOpenTable={openTable}
                />
              )}
              {mode === "table" && (
                <ConditionTable
                  key={`${tableCategory ?? "all"}:${tableColumnId ?? ""}:${sector0 ?? ""}:${group0 ?? ""}`}
                  plan={plan}
                  initialColumnId={tableColumnId}
                  initialCategory={tableCategory}
                  initialGroupCode={group0}
                  initialSectors={sector0 ? [sector0] : undefined}
                  fullCategory={full0}
                  companyIds={companyIds}
                  onCompanyOpen={(id) => navigate(`/company/${id}`)}
                  onIndicatorOpen={(id, cat, label) =>
                    navigate(`/company/${id}?cat=${cat}&ind=${encodeURIComponent(label)}`)
                  }
                  onSanctionOpen={(id) => navigate(`/company/${id}#sanctions`)}
                  onUpgrade={requireUpgrade}
                  onSetCompanyIds={setCompanyIds}
                />
              )}
            </div>
          </>
        )}
        </div>

        {showRail && (
          <aside style={{ width: 300, flexShrink: 0, position: "sticky", top: 84 }}>
            <RightRail plan={plan} onPlanChange={setPlan} onLogin={() => setLoginOpen(true)} />
          </aside>
        )}
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} />
    </main>
  );
}
