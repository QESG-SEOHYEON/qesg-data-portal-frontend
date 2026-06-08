# QESG 데이터 포털 — 프로젝트 지침 (Claude 세션마다 자동 로드)

> 외부 ESG 데이터 조회 포털(베타)의 프론트엔드. "ESG 데이터의 DART" — 등급/스코어가 아니라
> **출처가 추적되는 원본 수치**가 차별점. 현 단계는 **독립 목업**(백엔드 미연동).

## 작업 규칙 (중요)

- **커밋은 사용자가 명시적으로 요청할 때만.** auto-commit 스킬을 임의 호출하지 말 것.
- **dev 서버를 죽이지 말 것.** 사용자가 직접 켜고 끈다. 검증은 `npm run build`(타입체크+번들)로 한다.
- 의존성 설치는 `npm i`(이 레포는 `.npmrc`에 `legacy-peer-deps=true` — Glide v6 + React 19 충돌 회피).
- 작업 브랜치: `mockup/search-page` (목업 전용). 원격 아직 없음.

## 스택

Vite + React 19 + TS + AntD 5 + react-router 7 + recharts 3 + Glide Data Grid 6.
경로 alias `@/` → `src/`.

## 핵심 설계 원칙 (불변)

1. **내부 식별자 비노출** — 지표 내부코드(E1 등)는 데이터엔 있어도 화면에 절대 안 보인다. 라벨만.
2. **데이터 소스 단일 경계** — 모든 데이터 접근은 단일 함수만 통과(추후 이 함수 내부만 API로 교체):
   - 검색 `mock/search.ts:searchMock()`
   - 기업 상세 `mock/companyDetail.ts:getCompanyDetail()`
   - 기업 ESG 정보 검색(대량) `mock/bulkData.ts:getBulkData()/getBulkCell()`
   - 랜딩 집계 `mock/landing.ts:getCoverageStats/getIndustryCompare/getDisclosureRate/getSectorTrend/...`
   컴포넌트에 값 하드코딩 금지.
3. **0값 = 비공개(NULL)** — 환경 공시에서 0은 미공개. value=null로 취급.
4. **셀 단위 출처·연도** — 모든 데이터 포인트에 출처(DART/SR/NGMS/ENV/NICE)+회계연도. QESG 고유 강점.
5. **과금/잠금 = 데이터 속성** — `mock/access.ts` 단일 권한 레이어. 출처 tier(공개 공시=무료 / SR·NICE 가공=프리미엄) + 다개년 규칙. UI에 잠금 로직 흩지 말 것.

## 네이밍 / 테마 (확정)

- 다기업 조회 메뉴 명칭 = **"기업 ESG 정보 검색"** ("대량 조회" 쓰지 말 것).
- **컬러 테마 = 차콜+틸 (B안)**, `theme/tokens.ts`만 수정하면 전파:
  - primary `#233140`(차콜) / accent `#0F8A6A`(틸) / 배경 `#F4F6F8`.
  - 분류색 E `#1D9E75` · S `#2E75B6` · G `#7F77DD`.
  - ※ 일부 스펙 문서가 '그린 테마'를 적었지만 **미채택**. 차콜+틸 유지.

## 랜딩 위젯 전략

- 타깃 = 엔터프라이즈(자산운용사). 구매 판단 3축: **커버리지·신선도·출처**. "인기 랭킹/이슈 하이라이트"는 제외.
- **집계 위젯 안전선**(IndustryCompare/DisclosureRate/SectorTrend): 집계 단위만, 개별기업 지목·순위·"우수/미흡"·예측 금지, **표본수 병기**, 하단 **면책**(`AggregateDisclaimer`).
- 섹션 순서: 검색 → 카탈로그 → 기업 데이터 피드 → 커버리지 → 집계3종 → (출처·최근업데이트) → 가입 CTA.

## 반응형 (`hooks/useBreakpoint.ts` — 4단계)

mobile <640 / tablet <1024 / desktop <1280 / wide ≥1280.

- 우선순위: **1순위(검색·커버리지·카탈로그) 항상** / 2순위(피드·산업비교·공시율) 모바일 숨김 / 3순위(섹터트렌드·최근업데이트·출처) 먼저 축소.
- **와이드**: 우측 sticky 레일(최근업데이트 + 가입 CTA). **최근업데이트는 항상 화면 오른쪽**(데스크톱 2단에서도 우측 컬럼).
- **요소 단위 처리 원칙**: 텍스트가 뭉개질 바엔 한 줄 `ellipsis` 또는 **요소 하나씩 숨김**(겹침 방지). 위젯 통째로가 아니라 내부 요소 단위로.
- 위젯 등장은 `qesgFadeIn`(styles/anim.css)로 부드럽게.

## 디렉토리

```
src/
├── theme/tokens.ts        # 컬러·레이아웃 토큰 (단일 소스)
├── hooks/useBreakpoint.ts
├── mock/                  # 데이터 경계 (search/companyDetail/bulkData/landing/access/...)
├── components/            # AppHeader(햄버거)·Layout
└── pages/
    ├── search/            # SearchWidget(재사용)
    ├── company/           # 기업 상세 (E/S/G 탭·차트/테이블·tier 잠금)
    ├── bulk/              # 기업 ESG 정보 검색 (Glide 그리드)
    └── landing/           # 랜딩 + 위젯들
```

## 참고 문서 (사용자 작성, Downloads)

- `QESG_베타_기획안_초안.docx` — 기획안
- `qesg-landing-page-mockup-prompt (1).md` — 랜딩 명세(집계 위젯·안전선 포함)
- `qesg-search-page-mockup-spec.md` — 검색 페이지 명세
