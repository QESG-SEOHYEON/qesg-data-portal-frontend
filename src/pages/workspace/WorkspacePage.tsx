// 워크스페이스 — 통합 데이터 테이블 1개 중심 + AI 대화 패널로 조작. 회원 전용(데모 허용).
// 손 조작(툴바)과 AI 조작이 같은 테이블 상태(WsState)를 공유. 저장/불러오기(포트폴리오).
// ⚠️ 안전선: 평가/순위/점수 없음(함수 부재). Excel·API·대량 = 플랜 회원.
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Segmented, Select, Modal, Input, App, Tooltip } from "antd";
import {
  RobotOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  AppstoreOutlined,
  FilterOutlined,
  DownloadOutlined,
  ApiOutlined,
  LockOutlined,
} from "@ant-design/icons";
import type { ViewerPlan } from "@/types";
import {
  getIndicatorColumns,
  getIndicatorRows,
  cellKey,
  SEARCH_LATEST_YEAR,
} from "@/mock/indicatorSearch";
import type { IndicatorRow } from "@/mock/indicatorSearch";
import { BULK_COMPANIES } from "@/mock/bulkData";
import { getSanctionCounts } from "@/mock/sanctions";
import {
  getPortfolios,
  getPortfolio,
  getSavedWork,
  getSavedWorks,
  saveWorkspace,
  addDownload,
} from "@/mock/workspace";
import type { WsOp } from "@/mock/workspace";
import { searchMock } from "@/mock/search";
import { PLAN_ORDER, PLAN_LABELS } from "@/mock/access";
import { usePlan } from "@/mock/planContext";
import { CAN, lockCta } from "@/mock/accessRules";
import { colors, layout } from "@/theme/tokens";
import { IndicatorGrid } from "@/components/IndicatorGrid";
import type { SortState } from "@/components/IndicatorGrid";
import { AddIndicatorColumn } from "@/components/AddIndicatorColumn";
import { ConditionFilterModal } from "@/pages/condition/components/ConditionFilterModal";
import { AiPanel } from "./components/AiPanel";
import { LoginModal } from "@/pages/landing/components/LoginModal";
import { PlanModal } from "@/pages/landing/components/PlanModal";

const SECTORS = [
  "반도체",
  "화학",
  "자동차",
  "2차전지",
  "바이오·제약",
  "금융",
  "유통",
  "철강·금속",
  "건설",
  "IT·서비스",
  "통신",
  "식품",
];

export function WorkspacePage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const allCols = getIndicatorColumns();

  const [sp] = useSearchParams();
  const loaded = sp.get("load") ? getSavedWork(sp.get("load")!) : undefined;
  const companyParam = sp.get("company"); // 기업 상세에서 핸드오프 → 그 기업 시드
  const peersParam = sp.get("peers"); // 동종업계 비교 핸드오프 → 그 업종 피어 시드
  const pfParam = sp.get("pf"); // 내 포트폴리오(기업리스트) → 그 기업들 시드

  const [plan, setPlan] = usePlan(); // 전역 데모 등급(페이지 이동해도 유지)
  const admin = plan === "admin";
  // 진입 시 빈 테이블(채우기 유도) — ?load=저장복원 / ?peers=동종업계 / ?company=기업
  const [companyIds, setCompanyIds] = useState<string[]>(() => {
    if (loaded?.companyIds) return loaded.companyIds;
    if (pfParam) return getPortfolio(pfParam)?.companyIds ?? [];
    if (peersParam)
      return BULK_COMPANIES.filter((c) => c.sector === peersParam)
        .slice(0, 6)
        .map((c) => c.id);
    return companyParam ? [companyParam] : [];
  });
  const [indicatorIds, setIndicatorIds] = useState<string[]>(loaded?.indicatorIds ?? []);
  const [sectors, setSectors] = useState<string[]>(loaded?.sectors ?? []);
  const [years, setYears] = useState<number[]>(loaded?.years ?? [SEARCH_LATEST_YEAR]);
  const [rowFilter, setRowFilter] = useState<{ colId: string; value: string } | null>(null);
  const [showSanctions, setShowSanctions] = useState(loaded?.showSanctions ?? false);
  const [sanctionExpanded, setSanctionExpanded] = useState(false);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState | null>(null);
  const [aiOpen, setAiOpen] = useState(true);

  // 모달
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSection, setFilterSection] = useState<"columns" | "year" | "sector" | "codes">(
    "columns",
  );
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pfOpen, setPfOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const requireUpgrade = () => (plan === "guest" ? setLoginOpen(true) : setPlanOpen(true));
  // 등급 분기: 워크스페이스 진입=개인O+, 저장/Excel=개인O+, API=기업O+
  const canWorkspace = CAN(plan, "workspace");
  const canSave = CAN(plan, "save");
  const canExcel = CAN(plan, "excel");
  const canApi = CAN(plan, "api");
  const sortedYears = useMemo(() => [...years].sort((a, b) => a - b), [years]);
  const latestYear = sortedYears[sortedYears.length - 1] ?? SEARCH_LATEST_YEAR;
  const cols = useMemo(
    () => allCols.filter((c) => indicatorIds.includes(c.id)),
    [allCols, indicatorIds],
  );

  // 워크스페이스는 "직접 담는 표" — 기업·업종 미선택이면 전체가 아니라 빈 표
  const baseRows = useMemo(
    () =>
      companyIds.length === 0 && sectors.length === 0
        ? []
        : getIndicatorRows({ companyIds, sectors, years }),
    [companyIds, sectors, years],
  );
  // AI filterRows(미도입 등) — 셀 값 기준 후필터
  const rows = useMemo(() => {
    if (!rowFilter) return baseRows;
    const key = cellKey(rowFilter.colId, latestYear);
    return baseRows.filter((r) => r.cells[key]?.value === rowFilter.value);
  }, [baseRows, rowFilter, latestYear]);

  const sanctionCounts = useMemo(
    () =>
      showSanctions
        ? getSanctionCounts(
            rows.map((r) => r.id),
            years,
          )
        : {},
    [showSanctions, rows, years],
  );

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    if (sort.colId === "__sanction") {
      const theme = sort.subCode;
      const val = (r: IndicatorRow) => (theme ? (sanctionCounts[r.id]?.[theme] ?? 0) : 0);
      return [...rows].sort((a, b) => (sort.dir === "desc" ? val(b) - val(a) : val(a) - val(b)));
    }
    const col = allCols.find((c) => c.id === sort.colId);
    if (!col || col.type !== "numeric") return rows;
    const key = cellKey(sort.colId, sort.year, sort.subCode);
    const val = (r: IndicatorRow) => {
      const v = r.cells[key]?.value;
      return typeof v === "number" ? v : null;
    };
    return [...rows].sort((a, b) => {
      const va = val(a),
        vb = val(b);
      if (va === null) return 1;
      if (vb === null) return -1;
      return sort.dir === "desc" ? vb - va : va - vb;
    });
  }, [rows, sort, allCols, sanctionCounts]);

  // AI 조작 적용 (손 조작과 같은 상태)
  function applyOp(op: WsOp) {
    if (op.type === "loadPortfolio") {
      const p = getPortfolios().find((x) => x.id === op.portfolioId);
      if (p) {
        setCompanyIds(p.companyIds);
        setSectors([]);
        setRowFilter(null);
      }
    } else if (op.type === "addIndicator") {
      setIndicatorIds((prev) => (prev.includes(op.code) ? prev : [...prev, op.code]));
    } else if (op.type === "addIndicators") {
      setIndicatorIds((prev) => Array.from(new Set([...prev, ...op.codes])));
    } else if (op.type === "filterRows") {
      setIndicatorIds((prev) => (prev.includes(op.colId) ? prev : [...prev, op.colId]));
      setRowFilter({ colId: op.colId, value: op.value });
    } else if (op.type === "filterSector") {
      setCompanyIds((prev) =>
        prev.filter((id) => BULK_COMPANIES.find((c) => c.id === id)?.sector === op.sector),
      );
      setRowFilter(null);
    } else if (op.type === "sortBy") {
      setIndicatorIds((prev) => (prev.includes(op.colId) ? prev : [...prev, op.colId]));
      setSort({ colId: op.colId, subCode: op.subCode, year: latestYear, dir: op.dir });
    } else if (op.type === "setYears") {
      setYears(op.years);
    }
  }

  // 차트 카드용 데이터 — 현재 표(정렬 반영) 기준 지표 값
  function chartData(code: string) {
    const col = allCols.find((c) => c.id === code);
    const sub = col?.subs?.some((s) => s.code === "total") ? "total" : undefined;
    const key = cellKey(code, latestYear, sub);
    return sortedRows.map((r) => ({
      name: r.name,
      value: typeof r.cells[key]?.value === "number" ? (r.cells[key]!.value as number) : 0,
    }));
  }

  const toggleSubs = (id: string) =>
    setExpandedSubs((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleSort = (colId: string, subCode: string | null, year: number) =>
    setSort((s) =>
      s?.colId === colId && s.subCode === subCode && s.year === year
        ? { colId, subCode, year, dir: s.dir === "desc" ? "asc" : "desc" }
        : { colId, subCode, year, dir: "desc" },
    );
  const sanctionSort = (key: string) =>
    setSort((s) =>
      s?.colId === "__sanction" && s.subCode === key
        ? { colId: "__sanction", subCode: key, year: 0, dir: s.dir === "desc" ? "asc" : "desc" }
        : { colId: "__sanction", subCode: key, year: 0, dir: "desc" },
    );
  const openFilter = (sec: typeof filterSection) => {
    setFilterSection(sec);
    setFilterOpen(true);
  };

  const portfolios = getPortfolios();

  function doSave() {
    if (!canSave) {
      requireUpgrade();
      return;
    }
    if (!saveName.trim()) return;
    saveWorkspace(saveName.trim(), {
      companyIds,
      indicatorIds,
      sectors,
      years,
      showSanctions,
      rowFilter,
      sort,
    });
    setSaveOpen(false);
    setSaveName("");
    message.success("내 포트폴리오에 저장했어요");
  }
  // 표 다운로드(목업) — 마이 포트폴리오 다운로드 이력에 기록
  function doDownload(kind: "Excel" | "API") {
    if (kind === "Excel" ? !canExcel : !canApi) {
      requireUpgrade();
      return;
    }
    if (rows.length === 0) return;
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    addDownload(
      `워크스페이스_${rows.length}곳_${indicatorIds.length}지표_${stamp}.${kind === "Excel" ? "xlsx" : "json"}`,
      kind,
    );
    message.success(`${kind} 다운로드 — 내 포트폴리오 이력에 저장됐어요`);
  }
  function restoreWork(id: string) {
    const w = getSavedWork(id);
    if (!w) return;
    setCompanyIds(w.companyIds);
    setIndicatorIds(w.indicatorIds);
    setSectors(w.sectors);
    setYears(w.years);
    setShowSanctions(w.showSanctions);
    setRowFilter(w.rowFilter ?? null);
    setSort(w.sort ?? null);
    message.success(`'${w.name}' 불러옴`);
  }

  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div style={{ maxWidth: layout.wideMaxWidth, margin: "0 auto", padding: "16px 20px" }}>
        {/* 상단바 (스크롤 시 GNB 아래 고정) */}
        <div
          style={{
            position: "sticky",
            top: 68,
            zIndex: 20,
            background: colors.bgPage,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            padding: "8px 0",
            marginBottom: 12,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.textBase }}>워크스페이스</div>
          <span style={{ fontSize: 13, color: colors.textSub }}>
            기업 <b style={{ color: colors.accent }}>{rows.length}</b> · 지표{" "}
            <b style={{ color: colors.accent }}>{indicatorIds.length}</b>
          </span>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <Select
              size="small"
              style={{ width: 200 }}
              placeholder="저장한 작업 불러오기"
              suffixIcon={<FolderOpenOutlined />}
              notFoundContent="저장한 작업이 없어요"
              options={getSavedWorks().map((w) => ({
                value: w.id,
                label: `${w.name} · ${w.companyIds.length}종목·지표${w.indicatorIds.length}`,
              }))}
              onChange={(id) => restoreWork(id)}
            />
            <Tooltip title={canSave ? "" : lockCta(plan)}>
              <Button
                icon={canSave ? <SaveOutlined /> : <LockOutlined />}
                onClick={() => (canSave ? setSaveOpen(true) : requireUpgrade())}
              >
                저장
              </Button>
            </Tooltip>
            <Tooltip
              title={
                !canExcel
                  ? lockCta(plan)
                  : rows.length === 0
                    ? "표에 데이터가 있을 때 받을 수 있어요"
                    : ""
              }
            >
              <Button
                icon={canExcel ? <DownloadOutlined /> : <LockOutlined />}
                disabled={canExcel && rows.length === 0}
                onClick={() => doDownload("Excel")}
              >
                Excel
              </Button>
            </Tooltip>
            <Tooltip
              title={
                !canApi
                  ? lockCta(plan)
                  : rows.length === 0
                    ? "표에 데이터가 있을 때 받을 수 있어요"
                    : ""
              }
            >
              <Button
                icon={canApi ? <ApiOutlined /> : <LockOutlined />}
                disabled={canApi && rows.length === 0}
                onClick={() => doDownload("API")}
              />
            </Tooltip>
            <Button
              type={aiOpen ? "primary" : "default"}
              icon={<RobotOutlined />}
              onClick={() => setAiOpen((v) => !v)}
              style={
                aiOpen ? { background: colors.primary, borderColor: colors.primary } : undefined
              }
            >
              AI
            </Button>
            {/* 데모용 조회 플랜 토글 (5단계) */}
            <Segmented
              size="small"
              value={plan}
              onChange={(v) => setPlan(v as ViewerPlan)}
              options={PLAN_ORDER.map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
            />
          </div>
        </div>

        {/* 워크스페이스 진입 잠금 (개인O+ 전용) — 있지만 잠김: 흐림 위 안내 */}
        {!canWorkspace ? (
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              background: colors.bgSurface,
              padding: "64px 24px",
              textAlign: "center",
            }}
          >
            <LockOutlined style={{ fontSize: 30, color: colors.primary }} />
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: colors.textBase,
                margin: "14px 0 6px",
              }}
            >
              개인(플랜)·기업 회원 전용입니다
            </div>
            <div
              style={{ fontSize: 13.5, color: colors.textSub, marginBottom: 20, lineHeight: 1.6 }}
            >
              워크스페이스는 나만의 기업,지표를 모아 비교하고 AI로 분석하는 작업공간이에요.
              <br />
              <b>이용 문의는 서비스 소개를 눌러 더 자세히 알아보세요.</b>
            </div>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/pricing")}
              style={{ background: colors.primary, borderColor: colors.primary }}
            >
              서비스 소개
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 툴바: 채우기 4방식(기업/지표/필터) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  background: colors.bgSurface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: "10px 14px",
                  marginBottom: 12,
                }}
              >
                <Button icon={<PlusOutlined />} onClick={() => setPickerOpen(true)}>
                  기업
                </Button>
                <Button icon={<FolderOpenOutlined />} onClick={() => setPfOpen(true)}>
                  포트폴리오 불러오기
                </Button>
                <Button icon={<AppstoreOutlined />} onClick={() => openFilter("columns")}>
                  지표
                </Button>
                <Button icon={<FilterOutlined />} onClick={() => openFilter("year")}>
                  필터
                </Button>
                {rowFilter && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#7A5B17",
                      background: "#FFF8EC",
                      border: "1px solid #F3E2BE",
                      borderRadius: 12,
                      padding: "3px 10px",
                      cursor: "pointer",
                    }}
                    onClick={() => setRowFilter(null)}
                  >
                    AI 필터: {allCols.find((c) => c.id === rowFilter.colId)?.label} = 미도입 ✕
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontSize: 12, color: colors.textHint }}>
                  채우기: 기업 선택 · 포트폴리오 · 조건 · AI 요청
                </span>
              </div>

              {/* 통합 데이터 테이블 (공용 IndicatorGrid) */}
              <div
                style={{
                  background: colors.bgSurface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {companyIds.length === 0 &&
                sectors.length === 0 &&
                cols.length === 0 &&
                !showSanctions ? (
                  <div style={{ padding: "56px 20px", textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: colors.textBase,
                        marginBottom: 6,
                      }}
                    >
                      빈 작업공간입니다
                    </div>
                    <div style={{ fontSize: 13, color: colors.textSub, marginBottom: 18 }}>
                      기업·지표를 담거나 AI에게 요청해 표를 채워보세요.
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setPickerOpen(true)}
                        style={{ background: colors.primary, borderColor: colors.primary }}
                      >
                        기업 선택
                      </Button>
                      <Button icon={<FolderOpenOutlined />} onClick={() => setPfOpen(true)}>
                        포트폴리오 불러오기
                      </Button>
                      <Button icon={<AppstoreOutlined />} onClick={() => openFilter("columns")}>
                        지표 추가
                      </Button>
                      <Button icon={<RobotOutlined />} onClick={() => setAiOpen(true)}>
                        AI에게 요청
                      </Button>
                    </div>
                  </div>
                ) : (
                  <IndicatorGrid
                    cols={cols}
                    sortedYears={sortedYears}
                    multiYear={years.length > 1}
                    rows={sortedRows}
                    expandedSubs={expandedSubs}
                    onToggleSubs={toggleSubs}
                    showSanctions={showSanctions}
                    sanctionExpanded={sanctionExpanded}
                    onToggleSanctionExpanded={() => setSanctionExpanded((v) => !v)}
                    onRemoveSanctions={() => setShowSanctions(false)}
                    sanctionCounts={sanctionCounts}
                    sort={sort}
                    onToggleSort={toggleSort}
                    onSanctionSort={sanctionSort}
                    onRemoveColumn={(id) => setIndicatorIds((prev) => prev.filter((x) => x !== id))}
                    onCompanyOpen={(id) => navigate(`/company/${id}`)}
                    onIndicatorOpen={(id, cat, code) =>
                      navigate(`/company/${id}?cat=${cat}&ind=${code}`)
                    }
                    onSanctionOpen={(id) => navigate(`/company/${id}#sanctions`)}
                    addColumnSlot={
                      <AddIndicatorColumn
                        count={indicatorIds.length}
                        plan={plan}
                        onOpen={() => openFilter("columns")}
                        onUpgrade={requireUpgrade}
                      />
                    }
                  />
                )}
              </div>
              <div style={{ marginTop: 10, fontSize: 11.5, color: colors.textHint }}>
                공시·수집된 원본 데이터입니다. 평가·등급·순위·점수가 아닙니다.
              </div>
            </div>

            {/* AI 패널 (접기/펴기) */}
            {aiOpen ? (
              <div
                style={{
                  width: 360,
                  flexShrink: 0,
                  alignSelf: "flex-start",
                  position: "sticky",
                  top: 132,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: `1px solid ${colors.border}`,
                    background: colors.bgSurface,
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: colors.textBase }}>
                    <RobotOutlined style={{ color: colors.accent, marginRight: 6 }} />
                    AI 데이터 분석
                  </span>
                  <a
                    onClick={() => setAiOpen(false)}
                    style={{ fontSize: 12, color: colors.textHint, cursor: "pointer" }}
                  >
                    접기 ▶
                  </a>
                </div>
                <AiPanel
                  onApplyOp={applyOp}
                  onChartData={chartData}
                  companyCount={rows.length}
                  admin={admin}
                  autoQuery={sp.get("ai") ?? undefined}
                />
              </div>
            ) : (
              <button
                onClick={() => setAiOpen(true)}
                style={{
                  width: 36,
                  flexShrink: 0,
                  alignSelf: "flex-start",
                  position: "sticky",
                  top: 132,
                  height: 200,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  background: colors.bgSurface,
                  cursor: "pointer",
                  writingMode: "vertical-rl",
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.primary,
                }}
              >
                ◀ AI
              </button>
            )}
          </div>
        )}
      </div>

      {/* 기업 선택 모달 */}
      <CompanyPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={companyIds}
        onChange={setCompanyIds}
      />

      {/* 포트폴리오 불러오기 모달 */}
      <Modal
        open={pfOpen}
        onCancel={() => setPfOpen(false)}
        footer={null}
        title="포트폴리오 불러오기"
        centered
        width={420}
      >
        <div style={{ fontSize: 12.5, color: colors.textSub, marginBottom: 12 }}>
          저장된 포트폴리오를 선택하면 그 종목들이 표에 담깁니다.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                applyOp({ type: "loadPortfolio", portfolioId: p.id });
                setPfOpen(false);
                message.success(`'${p.name}' 불러옴`);
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                border: `1px solid ${colors.border}`,
                background: colors.bgSurface,
                borderRadius: 10,
                padding: "12px 14px",
                cursor: "pointer",
              }}
            >
              <FolderOpenOutlined style={{ color: colors.accent }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.textBase }}>
                {p.name}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 12.5, color: colors.textSub }}>
                {p.companyIds.length}종목
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* 저장 모달 */}
      <Modal
        open={saveOpen}
        onCancel={() => setSaveOpen(false)}
        onOk={doSave}
        okText="저장"
        cancelText="닫기"
        title="포트폴리오로 저장"
        centered
        width={420}
      >
        <div style={{ fontSize: 13, color: colors.textSub, marginBottom: 10 }}>
          현재 테이블(기업 {companyIds.length}개·지표 {indicatorIds.length}개)을 내 포트폴리오로
          저장합니다.
        </div>
        <Input
          placeholder="예: Q2 점검"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onPressEnter={doSave}
        />
      </Modal>

      {/* 필터/지표 모달 (통합검색과 공용) */}
      <ConditionFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={{ sectors, visibleIds: indicatorIds, companyIds, years, sanctions: showSanctions }}
        allCols={allCols}
        initialSection={filterSection}
        sectors={SECTORS}
        onApply={(next) => {
          setSectors(next.sectors ?? []);
          setIndicatorIds(next.visibleIds);
          setYears(next.years);
          setShowSanctions(next.sanctions);
          setCompanyIds(next.companyIds ?? companyIds);
        }}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} />
    </main>
  );
}

// 기업 선택 — 검색해 행으로 담기
function CompanyPicker({
  open,
  onClose,
  selected,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const result = searchMock(q, "company").companies;
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="완료"
      cancelText="닫기"
      title="기업 선택"
      centered
      width={460}
    >
      <Input
        placeholder="기업명·종목코드 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />
      <div style={{ fontSize: 12, color: colors.textHint, marginBottom: 8 }}>
        선택 {selected.length}개
      </div>
      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {(q.trim() ? result : []).map((c) => {
          const on = selected.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                textAlign: "left",
                border: `1px solid ${on ? colors.accent : colors.border}`,
                background: on ? `${colors.accent}10` : colors.bgSurface,
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.textBase }}>
                {c.label}
              </span>
              <span style={{ fontSize: 12, color: colors.textSub }}>{c.id}</span>
              {on && (
                <span style={{ marginLeft: "auto", color: colors.accent, fontWeight: 700 }}>✓</span>
              )}
            </button>
          );
        })}
        {!q.trim() && (
          <div
            style={{
              fontSize: 12.5,
              color: colors.textHint,
              padding: "20px 0",
              textAlign: "center",
            }}
          >
            기업명을 검색해 추가하세요.
          </div>
        )}
      </div>
    </Modal>
  );
}
