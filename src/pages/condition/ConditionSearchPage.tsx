// 조건 검색 페이지 (통합검색 본진) — 3상태: 검색 전 → 결과 요약 → 표 비교
// 검색 바 상시 상단. 예시 클릭 → 바로 표. 텍스트 검색 → 요약. 표로 비교 → 대량 테이블.
// 잠금은 플랜 셀렉터(access.ts). 종합점수·등급·순위 없음(안전선).
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Input, Segmented, Modal } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ViewerPlan } from "@/types";
import { PLAN_LABELS } from "@/mock/access";
import { colors, layout } from "@/theme/tokens";
import { SearchEntry } from "./components/SearchEntry";
import { ResultsSummary } from "./components/ResultsSummary";
import { ConditionTable } from "./components/ConditionTable";
import { LoginModal } from "@/pages/landing/components/LoginModal";

type Mode = "entry" | "summary" | "table";

export function ConditionSearchPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q0 = params.get("q") ?? ""; // 홈 검색에서 ?q= 로 넘어온 검색어
  const [mode, setMode] = useState<Mode>(q0 ? "summary" : "entry");
  const [query, setQuery] = useState(q0);
  const [input, setInput] = useState(q0);
  const [plan, setPlan] = useState<ViewerPlan>("member");

  // 표 진입 컨텍스트
  const [tableColumnId, setTableColumnId] = useState<string | undefined>();
  const [companyIds, setCompanyIds] = useState<string[] | undefined>();

  // 모달
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [portfolioText, setPortfolioText] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  function runText(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setInput(q);
    setMode("summary");
  }
  function openTable(indicatorId?: string) {
    if (indicatorId) setTableColumnId(indicatorId);
    setMode("table");
  }
  function applyPortfolio() {
    const codes = portfolioText.split(/[\s,;]+/).map((s) => s.trim()).filter((s) => /^\d{6}$/.test(s));
    setCompanyIds(codes.length > 0 ? codes : undefined);
    setPortfolioOpen(false);
    setMode("table");
  }

  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* 상단 타이틀 + 플랜 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.textBase }}>조건 검색</h1>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.textSub }}>조회 플랜</span>
            <Segmented
              size="small"
              value={plan}
              onChange={(v) => setPlan(v as ViewerPlan)}
              options={(["guest", "member", "enterprise"] as ViewerPlan[]).map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
            />
          </div>
        </div>

        {/* 검색 전: 검색 도우미(큰 검색창) / 검색 후: 상시 컴팩트 검색창 + 결과 */}
        {mode === "entry" ? (
          <SearchEntry
            value={input}
            onChange={setInput}
            onSubmit={() => runText(input)}
            onKeyword={(term) => runText(term)}
          />
        ) : (
          <>
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: colors.textHint }} />}
              placeholder="기업명·종목코드 또는 지표를 검색하세요"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={() => runText(input)}
              allowClear
              style={{ marginBottom: 4 }}
            />
            <div style={{ fontSize: 12.5, color: colors.textHint, margin: "8px 2px 0" }}>
              "{query}" 결과 ·{" "}
              <a style={{ color: colors.primary }} onClick={() => { setMode("entry"); setQuery(""); setInput(""); setCompanyIds(undefined); }}>
                검색 초기화
              </a>
            </div>

            <div style={{ marginTop: 18 }}>
              {mode === "summary" && (
                <ResultsSummary query={query} onOpenCompany={(id) => navigate(`/company/${id}`)} onOpenTable={openTable} />
              )}
              {mode === "table" && (
                <ConditionTable
                  plan={plan}
                  initialColumnId={tableColumnId}
                  companyIds={companyIds}
                  onCompanyOpen={(id) => navigate(`/company/${id}`)}
                  onPortfolio={() => setPortfolioOpen(true)}
                  onUpgrade={() => setLoginOpen(true)}
                  onClearPortfolio={() => setCompanyIds(undefined)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* 포트폴리오 일괄 입력 */}
      <Modal
        open={portfolioOpen}
        onCancel={() => setPortfolioOpen(false)}
        onOk={applyPortfolio}
        okText="조회"
        cancelText="취소"
        title="포트폴리오 일괄 조회"
        centered
      >
        <p style={{ fontSize: 13, color: colors.textSub, marginTop: 0 }}>종목코드(6자리)를 줄바꿈·쉼표로 구분해 붙여넣으세요.</p>
        <Input.TextArea rows={6} value={portfolioText} onChange={(e) => setPortfolioText(e.target.value)} placeholder={"005930\n000660\n035420"} />
      </Modal>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}
