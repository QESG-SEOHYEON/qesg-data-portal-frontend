// 이 기업에 대해 AI로 물어보기 — 사용자 질의(풀). 단일 기업 컨텍스트 자동 전제.
// 채팅박스 데모 애니메이션(질문 타이핑 → 구조화된 답) 순환 재생. 워크벤치 연결 TODO.
// 안전선: 단일 기업 범위, 답변은 데이터 구조로만(평가어·기업 간 비교 없음).
// ⚠️ 출처 표시는 사내 정책 확정 전까지 화면에서 끔 — source 데이터 필드는 유지, 렌더만 생략.
import { useEffect, useRef, useState } from "react";
import { Input, Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import type { CompanyDetail } from "@/mock/companyDetail";
import { COMPANY_AI_EXAMPLES } from "@/mock/companyDetail";
import type { SourceCode } from "@/types";
import { colors } from "@/theme/tokens";

type Answer =
  | {
      kind: "bar";
      title: string;
      unit: string;
      source: SourceCode;
      series: { year: number; value: number }[];
    }
  | { kind: "boolean"; title: string; items: { label: string; ok: boolean; source: SourceCode }[] }
  | { kind: "table"; title: string; rows: { label: string; value: string; source: SourceCode }[] }
  | { kind: "tags"; title: string; tags: string[]; source: SourceCode };
type Demo = { q: string; a: Answer };

const DEMOS: Demo[] = [
  {
    q: "이 기업의 5개년 온실가스 배출량(Scope 1) 추이는?",
    a: {
      kind: "bar",
      title: "온실가스 배출량(Scope 1) 5개년 추이입니다.",
      unit: "tCO₂eq",
      source: "ENV",
      series: [
        { year: 2021, value: 48100 },
        { year: 2022, value: 49200 },
        { year: 2023, value: 50300 },
        { year: 2024, value: 51237 },
      ],
    },
  },
  {
    q: "탄소중립 목표를 공시했어?",
    a: {
      kind: "boolean",
      title: "관련 공시 현황입니다.",
      items: [
        { label: "탄소중립 목표 선언", ok: true, source: "DART" },
        { label: "RE100 가입", ok: false, source: "SR" },
      ],
    },
  },
  {
    q: "주요 환경 데이터를 요약해줘",
    a: {
      kind: "table",
      title: "주요 환경 데이터입니다.",
      rows: [
        { label: "온실가스 (Scope 1)", value: "51,237 tCO₂eq", source: "ENV" },
        { label: "재생에너지 사용 비율", value: "34.2%", source: "SR" },
        { label: "용수 재이용률", value: "12.8%", source: "ENV" },
      ],
    },
  },
  {
    q: "지속가능경영보고서는 어떤 기준으로 작성됐어?",
    a: {
      kind: "tags",
      title: "작성 기준 및 검증 현황입니다.",
      tags: ["GRI", "SASB", "TCFD", "제3자 검증 완료"],
      source: "SR",
    },
  },
];

type Phase = "typing" | "loading" | "answer";

function AnswerView({ a }: { a: Answer }) {
  return (
    <div>
      <div style={{ fontSize: 13.5, color: colors.textBase, fontWeight: 600, marginBottom: 10 }}>
        {a.title}
      </div>

      {a.kind === "bar" && (
        <>
          <div
            style={{
              height: 150,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "10px 8px 4px",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.series} margin={{ top: 16, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEE" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fill: colors.textSub }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.textSub }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Bar dataKey="value" fill={colors.primary} radius={[3, 3, 0, 0]} maxBarSize={40}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fontSize: 10, fill: colors.textSub }}
                    formatter={(v) => Number(v).toLocaleString("ko-KR")}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 11.5, color: colors.textHint }}>단위 {a.unit}</span>
          </div>
        </>
      )}

      {a.kind === "boolean" && (
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
          {a.items.map((it, idx) => (
            <div
              key={it.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderTop: idx === 0 ? "none" : `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: it.ok ? colors.accent : colors.textSub,
                  width: 56,
                  flexShrink: 0,
                }}
              >
                {it.ok ? "✓ 공시" : "미도입"}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: colors.textBase }}>{it.label}</span>
            </div>
          ))}
        </div>
      )}

      {a.kind === "table" && (
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
          {a.rows.map((r, idx) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderTop: idx === 0 ? "none" : `1px solid ${colors.border}`,
              }}
            >
              <span style={{ flex: 1, fontSize: 13, color: colors.textBase }}>{r.label}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.textBase,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {a.kind === "tags" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {a.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.textSub,
                background: colors.bgSurface,
                border: `1px solid ${colors.border}`,
                padding: "3px 9px",
                borderRadius: 6,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AskAboutCompany({ detail }: { detail: CompanyDetail }) {
  const [view, setView] = useState<Demo>(DEMOS[0]);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const [input, setInput] = useState("");
  const idxRef = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let mounted = true;
    const push = (id: number) => timers.current.push(id);
    function run() {
      if (!mounted) return;
      const demo = DEMOS[idxRef.current];
      setView(demo);
      setPhase("typing");
      setTyped("");
      let i = 0;
      const type = window.setInterval(() => {
        i++;
        setTyped(demo.q.slice(0, i));
        if (i >= demo.q.length) {
          clearInterval(type);
          push(
            window.setTimeout(() => {
              if (!mounted) return;
              setPhase("loading");
              push(
                window.setTimeout(() => {
                  if (!mounted) return;
                  setPhase("answer");
                  push(
                    window.setTimeout(() => {
                      idxRef.current = (idxRef.current + 1) % DEMOS.length;
                      run();
                    }, 4200),
                  );
                }, 1000),
              );
            }, 450),
          );
        }
      }, 50);
      push(type);
    }
    run();
    return () => {
      mounted = false;
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
  }, []);

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span style={{ color: colors.accent, fontSize: 16 }}>✦</span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textBase }}>
          이 기업에 대해 물어보기
        </h2>
      </div>

      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 18,
        }}
      >
        {/* 채팅박스 데모 */}
        <div
          style={{
            background: colors.bgPage,
            borderRadius: 10,
            padding: 14,
            minHeight: 230,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* 사용자 질문 (우측 버블) */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                maxWidth: "80%",
                background: colors.primary,
                color: "#fff",
                fontSize: 13.5,
                fontWeight: 500,
                padding: "9px 13px",
                borderRadius: "12px 12px 4px 12px",
              }}
            >
              {typed}
              {phase === "typing" && <span style={{ opacity: 0.5 }}>▍</span>}
            </div>
          </div>

          {/* AI 답변 (좌측: 아바타 + 카드) */}
          {phase !== "typing" && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `${colors.accent}1A`,
                  color: colors.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                ✦
              </div>
              <div
                style={{
                  maxWidth: "85%",
                  flex: 1,
                  background: colors.bgSurface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "4px 12px 12px 12px",
                  padding: 14,
                }}
              >
                {phase === "loading" ? (
                  <span style={{ fontSize: 13, color: colors.textSub }}>데이터 찾는 중…</span>
                ) : (
                  <AnswerView a={view.a} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* 입력창 */}
        <Input
          size="large"
          placeholder={`${detail.name}의 ESG 정보를 물어보세요`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ margin: "14px 0 10px" }}
        />

        {/* 예시 칩 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {COMPANY_AI_EXAMPLES.map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              style={{
                border: `1px solid ${colors.border}`,
                background: colors.bgSurface,
                color: colors.textSub,
                fontSize: 12.5,
                padding: "5px 12px",
                borderRadius: 16,
                cursor: "pointer",
              }}
            >
              {q}
            </button>
          ))}
        </div>

        <Button type="primary" onClick={() => console.log("ai-workbench", input)}>
          AI 데이터 질의에서 계속하기 <ArrowRightOutlined />
        </Button>
      </div>
    </section>
  );
}
