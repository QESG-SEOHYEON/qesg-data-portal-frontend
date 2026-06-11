// AI 대화 패널 — 테이블을 자연어로 조작. 답이 텍스트가 아니라 "테이블 변화 + 근거".
// 목업: 정해진 4개 시나리오(A~D)만 반응. 함수 호출=모노 태그, RAG=근거 카드.
// ⚠️ 평가/순위/점수 함수 없음 → 평가성 질의(D)는 데이터 우회.
import { useRef, useState } from "react";
import { Input, App } from "antd";
import { SendOutlined, RightOutlined, LinkOutlined, FunctionOutlined, FileSearchOutlined, BarChartOutlined, LoadingOutlined, CheckOutlined } from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { WORKSPACE_SCENARIOS } from "@/mock/workspace";
import type { WsOp, WsScenario, WsStep, RagCard } from "@/mock/workspace";
import { colors } from "@/theme/tokens";

// "이 기업~" 컨텍스트 인텐트용 — 현재 표 기준 작업 (정렬 깔끔한 수치 지표만)
const CTX_METRICS: Record<string, { code: string; subCode: string | null; title: string }> = {
  온실가스: { code: "E3_1", subCode: "total", title: "온실가스 배출량" },
  용수: { code: "E14", subCode: null, title: "용수 취수량" },
  폐기물: { code: "E16", subCode: null, title: "폐기물 배출량" },
  사외이사: { code: "G5", subCode: null, title: "사외이사 비중" },
};

type Entry =
  | { kind: "user"; text: string }
  | { kind: "step"; tag: string; say: string; pending: boolean }
  | { kind: "rag"; tag: string; card: RagCard }
  | { kind: "chart"; tag: string; code: string; title: string }
  | { kind: "reject"; text: string }
  | { kind: "note"; text: string };

const fade = { animation: "aiFade 0.35s ease" } as const;

export function AiPanel({
  onApplyOp,
  onChartData,
  companyCount = 0,
  admin = false,
}: {
  onApplyOp: (op: WsOp) => void;
  onChartData?: (code: string) => { name: string; value: number }[];
  companyCount?: number;
  admin?: boolean; // 어드민 모드 — 함수 호출 그대로 노출
}) {
  const { message } = App.useApp();
  const [entries, setEntries] = useState<Entry[]>([
    { kind: "note", text: "테이블을 자연어로 조작해요. 예시 칩을 누르거나, 표에 기업이 있으면 \"이 기업들 온실가스 높은 순\"처럼 현재 기업 기준으로 물어보세요." },
  ]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = (e: Entry) => {
    setEntries((prev) => [...prev, e]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }), 30);
  };

  function play(query: string, steps: WsStep[]) {
    if (running) return;
    setRunning(true);
    push({ kind: "user", text: query });
    steps.forEach((step, i) => {
      setTimeout(
        () => {
          if (step.kind === "fn" && step.tag) push({ kind: "step", tag: step.tag, say: step.say ?? step.tag, pending: true });
          else if (step.kind === "rag" && step.card) push({ kind: "rag", tag: step.tag ?? "RAG", card: step.card });
          else if (step.kind === "chart" && step.chart)
            push({ kind: "chart", tag: step.tag ?? "차트", code: step.chart.code, title: step.chart.title });
          else if (step.kind === "reject" && step.text) push({ kind: "reject", text: step.text });
          if (step.op) onApplyOp(step.op);
          if (i === steps.length - 1) {
            // 시퀀스 완료 → 모든 단계 로딩 종료(✓)
            setEntries((prev) => prev.map((e) => (e.kind === "step" ? { ...e, pending: false } : e)));
            setRunning(false);
          }
        },
        850 * (i + 1),
      );
    });
  }
  const run = (sc: WsScenario) => {
    if (sc.needsRows && companyCount === 0) {
      push({ kind: "user", text: sc.query });
      push({ kind: "note", text: "표에 기업이 없어요. 포트폴리오를 불러오거나 기업을 담은 뒤 다시 시도해주세요." });
      return;
    }
    play(sc.query, sc.steps);
  };

  function submit(text: string) {
    const q = text.trim();
    if (!q || running) return;
    setInput("");

    // "이 기업~" 컨텍스트 인텐트 — 현재 표 기준(포트폴리오 로드 없이)
    if (/이\s*기업|이\s*중|여기|현재\s*기업/.test(q)) {
      if (companyCount === 0) {
        push({ kind: "user", text: q });
        push({ kind: "note", text: "표에 기업이 없어요. 먼저 기업을 담거나 포트폴리오를 불러온 뒤 다시 물어봐 주세요." });
        return;
      }
      const mk = Object.keys(CTX_METRICS).find((k) => q.includes(k));
      if (!mk) {
        push({ kind: "user", text: q });
        push({ kind: "note", text: `현재 표의 ${companyCount}개 기업 기준이에요. 어떤 지표를 볼까요? (예: 온실가스, 용수, 폐기물, 사외이사)` });
        return;
      }
      const { code, subCode, title } = CTX_METRICS[mk];
      const desc = /높|많|큰|상위|내림/.test(q);
      const asc = /낮|적|작|하위|오름/.test(q);
      const steps: WsStep[] = [{ kind: "fn", tag: `addIndicator('${code}')`, say: `${title} 지표 불러오는 중`, op: { type: "addIndicator", code } }];
      if (desc || asc)
        steps.push({ kind: "fn", tag: `sortBy('${code}', ${desc ? "desc" : "asc"})`, say: `${desc ? "높은" : "낮은"} 순으로 정렬 중`, op: { type: "sortBy", colId: code, subCode, dir: desc ? "desc" : "asc" } });
      steps.push({ kind: "chart", tag: `차트: ${title}`, chart: { code, title: `${title} — 현재 기업 (FY2025 기준)` } });
      play(q, steps);
      return;
    }

    const lower = q.toLowerCase();
    const hit = WORKSPACE_SCENARIOS.find((s) => s.keywords.some((k) => lower.includes(k.toLowerCase())));
    if (hit) run(hit);
    else {
      push({ kind: "user", text: q });
      push({
        kind: "note",
        text: "목업 데모는 정해진 예시 시나리오와 \"이 기업~\" 컨텍스트 질의에만 반응합니다. 예시 칩을 눌러주세요. (실제 임의 질의 처리는 후속)",
      });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", background: colors.bgSurface }}>
      {/* 대화 영역 (챗박스) */}
      <div ref={scrollRef} style={{ maxHeight: 380, minHeight: 140, overflowY: "auto", padding: 14, background: colors.bgPage, display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map((e, i) => (
          <EntryView key={i} e={e} admin={admin} onLink={() => message.info("원문 링크(목업)")} onChartData={onChartData} />
        ))}
      </div>

      {/* 예시 칩 */}
      <div style={{ padding: "0 12px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {WORKSPACE_SCENARIOS.map((s) => (
          <button
            key={s.id}
            disabled={running}
            onClick={() => run(s)}
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.bgPage,
              color: colors.textBase,
              fontSize: 12,
              padding: "5px 10px",
              borderRadius: 14,
              cursor: running ? "default" : "pointer",
              opacity: running ? 0.5 : 1,
            }}
          >
            {s.chip}
          </button>
        ))}
      </div>

      {/* 입력 */}
      <div style={{ padding: 12, borderTop: `1px solid ${colors.border}`, display: "flex", gap: 8 }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => submit(input)}
          placeholder="테이블을 자연어로 조작…"
          disabled={running}
        />
        <button
          onClick={() => submit(input)}
          disabled={running}
          style={{
            border: "none",
            background: colors.primary,
            color: "#fff",
            borderRadius: 8,
            padding: "0 14px",
            cursor: running ? "default" : "pointer",
          }}
        >
          <SendOutlined />
        </button>
      </div>
    </div>
  );
}

function EntryView({
  e,
  admin,
  onLink,
  onChartData,
}: {
  e: Entry;
  admin: boolean;
  onLink: () => void;
  onChartData?: (code: string) => { name: string; value: number }[];
}) {
  if (e.kind === "user") {
    return (
      <div style={{ ...fade, alignSelf: "flex-end", maxWidth: "85%", background: colors.primary, color: "#fff", padding: "8px 12px", borderRadius: "12px 12px 2px 12px", fontSize: 13 }}>
        {e.text}
      </div>
    );
  }
  if (e.kind === "note") {
    return <div style={{ ...fade, fontSize: 12.5, color: colors.textHint, lineHeight: 1.5 }}>{e.text}</div>;
  }
  if (e.kind === "step") {
    // 어드민: 함수 호출 그대로 / 사용자: 화살표 + 친화 문구
    if (admin) {
      return (
        <div style={{ ...fade, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: colors.textSub }}>
          <RightOutlined style={{ fontSize: 9, color: colors.accent }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: colors.accent, background: `${colors.accent}14`, padding: "1px 6px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 3 }}>
            <FunctionOutlined style={{ fontSize: 10 }} /> 함수
          </span>
          <code style={{ fontFamily: "monospace", fontSize: 12, color: colors.textBase }}>{e.tag}</code>
        </div>
      );
    }
    return (
      <div style={{ ...fade, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.textSub }}>
        <RightOutlined style={{ fontSize: 11, color: colors.accent }} />
        <span>
          {e.say}
          {e.pending ? "…" : ""}
        </span>
        {e.pending ? (
          <LoadingOutlined style={{ fontSize: 12, color: colors.textHint }} />
        ) : (
          <CheckOutlined style={{ fontSize: 12, color: colors.accent }} />
        )}
      </div>
    );
  }
  if (e.kind === "rag") {
    return (
      <div style={{ ...fade, border: `1px solid ${colors.border}`, borderRadius: "4px 12px 12px 12px", padding: 12, background: colors.bgSurface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ color: colors.accent, fontSize: 13 }}>✦</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#5A4F86", background: "#F2EFF8", padding: "1px 6px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 3 }}>
            <FileSearchOutlined style={{ fontSize: 10 }} /> {admin ? "RAG" : "근거"}
          </span>
          <span style={{ fontSize: 11.5, color: colors.textHint }}>{admin ? e.tag : "공시 원문 검색"}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textBase, marginBottom: 4 }}>{e.card.title}</div>
        <div style={{ fontSize: 12.5, color: colors.textSub, lineHeight: 1.6, marginBottom: 8 }}>{e.card.text}</div>
        <div style={{ fontSize: 11.5, color: colors.textHint }}>
          근거: {e.card.source}{" "}
          <a onClick={onLink} style={{ color: colors.primary, fontWeight: 600, cursor: "pointer" }}>
            원문 <LinkOutlined style={{ fontSize: 10 }} />
          </a>
        </div>
      </div>
    );
  }
  if (e.kind === "chart") {
    const data = (onChartData?.(e.code) ?? []).filter((d) => d.value > 0);
    return (
      <div style={{ ...fade, border: `1px solid ${colors.border}`, borderRadius: "4px 12px 12px 12px", padding: 12, background: colors.bgSurface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ color: colors.accent, fontSize: 13 }}>✦</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#3E6B5C", background: "#E9F3EF", padding: "1px 6px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 3 }}>
            <BarChartOutlined style={{ fontSize: 10 }} /> 차트
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.textBase }}>{e.title}</span>
        </div>
        {data.length === 0 ? (
          <div style={{ fontSize: 12, color: colors.textHint, padding: "12px 0" }}>표시할 공시값이 없습니다.</div>
        ) : (
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEE" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.textSub }} tickLine={false} interval={0} angle={-15} textAnchor="end" height={42} />
                <YAxis tick={{ fontSize: 10, fill: colors.textSub }} tickLine={false} width={48} />
                <RTooltip formatter={(v) => Number(v).toLocaleString("ko-KR")} />
                <Bar dataKey="value" fill={colors.primary} radius={[3, 3, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  }
  // reject — 흰 카드(다른 AI 답변과 동일 톤)
  return (
    <div style={{ ...fade, border: `1px solid ${colors.border}`, background: colors.bgSurface, borderRadius: "4px 12px 12px 12px", padding: 12, fontSize: 12.5, color: colors.textSub, lineHeight: 1.6 }}>
      <span style={{ color: colors.accent, fontSize: 13, marginRight: 6 }}>✦</span>
      {e.text}
    </div>
  );
}
