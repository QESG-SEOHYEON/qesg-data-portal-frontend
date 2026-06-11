// 카테고리로 둘러보기 — 소그룹 접이식 트리(카테고리 > 소그룹 > 지표).
// 검색(키워드 알 때)과 달리 "둘러보기" 입구. 소그룹/지표 클릭 → 통합검색 조회로 진입.
// 데이터는 지표 추가 패널과 동일 소스(getIndicatorColumns 노출 + SUBGROUPS). 표준코드(GRI) 비노출.
import { useState } from "react";
import { useNavigate } from "react-router";
import { CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";
import type { Category } from "@/types";
import { getIndicatorColumns } from "@/mock/indicatorSearch";
import { SUBGROUPS } from "@/mock/indicatorGrouping";
import { colors, categoryColors } from "@/theme/tokens";

const CATS: Category[] = ["E", "S", "G"];

export function CategoryBrowse() {
  const navigate = useNavigate();
  const cols = getIndicatorColumns(); // 노출 지표만
  const [openCat, setOpenCat] = useState<Set<string>>(new Set());
  const [openGroup, setOpenGroup] = useState<Set<string>>(new Set());

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    set((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  return (
    <div
      style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: "10px 12px",
        textAlign: "left",
      }}
    >
      <div
        style={{ fontSize: 13.5, fontWeight: 700, color: colors.textBase, padding: "6px 6px 10px" }}
      >
        카테고리로 둘러보기
      </div>

      {CATS.map((cat) => {
        const meta = categoryColors[cat];
        const groups = SUBGROUPS.filter(
          (sg) => sg.category === cat && cols.some((c) => c.groupCode === sg.code),
        );
        const catOpen = openCat.has(cat);
        return (
          <div key={cat}>
            {/* 1단: 카테고리 */}
            <button onClick={() => toggle(setOpenCat, cat)} style={rowStyle(false)}>
              {catOpen ? <CaretDownOutlined style={caret} /> : <CaretRightOutlined style={caret} />}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: meta.fg,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.textBase }}>
                {meta.name}
              </span>
              <span style={{ fontSize: 11.5, color: colors.textHint }}>{groups.length}개 분야</span>
            </button>

            {catOpen &&
              groups.map((sg) => {
                const inds = cols.filter((c) => c.groupCode === sg.code);
                const gOpen = openGroup.has(sg.code);
                return (
                  <div key={sg.code}>
                    {/* 2단: 소그룹 */}
                    <button
                      onClick={() => toggle(setOpenGroup, sg.code)}
                      style={rowStyle(false, 22)}
                    >
                      {gOpen ? (
                        <CaretDownOutlined style={caret} />
                      ) : (
                        <CaretRightOutlined style={caret} />
                      )}
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.textBase }}>
                        {sg.name}
                      </span>
                      <span style={{ fontSize: 11.5, color: colors.textHint }}>{inds.length}</span>
                    </button>

                    {/* 3단: 개별 지표 */}
                    {gOpen && (
                      <div
                        style={{
                          padding: "2px 0 8px 44px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        {inds.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => navigate(`/bulk?col=${encodeURIComponent(c.id)}`)}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.borderColor = colors.primary)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.borderColor = colors.border)
                            }
                            style={{
                              border: `1px solid ${colors.border}`,
                              background: colors.bgPage,
                              color: colors.textBase,
                              fontSize: 13,
                              padding: "5px 12px",
                              borderRadius: 14,
                              cursor: "pointer",
                              transition: "border-color 0.15s",
                              wordBreak: "keep-all",
                            }}
                          >
                            {c.label}
                          </button>
                        ))}
                        <button
                          onClick={() => navigate(`/bulk?group=${encodeURIComponent(sg.code)}`)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: colors.primary,
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: "5px 4px",
                          }}
                        >
                          조회 →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        );
      })}

      {/* 법규위반·제재 (leaf) — 클릭 시 제재 그리드로 */}
      <button
        onClick={() => navigate(`/bulk?col=__sanctions`)}
        style={rowStyle(false)}
        onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgPage)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ width: 12, display: "inline-block" }} />
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#6E5A36",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.textBase }}>법규위반·제재</span>
        <span style={{ fontSize: 11.5, color: colors.textHint }}>테마별 제재 건수 →</span>
      </button>
    </div>
  );
}

const caret = { fontSize: 10, color: colors.textHint } as const;
function rowStyle(_active: boolean, indent = 0): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    padding: `8px 6px 8px ${6 + indent}px`,
    borderRadius: 6,
  };
}
