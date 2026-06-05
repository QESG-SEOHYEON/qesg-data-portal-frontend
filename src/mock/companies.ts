// 기업 목 데이터 (명세 3.2)
// ⚠️ 목업 전용. "온실원예"·"온실초이스"는 지표 "온실가스 배출량"과
//    글자가 겹치는 충돌 케이스 검증용 — 반드시 유지.
import type { CompanyItem } from "@/types";

export const COMPANIES: CompanyItem[] = [
  { type: "company", id: "005930", label: "삼성전자" },
  { type: "company", id: "000660", label: "SK하이닉스" },
  { type: "company", id: "051910", label: "LG화학" },
  { type: "company", id: "005380", label: "현대자동차" },
  { type: "company", id: "006400", label: "삼성SDI" },
  { type: "company", id: "099999", label: "온실원예(주)" }, // 충돌 테스트용
  { type: "company", id: "088888", label: "온실초이스" }, // 충돌 테스트용
];
