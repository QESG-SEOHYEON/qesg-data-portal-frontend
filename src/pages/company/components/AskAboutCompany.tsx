// 이 기업에 대해 물어보기 — 단일 기업 맥락 채팅(워크스페이스와 동일 톤).
// 단일 기업 질문 → 인라인 즉답. 다른 기업·지표 조합 필요 → AI가 역질문(네/아니오) 후 워크스페이스로 이동(질문 전달).
// 안전선: 단일 기업 범위, 답변은 데이터 구조로만(평가·기업 간 비교 없음 — 비교는 워크스페이스로).
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
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
import type { ViewerPlan } from "@/types";
import { aiMode, CAN, lockCta } from "@/mock/accessRules";
import { Locked } from "@/components/Locked";
import { colors } from "@/theme/tokens";

type Answer =
  | { kind: "bar"; title: string; unit: string; series: { year: number; value: number }[] }
  | { kind: "boolean"; title: string; items: { label: string; ok: boolean }[] }
  | { kind: "table"; title: string; rows: { label: string; value: string }[] }
  | { kind: "tags"; title: string; tags: string[] };

// 인라인 답변 풀(단일 기업) — 키워드로 매칭
const ANSWERS: { match: RegExp; a: Answer }[] = [
  {
    match: /온실가스|배출|scope|탄소/i,
    a: {
      kind: "bar",
      title: "온실가스 배출량(Scope 1) 추이입니다.",
      unit: "tCO₂eq",
      series: [
        { year: 2022, value: 49200 },
        { year: 2023, value: 50300 },
        { year: 2024, value: 51237 },
        { year: 2025, value: 50120 },
      ],
    },
  },
  {
    match: /목표|공시했|가입|선언|도입|여부/i,
    a: {
      kind: "boolean",
      title: "관련 공시 현황입니다.",
      items: [
        { label: "탄소중립 목표 선언", ok: true },
        { label: "RE100 가입", ok: false },
      ],
    },
  },
  {
    match: /요약|주요|환경\s*데이터|정리/i,
    a: {
      kind: "table",
      title: "주요 환경 데이터입니다.",
      rows: [
        { label: "온실가스 (Scope 1)", value: "51,237 tCO₂eq" },
        { label: "재생에너지 사용 비율", value: "34.2%" },
        { label: "용수 재이용률", value: "12.8%" },
      ],
    },
  },
  {
    match: /기준|검증|gri|sasb|tcfd|작성/i,
    a: { kind: "tags", title: "작성 기준 및 검증 현황입니다.", tags: ["GRI", "SASB", "TCFD", "제3자 검증 완료"] },
  },
];
const DEFAULT_ANSWER: Answer = {
  kind: "table",
  title: "이 기업의 관련 공시 데이터입니다.",
  rows: [
    { label: "온실가스 (Scope 1)", value: "51,237 tCO₂eq" },
    { label: "사외이사 비중", value: "42.9%" },
    { label: "전자투표제", value: "도입" },
  ],
};
// 다른 기업·지표 조합 등 워크스페이스가 필요한 질의
const NEEDS_WORKSPACE = /비교|다른\s*기업|타사|동종|업종|순위|랭킹|정렬|포트폴리오|여러|함께|추가로|모아|목록|상위|하위/i;
// 워크스페이스로 이어지는 예시 질문(역질문 유도)
const WS_EXAMPLES = ["동종업계와 온실가스 비교", "업종 내 전자투표제 미도입 기업"];

function pickAnswer(q: string): Answer {
  return ANSWERS.find((x) => x.match.test(q))?.a ?? DEFAULT_ANSWER;
}

// idle 자동 데모 (타이핑 → 답변 순환). 사용자가 입력 시작하면 중단.
type Phase = "typing" | "loading" | "answer";
const DEMOS: { q: string; a: Answer }[] = [
  { q: "이 기업의 온실가스 배출량(Scope 1) 추이는?", a: ANSWERS[0].a },
  { q: "탄소중립 목표를 공시했어?", a: ANSWERS[1].a },
  { q: "주요 환경 데이터를 요약해줘", a: ANSWERS[2].a },
  { q: "지속가능경영보고서는 어떤 기준으로 작성됐어?", a: ANSWERS[3].a },
];

type CEntry =
  | { kind: "user"; text: string }
  | { kind: "answer"; a: Answer }
  | { kind: "confirm"; q: string }
  | { kind: "mosaic"; reason: "login" | "upgrade" }
  | { kind: "note"; text: string };

export function AskAboutCompany({
  detail,
  tier,
  onLogin,
  onUpgrade,
}: {
  detail: CompanyDetail;
  tier: ViewerPlan;
  onLogin?: () => void;
  onUpgrade?: () => void;
}) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false); // 사용자 입력 시작 → 데모 중단, 대화 모드
  const [msgs, setMsgs] = useState<CEntry[]>([]);
  const [thinking, setThinking] = useState(false); // 답변 전 고민 텀
  const [aiUsedToday, setAiUsedToday] = useState(0); // 세션 카운터(개인X 하루 1회)
  const scrollRef = useRef<HTMLDivElement>(null);

  // 등급 분기: AI 이용 모드 / 워크스페이스 핸드오프 가능 여부 (CAN/aiMode만 참조)
  const mode = aiMode(tier); // false(비회원) | "daily1"(개인X) | true(개인O+)
  const canHandoff = CAN(tier, "workspace"); // 핸드오프는 개인O+ 만(유료)
  // 시도 차단 사유 — null이면 정상 응답
  const blockReason = (): "login" | "upgrade" | null => {
    if (mode === false) return "login";
    if (mode === "daily1" && aiUsedToday >= 1) return "upgrade";
    return null;
  };

  // idle 자동 데모
  const [view, setView] = useState(DEMOS[0]);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const idxRef = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (started) return; // 대화 시작 시 데모 정지
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
          push(window.setTimeout(() => {
            if (!mounted) return;
            setPhase("loading");
            push(window.setTimeout(() => {
              if (!mounted) return;
              setPhase("answer");
              push(window.setTimeout(() => {
                idxRef.current = (idxRef.current + 1) % DEMOS.length;
                run();
              }, 4200));
            }, 1000));
          }, 450));
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
  }, [started]);

  const push = (e: CEntry) => {
    setMsgs((prev) => [...prev, e]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }), 30);
  };
  function goWorkspace(q: string) {
    // 비교·동종업계 질의 → 동종업계(같은 업종) 피어를 담아 이동, 그 외 → 이 기업만
    if (/비교|동종/.test(q)) {
      navigate(`/workspace?peers=${encodeURIComponent(detail.industry)}&ai=${encodeURIComponent(q)}`);
    } else {
      navigate(`/workspace?company=${detail.id}${q ? `&ai=${encodeURIComponent(q)}` : ""}`);
    }
  }
  function submit(text: string) {
    const q = text.trim();
    if (!q || thinking) return;
    setInput("");
    setStarted(true); // 데모 중단
    push({ kind: "user", text: q });

    // 등급 차단 — 모자이크(흐림+잠금) + 유도 모달, 핸드오프 비활성
    const blocked = blockReason();
    if (blocked) {
      setThinking(true);
      setTimeout(() => {
        setThinking(false);
        push({ kind: "mosaic", reason: blocked });
        (blocked === "login" ? onLogin : onUpgrade)?.();
      }, 700);
      return;
    }

    setThinking(true); // 고민 텀
    setTimeout(() => {
      setThinking(false);
      if (mode === "daily1") setAiUsedToday((n) => n + 1); // 1회 소진
      if (NEEDS_WORKSPACE.test(q)) {
        // 비교·조합은 워크스페이스 필요 — 핸드오프 가능(개인O+)일 때만 이동 제안
        if (canHandoff) push({ kind: "confirm", q });
        else
          push({
            kind: "note",
            text: "여러 기업·지표를 조합하는 작업은 워크스페이스에서 진행돼요. 기업/플랜 회원으로 이용할 수 있습니다.",
          });
      } else push({ kind: "answer", a: pickAnswer(q) });
    }, 900);
  }

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span style={{ color: colors.accent, fontSize: 16 }}>✦</span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textBase }}>
          이 기업에 대해 물어보기
        </h2>
      </div>

      <div style={{ background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18 }}>
        {/* 채팅 영역 */}
        <div
          ref={scrollRef}
          style={{
            background: colors.bgPage,
            borderRadius: 10,
            padding: 14,
            minHeight: 200,
            maxHeight: 360,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {!started ? (
            <>
              {/* 사용자 질문 (타이핑) */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "80%", background: colors.primary, color: "#fff", fontSize: 13.5, fontWeight: 500, padding: "9px 13px", borderRadius: "12px 12px 4px 12px" }}>
                  {typed}
                  {phase === "typing" && <span style={{ opacity: 0.5 }}>▍</span>}
                </div>
              </div>
              {/* AI 답변 */}
              {phase !== "typing" && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${colors.accent}1A`, color: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    ✦
                  </div>
                  <div style={{ maxWidth: "85%", flex: 1, background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: "4px 12px 12px 12px", padding: 14 }}>
                    {phase === "loading" ? (
                      <span style={{ fontSize: 13, color: colors.textSub }}>데이터 찾는 중…</span>
                    ) : (
                      <AnswerView a={view.a} />
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {msgs.length === 0 && !thinking && (
                <div style={{ fontSize: 12.5, color: colors.textHint, lineHeight: 1.5 }}>
                  무엇이든 물어보세요 — {detail.name}의 ESG 데이터로 답해드려요. (다른 기업·지표 조합은 워크스페이스로 이어집니다)
                </div>
              )}
              {msgs.map((m, i) => (
                <CEntryView
                  key={i}
                  m={m}
                  tier={tier}
                  onYes={(q) => goWorkspace(q)}
                  onNo={() => push({ kind: "note", text: "그럼 이 기업 기준으로 계속 도와드릴게요." })}
                  onCta={(reason) => (reason === "login" ? onLogin : onUpgrade)?.()}
                />
              ))}
              {thinking && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${colors.accent}1A`, color: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    ✦
                  </div>
                  <div style={{ background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: "4px 12px 12px 12px", padding: "10px 14px", fontSize: 13, color: colors.textSub }}>
                    데이터 찾는 중…
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 입력 — 비회원은 클릭 시 로그인 화면 */}
        <div style={{ display: "flex", gap: 8, margin: "14px 0 10px" }}>
          <Input
            size="large"
            placeholder={`${detail.name}의 ESG 정보를 물어보세요`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onMouseDown={mode === false ? (e) => { e.preventDefault(); onLogin?.(); } : undefined}
            onFocus={() => (mode === false ? onLogin?.() : setStarted(true))}
            onPressEnter={() => submit(input)}
            readOnly={mode === false}
            style={{ flex: 1, ...(mode === false ? { cursor: "pointer" } : {}) }}
          />
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={() => (mode === false ? onLogin?.() : submit(input))}
          />
        </div>

        {/* 예시 칩 — 단일 기업 + (틸) 워크스페이스 유도 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COMPANY_AI_EXAMPLES.map((q) => (
            <button
              key={q}
              onClick={() => (mode === false ? onLogin?.() : submit(q))}
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
          {WS_EXAMPLES.map((q) => (
            <button
              key={q}
              onClick={() => (mode === false ? onLogin?.() : submit(q))}
              title="워크스페이스로 이어지는 질문"
              style={{
                border: `1px solid ${colors.accent}`,
                background: `${colors.accent}10`,
                color: colors.accent,
                fontSize: 12.5,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 16,
                cursor: "pointer",
              }}
            >
              {q} →
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CEntryView({
  m,
  tier,
  onYes,
  onNo,
  onCta,
}: {
  m: CEntry;
  tier: ViewerPlan;
  onYes: (q: string) => void;
  onNo: () => void;
  onCta: (reason: "login" | "upgrade") => void;
}) {
  if (m.kind === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ maxWidth: "80%", background: colors.primary, color: "#fff", fontSize: 13.5, fontWeight: 500, padding: "9px 13px", borderRadius: "12px 12px 4px 12px" }}>
          {m.text}
        </div>
      </div>
    );
  }
  if (m.kind === "note") {
    return <div style={{ fontSize: 12.5, color: colors.textHint, lineHeight: 1.5 }}>{m.text}</div>;
  }
  if (m.kind === "mosaic") {
    // 모자이크 = 흐림 + 잠금 오버레이(답이 "있지만 잠김")
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${colors.accent}1A`, color: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
          ✦
        </div>
        <div style={{ maxWidth: "85%", flex: 1, background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: "4px 12px 12px 12px", padding: 14 }}>
          <Locked cta={lockCta(tier)} onClick={() => onCta(m.reason)}>
            <AnswerView a={DEFAULT_ANSWER} />
          </Locked>
        </div>
      </div>
    );
  }
  // AI 좌측 (아바타 + 카드)
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${colors.accent}1A`, color: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
        ✦
      </div>
      <div style={{ maxWidth: "85%", flex: 1, background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: "4px 12px 12px 12px", padding: 14 }}>
        {m.kind === "answer" ? (
          <AnswerView a={m.a} />
        ) : (
          <div>
            <div style={{ fontSize: 13.5, color: colors.textBase, lineHeight: 1.6, marginBottom: 10 }}>
              이 작업은 <b>여러 기업·지표 조합</b>이 필요해요. 워크스페이스에서 진행할 수 있어요. 이동할까요?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button type="primary" size="small" style={{ background: colors.primary, borderColor: colors.primary }} onClick={() => onYes(m.q)}>
                네, 워크스페이스로 →
              </Button>
              <Button size="small" onClick={onNo}>
                아니오
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnswerView({ a }: { a: Answer }) {
  return (
    <div>
      <div style={{ fontSize: 13.5, color: colors.textBase, fontWeight: 600, marginBottom: 10 }}>{a.title}</div>

      {a.kind === "bar" && (
        <>
          <div style={{ height: 150, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "10px 8px 4px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.series} margin={{ top: 16, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEE" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: colors.textSub }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSub }} tickLine={false} axisLine={false} width={44} />
                <Bar dataKey="value" fill={colors.primary} radius={[3, 3, 0, 0]} maxBarSize={40}>
                  <LabelList dataKey="value" position="top" style={{ fontSize: 10, fill: colors.textSub }} formatter={(v) => Number(v).toLocaleString("ko-KR")} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 11.5, color: colors.textHint, marginTop: 8 }}>단위 {a.unit}</div>
        </>
      )}

      {a.kind === "boolean" && (
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
          {a.items.map((it, idx) => (
            <div
              key={it.label}
              title={it.ok ? "공시 — 클릭 시 상세에서 확인" : "미도입"}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.rowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderTop: idx === 0 ? "none" : `1px solid ${colors.border}`, cursor: "default" }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: it.ok ? colors.accent : colors.textSub, width: 56, flexShrink: 0 }}>
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
              title={`${r.label}: ${r.value}`}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.rowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderTop: idx === 0 ? "none" : `1px solid ${colors.border}`, cursor: "default" }}
            >
              <span style={{ flex: 1, fontSize: 13, color: colors.textBase }}>{r.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.textBase, fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {a.kind === "tags" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {a.tags.map((t) => (
            <span key={t} style={{ fontSize: 12, fontWeight: 600, color: colors.textSub, background: colors.bgSurface, border: `1px solid ${colors.border}`, padding: "3px 9px", borderRadius: 6 }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
