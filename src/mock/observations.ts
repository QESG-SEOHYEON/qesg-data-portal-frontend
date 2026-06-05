// 관측값 목 데이터 (기획안 7.2 observation: 기업 × 지표 × 연도 × 출처 × 값)
// ⚠️ 목업 전용 — 결정적(deterministic) 생성기. Math.random 미사용으로 새로고침해도 값 고정.
// 데이터 정책: 0값 = 비공개(NULL) → value=null. (기획안 7.3)
import type { Observation, SourceCode } from "@/types";
import { COMPANIES } from "./companies";
import { INDICATORS } from "./indicators";

export const YEARS = [2021, 2022, 2023, 2024];

// 카테고리별 대표 출처(목업 단순화). 실제로는 지표별 출처가 다양.
const SOURCE_BY_CATEGORY: Record<string, SourceCode> = {
  E: "ENV", // 환경정보공개시스템
  S: "DART", // 사업보고서
  G: "DART",
};
// 일부 지표는 SR/NGMS/NICE 등 다른 출처로 — 출처 다양성 데모
const SOURCE_OVERRIDE: Record<string, SourceCode> = {
  E1: "SR",
  E3: "SR",
  S4: "SR",
  S1: "NGMS",
  G4: "NICE",
};

// 지표별 기준값(2021) + 연 증감률 — 그럴듯한 추이 생성용
const BASE: Record<string, { base: number; growth: number; decimals: number }> = {
  E1: { base: 1_250_000, growth: -0.04, decimals: 0 },
  E2: { base: 2_100_000, growth: -0.03, decimals: 0 },
  E3: { base: 18.4, growth: -0.05, decimals: 1 },
  E4: { base: 32_000, growth: 0.02, decimals: 0 },
  E5: { base: 8_400, growth: -0.01, decimals: 0 },
  E6: { base: 54_000, growth: -0.02, decimals: 0 },
  S1: { base: 0.32, growth: -0.08, decimals: 2 },
  S2: { base: 22.5, growth: 0.04, decimals: 1 },
  S3: { base: 2, growth: 0, decimals: 0 },
  S4: { base: 38, growth: 0.06, decimals: 0 },
  G1: { base: 1, growth: 0, decimals: 0 }, // 도입여부 0/1
  G2: { base: 12, growth: 0.08, decimals: 1 },
  G3: { base: 1, growth: 0, decimals: 0 }, // 설치여부 0/1
  G4: { base: 25, growth: 0.03, decimals: 1 },
};

// 결정적 의사난수 (회사·지표·연도 인덱스 해시)
function seeded(a: number, b: number, c: number): number {
  const x = Math.sin((a + 1) * 73 + (b + 1) * 19 + (c + 1) * 7) * 10000;
  return x - Math.floor(x); // 0..1
}

function buildObservations(): Observation[] {
  const out: Observation[] = [];

  COMPANIES.forEach((company, ci) => {
    INDICATORS.forEach((ind, ii) => {
      const spec = BASE[ind.id];
      if (!spec) return;
      const source = SOURCE_OVERRIDE[ind.id] ?? SOURCE_BY_CATEGORY[ind.category];

      // 회사별 커버리지 차등: 일부 회사는 특정 지표 자체가 없음(미수집)
      const hasIndicator = seeded(ci, ii, 99) > 0.12; // ~12% 지표 미보유
      if (!hasIndicator) return;

      // 회사별 규모 계수
      const scale = 0.6 + seeded(ci, 0, 1) * 0.9;

      YEARS.forEach((year, yi) => {
        // 0값=비공개(NULL) 시뮬레이션: 일부 연도 미공시
        const undisclosed = seeded(ci, ii, yi) < 0.1;
        let value: number | null;

        if (undisclosed) {
          value = null;
        } else if (spec.decimals === 0 && (ind.id === "G1" || ind.id === "G3")) {
          // 도입/설치 여부: 0/1 (0이면 비공개 정책상 null로)
          const adopted = seeded(ci, ii, yi + 5) > 0.3;
          value = adopted ? 1 : null;
        } else {
          const raw = spec.base * scale * Math.pow(1 + spec.growth, yi);
          const jitter = 0.95 + seeded(ci, ii, yi + 3) * 0.1;
          const v = raw * jitter;
          value = Number(v.toFixed(spec.decimals));
          if (value === 0) value = null; // 0값=비공개
        }

        out.push({
          companyId: company.id,
          indicatorId: ind.id,
          fiscalYear: year,
          sourceCode: source,
          value,
          unit: ind.unit,
        });
      });
    });
  });

  return out;
}

export const OBSERVATIONS: Observation[] = buildObservations();
