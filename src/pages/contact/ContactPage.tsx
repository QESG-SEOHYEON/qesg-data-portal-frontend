// 컨택 / 문의 (가벼운 목업) — 데이터 요청 · 도입/플랜 문의 · 오류 제보 3분기 폼.
// 실제 제출(메일/티켓)은 후속. 지금은 접수 성공 토스트만.
import { useState } from "react";
import { useSearchParams } from "react-router";
import { App, Button, Input, Select } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { colors } from "@/theme/tokens";

const TYPES = [
  { value: "data", label: "데이터 요청 (미수집 지표·기업)" },
  { value: "plan", label: "도입 / 기업 플랜 문의" },
  { value: "bug", label: "오류 · 데이터 제보" },
  { value: "etc", label: "기타 문의" },
];

export function ContactPage() {
  const { message } = App.useApp();
  const [sp] = useSearchParams();
  const initType = TYPES.some((t) => t.value === sp.get("type")) ? sp.get("type")! : "data";

  const [type, setType] = useState(initType);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  // 진입 맥락(기업/지표) 자동 첨부 — 데이터 없음 CTA 등에서 넘어온 경우
  const ctx = sp.get("ctx") ?? undefined;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = !!name.trim() && emailOk && !!content.trim();

  const submit = () => {
    if (!canSubmit) {
      message.warning("이름·이메일·내용을 확인해주세요");
      return;
    }
    message.success("문의가 접수되었습니다. 빠르게 회신드릴게요. (데모)");
    setName("");
    setCompany("");
    setEmail("");
    setContent("");
  };

  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: colors.textBase }}>문의하기</h1>
          <p style={{ margin: "12px 0 0", fontSize: 14.5, color: colors.textSub, lineHeight: 1.6 }}>
            찾는 데이터가 없거나 도입을 검토 중이시라면 남겨주세요. 영업일 기준 빠르게 회신드립니다.
          </p>
        </div>

        <div
          style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <Field label="문의 유형">
            <Select
              size="large"
              value={type}
              onChange={setType}
              options={TYPES}
              style={{ width: "100%" }}
            />
          </Field>

          {ctx && (
            <div
              style={{
                fontSize: 12.5,
                color: colors.textSub,
                background: colors.bgPage,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              참고 정보가 함께 전달됩니다: <b style={{ color: colors.textBase }}>{ctx}</b>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Field label="이름" style={{ flex: 1, minWidth: 200 }}>
              <Input size="large" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
            </Field>
            <Field label="회사 (선택)" style={{ flex: 1, minWidth: 200 }}>
              <Input size="large" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="회사명" />
            </Field>
          </div>

          <Field label="이메일">
            <Input
              size="large"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              status={email && !emailOk ? "error" : undefined}
            />
          </Field>

          <Field label="내용">
            <Input.TextArea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="필요한 데이터(지표·기업·연도)나 문의 내용을 적어주세요."
            />
          </Field>

          <Button
            type="primary"
            size="large"
            icon={<MailOutlined />}
            onClick={submit}
            disabled={!canSubmit}
            style={{ background: colors.accent, borderColor: colors.accent }}
          >
            문의 보내기
          </Button>
          <div style={{ fontSize: 12, color: colors.textHint, textAlign: "center" }}>
            또는 <b>info@qesg.co.kr</b> 로 바로 메일 주셔도 됩니다. · 본 폼은 데모용입니다.
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textSub, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
