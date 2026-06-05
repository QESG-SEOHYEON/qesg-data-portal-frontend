# QESG 데이터 포털 — 프론트엔드 (목업)

QESG 데이터 포털 베타의 프론트엔드. "ESG 데이터의 DART"를 지향하는 외부 ESG 데이터 조회 포털.

> 현 단계: **독립 목업** — 목(mock) 데이터로 화면/동작을 완성하고, 백엔드 API는 추후 데이터 소스 경계(`src/mock/search.ts`)만 교체해 붙인다.

## Tech Stack

- React 19 + TypeScript + Vite
- Ant Design 5
- (타깃 스택: + Refine, Glide Data Grid, Recharts — 조회/테이블/차트 단계에서 도입)

## 시작하기

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # 타입체크 + 프로덕션 빌드
```

## 현재 구현 범위 — 검색 진입 화면

기획안 4.1(랜딩/검색) 화면. 한 검색창에서 **기업**과 **지표**를 찾는다.

- 검색조건 드롭다운(전체/기업/지표) + 검색 입력 + 클리어
- 자동완성: 기업/지표 **그룹 분리** 표시, 입력어 하이라이트
- E/S/G 카테고리 브라우징(검색어 없을 때)
- 글자 충돌 3중 방어(그룹 분리 · type/id 기반 선택 · 검색조건 드롭다운)

## 핵심 설계 원칙 (기획안)

- **내부 식별자 비노출**: 지표 내부코드(E1 등)는 데이터엔 있어도 화면에 안 보인다. 라벨만 노출.
- **데이터 소스 경계 단일화**: 모든 데이터 접근은 `searchMock()` 한 함수를 통해서만. 실제 전환 시
  이 함수 내부만 `GET /api/search?q=&scope=` 호출로 교체(응답 형태 `{ companies, indicators }` 유지).
- **선택은 객체 단위**: 항목 클릭 시 라벨 문자열이 아니라 `{ type, id, label }` 객체를 전달 → 같은
  라벨이어도 type 분기로 동작이 갈린다.

## 디렉토리

```
src/
├── types.ts                    # 공통 타입 (Category, SearchScope, Item …)
├── theme/tokens.ts             # 디자인 토큰 + AntD 테마 (명세 5장)
├── mock/
│   ├── companies.ts            # 기업 목 데이터
│   ├── indicators.ts           # 지표 목 데이터 (id=내부코드, 화면 비노출)
│   └── search.ts               # ⭐ 데이터 소스 경계 — searchMock()
└── pages/search/
    ├── SearchPage.tsx          # 컨테이너 (상태: query/scope)
    └── components/
        ├── SearchBar.tsx        # ScopeSelect + Input + Clear
        ├── AutocompleteDropdown.tsx
        ├── ResultRows.tsx       # CompanyResultRow / IndicatorResultRow
        ├── CategoryBrowse.tsx   # E/S/G 칩 + 지표 목록
        ├── CategoryBadge.tsx
        └── HighlightText.tsx
```

## 다음 단계 (후속 문서/화면)

- 검색 결과 / 기업 단건 상세(E·S·G 탭, 차트↔테이블 토글, **셀 단위 출처·연도 뱃지**)
- 대량 조회 테이블(기업 회원, Glide Data Grid)
- AI 어시스턴트(원문 근거 자연어 질의)
- 회원 권한 경계 / 잠금 UI 패턴
