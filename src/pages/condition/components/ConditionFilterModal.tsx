// 통합 필터 모달 — 표시 지표·회계연도·업종·기업코드. draft → "변경"에서 반영.
// "+ 지표 추가" 컬럼 클릭도 이 모달의 표시 지표 섹션을 열어 연동(추가 경로 일원화).
import { useEffect, useRef, useState } from "react";
import { Modal, Checkbox, Input } from "antd";
import { SearchOutlined, CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";
import type { Category } from "@/types";
import type { IndicatorColumn } from "@/mock/indicatorSearch";
import { SEARCH_YEARS, SEARCH_LATEST_YEAR } from "@/mock/indicatorSearch";
import { SUBGROUPS } from "@/mock/indicatorGrouping";
import { colors, categoryColors } from "@/theme/tokens";
import { DataNotFoundCta } from "@/components/DataNotFoundCta";

const CATS: Category[] = ["E", "S", "G"];

export interface FilterValue {
  sectors?: string[]; // 업종 복수 선택
  visibleIds: string[];
  companyIds?: string[];
  years: number[]; // 다중 선택(최소 1)
  sanctions: boolean; // 법규위반·제재 컬럼 표시
}

type Section = "columns" | "year" | "sector" | "codes";
const SECTIONS: { key: Section; label: string }[] = [
  { key: "columns", label: "표시 지표" },
  { key: "year", label: "회계연도" },
  { key: "sector", label: "업종" },
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
  const [pickedSectors, setPickedSectors] = useState<string[]>(value.sectors ?? []);
  const [visibleIds, setVisibleIds] = useState<string[]>(value.visibleIds);
  const [years, setYears] = useState<number[]>(value.years);
  const [stockText, setStockText] = useState("");
  const [bizText, setBizText] = useState("");
  // 표시 지표 패널: 미니 카테고리 + 지표 검색
  const [colCat, setColCat] = useState<Category | "all" | "sanction">("all");
  const [colQuery, setColQuery] = useState("");
  const [sanctions, setSanctions] = useState<boolean>(value.sanctions);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [colCat, colQuery]);

  // 열릴 때 draft 초기화 + 진입 섹션 설정
  useEffect(() => {
    if (open) {
      setSection(initialSection);
      setPickedSectors(value.sectors ?? []);
      setVisibleIds(value.visibleIds);
      setYears(value.years);
      setSanctions(value.sanctions);
      const ids = value.companyIds ?? [];
      setStockText(ids.filter((c) => c.length === 6).join("\n"));
      setBizText(ids.filter((c) => c.length === 10).join("\n"));
      setColCat("all");
      setColQuery("");
      // 선택된 지표가 있는 소그룹은 펼친 채로 시작
      const selGroups = new Set(
        allCols.filter((c) => value.visibleIds.includes(c.id)).map((c) => c.groupCode),
      );
      setOpenGroups(selGroups);
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
    onApply({
      sectors: pickedSectors.length > 0 ? pickedSectors : undefined,
      visibleIds,
      years: ys,
      sanctions,
      companyIds: codes.length > 0 ? codes : undefined,
    });
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
      width={760}
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
            <Panel
              title="표시 지표"
              desc="표에 표시할 지표(컬럼)를 분류로 좁히거나 검색해 선택하세요."
            >
              <div style={{ display: "flex", gap: 14 }}>
                {/* 세로 미니 카테고리 */}
                <div
                  style={{
                    width: 84,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <VCat label="전체" active={colCat === "all"} onClick={() => setColCat("all")} />
                  {CATS.map((c) => (
                    <VCat
                      key={c}
                      label={categoryColors[c].name}
                      active={colCat === c}
                      onClick={() => setColCat(c)}
                    />
                  ))}
                  <VCat
                    label="법규위반·제재"
                    active={colCat === "sanction"}
                    onClick={() => setColCat("sanction")}
                  />
                </div>

                {/* 검색 + 지표 리스트 (법규위반·제재 서브카테고리는 토글 패널) */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {colCat === "sanction" ? (
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 14px",
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <Checkbox checked={sanctions} onChange={(e) => setSanctions(e.target.checked)} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.textBase }}>
                        법규위반·제재 표시
                      </span>
                      <span style={{ fontSize: 11.5, color: colors.textHint }}>
                        테마별 제재 건수 (E/S/G 통합)
                      </span>
                    </label>
                  ) : (
                    <>
                      <Input
                        size="small"
                        allowClear
                        prefix={<SearchOutlined style={{ color: colors.textHint }} />}
                        placeholder="지표 검색 (예: 온실가스)"
                        value={colQuery}
                        onChange={(e) => setColQuery(e.target.value)}
                        style={{ width: "100%", marginBottom: 12 }}
                      />
                  <div
                    ref={listRef}
                    style={{
                      maxHeight: 300,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 18,
                    }}
                  >
                    {(colCat === "all" ? CATS : [colCat]).map((cat) => {
                      const q = colQuery.trim();
                      const catSubgroups = SUBGROUPS.filter((sg) => sg.category === cat);
                      const catHasAny = catSubgroups.some((sg) =>
                        allCols.some(
                          (c) => c.groupCode === sg.code && (q === "" || c.label.includes(q)),
                        ),
                      );
                      if (!catHasAny) return null;
                      // 카테고리 전체 온오프
                      const catIds = allCols
                        .filter((c) => c.category === cat && (q === "" || c.label.includes(q)))
                        .map((c) => c.id);
                      const catSel = catIds.filter((id) => visibleIds.includes(id));
                      const catAllOn = catIds.length > 0 && catSel.length === catIds.length;
                      const catSome = catSel.length > 0 && !catAllOn;
                      return (
                        <div key={cat}>
                          {/* 카테고리 헤더 + 전체 체크박스 */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <Checkbox
                              checked={catAllOn}
                              indeterminate={catSome}
                              onChange={(e) =>
                                setVisibleIds((prev) =>
                                  e.target.checked
                                    ? Array.from(new Set([...prev, ...catIds]))
                                    : prev.filter((id) => !catIds.includes(id)),
                                )
                              }
                            />
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: categoryColors[cat].fg }}>
                              {categoryColors[cat].name}
                            </span>
                            <span style={{ fontSize: 11.5, color: colors.textHint }}>{catIds.length}</span>
                          </div>
                          {/* 소그룹 접이식 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {catSubgroups.map((sg) => {
                              const inds = allCols.filter(
                                (c) => c.groupCode === sg.code && (q === "" || c.label.includes(q)),
                              );
                              if (inds.length === 0) return null;
                              const ids = inds.map((c) => c.id);
                              const selected = ids.filter((id) => visibleIds.includes(id));
                              const allOn = selected.length === ids.length;
                              const some = selected.length > 0 && !allOn;
                              const open = q !== "" || openGroups.has(sg.code);
                              return (
                                <div
                                  key={sg.code}
                                  style={{
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "8px 10px",
                                      background: colors.bgPage,
                                    }}
                                  >
                                    <button
                                      onClick={() =>
                                        setOpenGroups((prev) => {
                                          const n = new Set(prev);
                                          n.has(sg.code) ? n.delete(sg.code) : n.add(sg.code);
                                          return n;
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        padding: 0,
                                      }}
                                    >
                                      {open ? (
                                        <CaretDownOutlined
                                          style={{ fontSize: 10, color: colors.textHint }}
                                        />
                                      ) : (
                                        <CaretRightOutlined
                                          style={{ fontSize: 10, color: colors.textHint }}
                                        />
                                      )}
                                      <span
                                        style={{
                                          fontSize: 13,
                                          fontWeight: 600,
                                          color: colors.textBase,
                                        }}
                                      >
                                        {sg.name}
                                      </span>
                                      <span style={{ fontSize: 11.5, color: colors.textHint }}>
                                        {inds.length}
                                      </span>
                                    </button>
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
                                      <span style={{ fontSize: 12, color: colors.textSub }}>
                                        전체
                                      </span>
                                    </Checkbox>
                                  </div>
                                  {open && (
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "4px 12px",
                                        padding: "8px 12px",
                                      }}
                                    >
                                      {inds.map((c) => (
                                        <Checkbox
                                          key={c.id}
                                          checked={visibleIds.includes(c.id)}
                                          onChange={(e) =>
                                            setVisibleIds((prev) =>
                                              e.target.checked
                                                ? [...prev, c.id]
                                                : prev.filter((x) => x !== c.id),
                                            )
                                          }
                                        >
                                          <span style={{ fontSize: 13 }}>{c.label}</span>
                                        </Checkbox>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Panel>
          )}

          {section === "year" && (
            <Panel
              title="회계연도"
              desc="조회할 회계연도를 선택합니다(복수 선택 가능). 선택한 연도가 표에 연도별 열로 표시됩니다."
            >
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
            <Panel title="업종">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip
                  label="전체"
                  active={pickedSectors.length === 0}
                  onClick={() => setPickedSectors([])}
                />
                {sectors.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    active={pickedSectors.includes(s)}
                    onClick={() =>
                      setPickedSectors((prev) => {
                        const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
                        // 업종 선택 시 기업코드(개별 기업 태그) 해제 — 상호 배타
                        if (next.length > 0) {
                          setStockText("");
                          setBizText("");
                        }
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </Panel>
          )}

          {section === "codes" && (
            <Panel
              title="기업코드 일괄 조회"
              desc="종목코드와 사업자등록번호를 각 칸에 줄바꿈(Enter) 또는 쉼표(,)로 구분해 붙여넣으세요."
            >
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: colors.textSub,
                      marginBottom: 6,
                    }}
                  >
                    종목코드{" "}
                    <span style={{ color: colors.textHint, fontWeight: 400 }}>(6자리)</span>
                  </div>
                  <Input.TextArea
                    rows={7}
                    value={stockText}
                    onChange={(e) => {
                      setStockText(e.target.value);
                      if (e.target.value.trim()) setPickedSectors([]); // 코드 입력 시 업종 해제
                    }}
                    placeholder={"005930\n000660\n035420"}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: colors.textSub,
                      marginBottom: 6,
                    }}
                  >
                    사업자등록번호{" "}
                    <span style={{ color: colors.textHint, fontWeight: 400 }}>(10자리)</span>
                  </div>
                  <Input.TextArea
                    rows={7}
                    value={bizText}
                    onChange={(e) => {
                      setBizText(e.target.value);
                      if (e.target.value.trim()) setPickedSectors([]); // 코드 입력 시 업종 해제
                    }}
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

function Panel({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.textBase, marginBottom: 4 }}>
        {title}
      </div>
      {desc && (
        <div style={{ fontSize: 12.5, color: colors.textSub, marginBottom: 16 }}>{desc}</div>
      )}
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
