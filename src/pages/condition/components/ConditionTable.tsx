// 조건 검색 대량 테이블 — 기업(행)×지표(컬럼), 타입별 셀, 컬럼피커·필터·정렬·잠금·페이지네이션.
// 종합점수·등급·순위 컬럼 없음(안전선). 잠금은 플랜(행 단위) 기준.
import { useMemo, useState } from "react";
import { Select, Checkbox, Button, Dropdown, Tooltip, Tag } from "antd";
import { DownloadOutlined, ApiOutlined, ProfileOutlined, PlusOutlined, CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons";
import type { Category, ViewerPlan } from "@/types";
import {
  getIndicatorColumns,
  getIndicatorRows,
  DEFAULT_COLUMN_IDS,
  FREE_ROW_LIMIT,
} from "@/mock/indicatorSearch";
import type { IndicatorRow } from "@/mock/indicatorSearch";
import { colors, categoryColors } from "@/theme/tokens";
import { CellContent } from "./CellContent";

const CATS: Category[] = ["E", "S", "G"];
const SECTORS = ["반도체", "화학", "자동차", "2차전지", "바이오·제약", "금융", "유통", "철강·금속", "건설", "IT·서비스", "통신", "식품"];
const PAGE = 12;

export function ConditionTable({
  plan,
  initialColumnId,
  initialSector,
  onCompanyOpen,
  onPortfolio,
  onUpgrade,
  companyIds,
  onClearPortfolio,
}: {
  plan: ViewerPlan;
  initialColumnId?: string;
  initialSector?: string;
  onCompanyOpen: (id: string) => void;
  onPortfolio: () => void;
  onUpgrade: () => void;
  companyIds?: string[];
  onClearPortfolio: () => void;
}) {
  const allCols = getIndicatorColumns();
  const [cats, setCats] = useState<Category[]>(["E", "S", "G"]);
  const [sector, setSector] = useState<string | undefined>(initialSector);
  const [visibleIds, setVisibleIds] = useState<string[]>(() => {
    const base = [...DEFAULT_COLUMN_IDS];
    if (initialColumnId && !base.includes(initialColumnId)) base.unshift(initialColumnId);
    return base;
  });
  const [sort, setSort] = useState<{ id: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const canExport = plan === "enterprise";

  // 컬럼: 분류 필터 + 선택된 것만
  const cols = useMemo(
    () => allCols.filter((c) => visibleIds.includes(c.id) && cats.includes(c.category)),
    [allCols, visibleIds, cats],
  );

  const rows = useMemo(() => getIndicatorRows({ sector, companyIds }), [sector, companyIds]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = allCols.find((c) => c.id === sort.id);
    if (!col || col.type !== "numeric") return rows;
    const val = (r: IndicatorRow) => {
      const v = r.cells[sort.id]?.value;
      return typeof v === "number" ? v : null;
    };
    return [...rows].sort((a, b) => {
      const va = val(a),
        vb = val(b);
      if (va === null) return 1;
      if (vb === null) return -1;
      return sort.dir === "desc" ? vb - va : va - vb;
    });
  }, [rows, sort, allCols]);

  const pages = Math.max(1, Math.ceil(sortedRows.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const pageRows = sortedRows.slice(safePage * PAGE, safePage * PAGE + PAGE);

  function toggleSort(id: string) {
    setSort((s) => (s?.id === id ? { id, dir: s.dir === "desc" ? "asc" : "desc" } : { id, dir: "desc" }));
  }

  // 컬럼 추가 메뉴 (분류별)
  const pickerItems = CATS.map((cat) => ({
    key: cat,
    type: "group" as const,
    label: categoryColors[cat].name,
    children: allCols
      .filter((c) => c.category === cat)
      .map((c) => ({
        key: c.id,
        label: (
          <Checkbox
            checked={visibleIds.includes(c.id)}
            onChange={(e) => {
              setVisibleIds((ids) => (e.target.checked ? [...ids, c.id] : ids.filter((x) => x !== c.id)));
            }}
          >
            {c.label}
          </Checkbox>
        ),
      })),
  }));

  return (
    <div>
      {/* 필터 바 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: colors.textSub }}>분류</span>
          <Checkbox.Group
            options={CATS.map((c) => ({ label: categoryColors[c].name, value: c }))}
            value={cats}
            onChange={(v) => setCats(v as Category[])}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: colors.textSub }}>섹터</span>
          <Select
            allowClear
            placeholder="전체"
            style={{ width: 150 }}
            value={sector}
            onChange={setSector}
            options={SECTORS.map((s) => ({ label: s, value: s }))}
            disabled={!!companyIds}
          />
        </div>
        <Dropdown menu={{ items: pickerItems }} trigger={["click"]} placement="bottomLeft">
          <Button icon={<PlusOutlined />}>지표(컬럼) 추가</Button>
        </Dropdown>
        <Button icon={<ProfileOutlined />} onClick={onPortfolio}>
          포트폴리오 일괄조회
        </Button>
        {companyIds && (
          <Tag closable onClose={onClearPortfolio} color="processing">
            포트폴리오 {companyIds.length}종목
          </Tag>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Tooltip title={canExport ? "" : "기업 회원 전용"}>
            <Button icon={<DownloadOutlined />} disabled={!canExport} onClick={() => console.log("excel")}>
              Excel
            </Button>
          </Tooltip>
          <Tooltip title={canExport ? "" : "기업 회원 전용"}>
            <Button icon={<ApiOutlined />} disabled={!canExport} onClick={() => console.log("api")}>
              API
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 200 + cols.length * 130 }}>
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    background: colors.bgPage,
                    textAlign: "left",
                    padding: "10px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSub,
                    borderBottom: `1px solid ${colors.border}`,
                    minWidth: 180,
                  }}
                >
                  기업
                </th>
                {cols.map((col) => {
                  const active = sort?.id === col.id;
                  return (
                    <th
                      key={col.id}
                      onClick={col.type === "numeric" ? () => toggleSort(col.id) : undefined}
                      style={{
                        textAlign: "right",
                        padding: "10px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: colors.textSub,
                        borderBottom: `1px solid ${colors.border}`,
                        background: colors.bgPage,
                        cursor: col.type === "numeric" ? "pointer" : "default",
                        minWidth: 120,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: categoryColors[col.category].fg, display: "inline-block" }} />
                        {col.label}
                        {col.unit ? <span style={{ color: colors.textHint, fontWeight: 400 }}> ({col.unit})</span> : null}
                        {col.type === "numeric" && (active ? (sort!.dir === "desc" ? <CaretDownOutlined /> : <CaretUpOutlined />) : null)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => {
                const globalIdx = safePage * PAGE + idx;
                const locked = plan !== "enterprise" && globalIdx >= FREE_ROW_LIMIT;
                return (
                  <tr key={r.id} onClick={() => onCompanyOpen(r.id)} style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = colors.rowHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        background: colors.bgSurface,
                        padding: "12px 14px",
                        borderBottom: `1px solid ${colors.border}`,
                        minWidth: 180,
                      }}
                    >
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.textBase, whiteSpace: "nowrap" }}>{r.name}</div>
                      <div style={{ fontSize: 11.5, color: colors.textSub }}>{r.id} · {r.sector}</div>
                    </td>
                    {cols.map((col) => (
                      <td key={col.id} style={{ padding: "10px 12px", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>
                        <CellContent col={col} cell={r.cells[col.id]} locked={locked} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 잠금 안내 */}
        {plan !== "enterprise" && sortedRows.length > FREE_ROW_LIMIT && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFF8EC", borderTop: `1px solid #F3E2BE`, fontSize: 13, color: "#7A5B17" }}>
            <span style={{ flex: 1 }}>상위 {FREE_ROW_LIMIT}개 기업만 공개 중입니다. 전체 기업·Excel·API는 기업 회원 전용.</span>
            <Button size="small" type="primary" onClick={onUpgrade}>
              가입하고 전체 보기
            </Button>
          </div>
        )}

        {/* 페이지네이션 */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, padding: "12px 0" }}>
          <Button size="small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>이전</Button>
          <span style={{ fontSize: 13, color: colors.textHint }}>{safePage + 1} / {pages}</span>
          <Button size="small" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>다음</Button>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11.5, color: colors.textHint, lineHeight: 1.5 }}>
        본 화면은 공시·수집된 원본 데이터의 나열이며, 평가·등급·순위·투자 자문이 아닙니다. 0값은 비공개로 처리됩니다.
      </div>
    </div>
  );
}
