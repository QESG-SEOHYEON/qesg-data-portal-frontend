// 재사용 검색 위젯 — 검색바 + 자동완성 드롭다운 일체 (검색 명세 4.x)
// 랜딩 HeroSearch / 향후 전용 검색 화면 어디서든 그대로 꽂아 쓴다.
// 데이터 접근은 searchMock() 단일 경계만 사용.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { SearchResultItem, SearchScope } from "@/types";
import { searchMock } from "@/mock/search";
import { layout } from "@/theme/tokens";
import { SearchBar } from "./SearchBar";
import { AutocompleteDropdown } from "./AutocompleteDropdown";

interface Props {
  /** 검색 영역 최대 폭 (기본 명세값) */
  maxWidth?: number;
  /** 선택 시 추가 동작(칩/외부 연동용). 미지정 시 기본 라우팅만 */
  onSelected?: (item: SearchResultItem) => void;
}

export function SearchWidget({ maxWidth = layout.searchMaxWidth, onSelected }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [focused, setFocused] = useState(false);

  // 입력/스코프 변경 시 즉시 재검색. 실제 API 전환 시 200~300ms 디바운스 권장.
  const result = useMemo(() => searchMock(query, scope), [query, scope]);
  const showDropdown = focused && query.trim().length > 0;

  // 선택은 {type, id, label} 객체 단위로 — 같은 라벨이어도 type 분기로 동작이 갈린다.
  function handleSelect(item: SearchResultItem) {
    // eslint-disable-next-line no-console
    console.log("selected:", item);
    if (item.type === "company") {
      navigate(`/company/${item.id}`);
    }
    // indicator: TODO 지표 조회 결과 화면 (후속)
    onSelected?.(item);
  }

  // 결과 클릭 없이 그냥 검색(Enter) → 조건 검색 페이지로 검색어 전달
  function handleSubmit() {
    const q = query.trim();
    if (!q) return;
    navigate(`/bulk?q=${encodeURIComponent(q)}`);
  }

  return (
    <div style={{ width: "100%", maxWidth, position: "relative", margin: "0 auto" }}>
      <SearchBar
        query={query}
        scope={scope}
        onQueryChange={setQuery}
        onScopeChange={setScope}
        onFocus={() => setFocused(true)}
        onClear={() => setQuery("")}
        onSubmit={handleSubmit}
      />
      {showDropdown && (
        <AutocompleteDropdown result={result} query={query} onSelect={handleSelect} />
      )}
    </div>
  );
}
