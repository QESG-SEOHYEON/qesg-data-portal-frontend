// 통합 필터 모달 — 표시 지표·회계연도·섹터·기업코드. draft → "변경"에서 반영.
// "+ 지표 추가" 컬럼 클릭도 이 모달의 표시 지표 섹션을 열어 연동(추가 경로 일원화).
import { useEffect, useRef, useState } from "react";
import { Modal, Checkbox, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { Category } from "@/types";
import type { IndicatorColumn } from "@/mock/indicatorSearch";
import { SEARCH_YEARS, SEARCH_LATEST_YEAR } from "@/mock/indicatorSearch";
import { colors, categoryColors } from "@/theme/tokens";
import { DataNotFoundCta } from "@/components/DataNotFoundCta";

const CATS: Category[] = ["E", "S", "G"];

export interface FilterValue {
  sector?: string;
  visibleIds: string[];
  companyIds?: string[];
  years: number[]; // 다중 선택(최소 1)
}

type Section = "columns" | "year" | "sector" | "codes";
const SECTIONS: { key: Section; label: string }[] = [
  { key: "columns", label: "표시 지표" },
  { key: "year", label: "회계연도" },
  { key: "sector", label: "섹터" },
  { key: "codes", label: "기업코드" },
];

export function ConditionFilterModal({
  open,
  onClose,
  onApply,
  value,
  allCols,
  sectors,
  initialSection = "columns",
}: {
  open: boolean;
  onClose: () => void;
  onApply: (next: FilterValue) => void;
  value: FilterValue;
  allCols: IndicatorColumn[];
  sectors: string[];
  initialSection?: Section;
}) {
  const [section, setSection] = useState<Section>(initialSection);
  const [sector, setSector] = useState<string | undefined>(value.sector);
  const [visibleIds, setVisibleIds] = useState<string[]>(value.visibleIds);
  const [years, setYears] = useState<number[]>(value.years);
  const [stockText, setStockText] = useState("");
  const [bizText, setBizText] = useState("");
  // 표시 지표 패널: 미니 카테고리 + 지표 검색
  const [colCat, setColCat] = useState<Category | "all">("all");
  const [colQuery, setColQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [colCat, colQuery]);

  // 열릴 때 draft 초기화 + 진입 섹션 설정
  useEffect(() => {
    if (open) {
      setSection(initialSection);
      setSector(value.sector);
      setVisibleIds(value.visibleIds);
      setYears(value.years);
      const ids = value.companyIds ?? [];
      setStockText(ids.filter((c) => c.length === 6).join("\n"));
      setBizText(ids.filter((c) => c.length === 10).join("\n"));
      setColCat("all");
      setColQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function apply() {
    const parse = (t: string, len: number) =>
      t
        .split(/[\s,;]+/)
        .map((s) => s.replace(/[^0-9]/g, ""))
        .filter((s) => s.length === len);
    const codes = [...parse(stockText, 6), ...parse(bizText, 10)];
    const ys = years.length > 0 ? [...years].sort((a, b) => a - b) : [SEARCH_LATEST_YEAR];
    onApply({ sector, visibleIds, years: ys, companyIds: codes.length > 0 ? codes : undefined });
    onClose();
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={apply}
      okText="변경"
      cancelText="닫기"
      title="필터 변경"
      centered
      width={680}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: "flex", minHeight: 360, borderTop: `1px solid ${colors.border}` }}>
        {/* 좌측 섹션 리스트 */}
        <div
          style={{
            width: 150,
            flexShrink: 0,
            borderRight: `1px solid ${colors.border}`,
            padding: "8px 0",
          }}
        >
          {SECTIONS.map((s) => {
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 16px",
                  border: "none",
                  borderLeft: active ? `3px solid ${colors.accent}` : "3px solid transparent",
                  background: active ? colors.bgPage : "transparent",
                  color: active ? colors.textBase : colors.textSub,
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* 우측 패널 */}
        <div style={{ flex: 1, padding: 20, minWidth: 0 }}>
          {section === "columns" && (
            <Panel title="표시 지표" desc="표에 표시할 지표(컬럼)를 분류로 좁히거나 검색해 선택하세요.">
              <div style={{ display: "flex", gap: 14 }}>
                {/* 세로 미니 카테고리 */}
                <div style={{ width: 84, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <VCat label="전체" active={colCat === "all"} onClick={() => setColCat("all")} />
                  {CATS.map((c) => (
                    <VCat key={c} label={categoryColors[c].name} active={colCat === c} onClick={() => setColCat(c)} />
                  ))}
                </div>

                {/* 검색 + 지표 리스트 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    size="small"
                    allowClear
                    prefix={<SearchOutlined style={{ color: colors.textHint }} />}
                    placeholder="지표 검색 (예: 온실가스)"
                    value={colQuery}
                    onChange={(e) => setColQuery(e.target.value)}
                    style={{ width: "100%", marginBottom: 12 }}
                  />
                  <div ref={listRef} style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                    {(colCat === "all" ? CATS : [colCat]).map((cat) => {
                      const q = colQuery.trim();
                      const shown = allCols.filter((c) => c.category === cat && (q === "" || c.label.includes(q)));
                      if (shown.length === 0) return null;
                      const ids = shown.map((c) => c.id);
                      const selected = ids.filter((id) => visibleIds.includes(id));
                      const allOn = selected.length === ids.length;
                      const some = selected.length > 0 && !allOn;
                      return (
                        <div key={cat}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: categoryColors[cat].fg }}>
                              {categoryColors[cat].name}
                              <span style={{ color: colors.textHint, fontWeight: 400, marginLeft: 4 }}>{shown.length}</span>
                            </span>
                            <Checkbox
                              checked={allOn}
                              indeterminate={some}
                              onChange={(e) =>
                                setVisibleIds((prev) =>
                                  e.target.checked
                                    ? Array.from(new Set([...prev, ...ids]))
                                    : prev.filter((id) => !ids.includes(id)),
                                )
                              }
                            >
                              <span style={{ fontSize: 12.5, color: colors.textSub }}>전체</span>
                            </Checkbox>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                            {shown.map((c) => (
                              <Checkbox
                                key={c.id}
                                checked={visibleIds.includes(c.id)}
                                onChange={(e) =>
                                  setVisibleIds((prev) =>
                                    e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                                  )
                                }
                              >
                                <span style={{ fontSize: 13 }}>{c.label}</span>
                              </Checkbox>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {section === "year" && (
            <Panel title="회계연도" desc="조회할 회계연도를 선택합니다(복수 선택 가능). 선택한 연도가 표에 연도별 열로 표시됩니다.">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[...SEARCH_YEARS].reverse().map((y) => (
                  <Chip
                    key={y}
                    label={`FY${y}`}
                    active={years.includes(y)}
                    onClick={() =>
                      setYears((prev) => {
                        if (prev.includes(y)) {
                          const next = prev.filter((x) => x !== y);
                          return next.length > 0 ? next : prev;
                        }
                        return [...prev, y];
                      })
                    }
                  />
                ))}
              </div>
            </Panel>
          )}

          {section === "sector" && (
            <Panel title="섹터" desc="업종으로 기업을 좁힙니다.">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip label="전체" active={!sector} onClick={() => setSector(undefined)} />
                {sectors.map((s) => (
                  <Chip key={s} label={s} active={sector === s} onClick={() => setSector(s)} />
                ))}
              </div>
            </Panel>
          )}

          {section === "codes" && (
            <Panel
              title="기업코드 일괄 조회"
              desc="종목코드와 사업자등록번호를 각 칸에 줄바꿈·쉼표로 구분해 붙여넣으세요."
            >
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textSub, marginBottom: 6 }}>
                    종목코드 <span style={{ color: colors.textHint, fontWeight: 400 }}>(6자리)</span>
                  </div>
                  <Input.TextArea
                    rows={7}
                    value={stockText}
                    onChange={(e) => setStockText(e.target.value)}
                    placeholder={"005930\n000660\n035420"}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textSub, marginBottom: 6 }}>
                    사업자등록번호 <span style={{ color: colors.textHint, fontWeight: 400 }}>(10자리)</span>
                  </div>
                  <Input.TextArea
                    rows={7}
                    value={bizText}
                    onChange={(e) => setBizText(e.target.value)}
                    placeholder={"123-45-67890\n220-81-62517"}
                  />
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <DataNotFoundCta compact />
      </div>
    </Modal>
  );
}

function Panel({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.textBase, marginBottom: 4 }}>{title}</div>
      {desc && <div style={{ fontSize: 12.5, color: colors.textSub, marginBottom: 16 }}>{desc}</div>}
      {children}
    </div>
  );
}

function VCat({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: "8px 10px",
        border: "none",
        borderLeft: active ? `3px solid ${colors.accent}` : "3px solid transparent",
        background: active ? colors.bgPage : "transparent",
        color: active ? colors.textBase : colors.textSub,
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        borderRadius: 4,
      }}
    >
      {label}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? colors.accent : colors.border}`,
        background: active ? `${colors.accent}14` : colors.bgSurface,
        color: active ? colors.accent : colors.textSub,
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        padding: "6px 14px",
        borderRadius: 18,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
