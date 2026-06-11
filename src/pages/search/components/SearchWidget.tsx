// 재사용 검색 위젯 — 검색바 + 자동완성 드롭다운 일체 (검색 명세 4.x)
// 랜딩 HeroSearch / 향후 전용 검색 화면 어디서든 그대로 꽂아 쓴다.
// 데이터 접근은 searchMock() 단일 경계만 사용.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { SearchResultItem } from "@/types";
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1); // 키보드 강조 항목

  // 토글 바깥 클릭 시 닫기
  useEffect(() => {
    if (!focused) return;
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [focused]);

  // 입력 변경 시 즉시 재검색(전체 범위). 실제 API 전환 시 200~300ms 디바운스 권장.
  const result = useMemo(() => searchMock(query, "all"), [query]);
  const showDropdown = focused && query.trim().length > 0;
  // 드롭다운 표시 순서대로 평탄화 (기업 → 지표)
  const flat: SearchResultItem[] = [...result.companies, ...result.indicators];

  // 선택은 {type, id, label} 객체 단위로 — 같은 라벨이어도 type 분기로 동작이 갈린다.
  function handleSelect(item: SearchResultItem) {
    setFocused(false); // 선택 시 자동완성 토글 닫기
    setActiveIdx(-1);
    if (item.type === "company") {
      navigate(`/company/${item.id}`);
    } else {
      // 지표 선택 → 통합검색 표에 그 지표 컬럼 꽂고 자동조회 ("지표 페이지")
      navigate(`/bulk?col=${encodeURIComponent(item.id)}`);
    }
    onSelected?.(item);
  }

  // 결과 클릭 없이 그냥 검색(Enter/통합검색 행) → 통합 검색 페이지로 검색어 전달 + 토글 닫기
  function handleSubmit() {
    const q = query.trim();
    if (!q) return;
    setFocused(false);
    setActiveIdx(-1);
    navigate(`/bulk?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showDropdown && flat.length > 0) setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showDropdown && flat.length > 0) setActiveIdx((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      if (showDropdown && activeIdx >= 0 && flat[activeIdx]) handleSelect(flat[activeIdx]);
      else handleSubmit();
    } else if (e.key === "Escape") {
      setFocused(false);
      setActiveIdx(-1);
    }
  }

  return (
    <div ref={wrapRef} style={{ width: "100%", maxWidth, position: "relative", margin: "0 auto" }}>
      <SearchBar
        query={query}
        onQueryChange={(v) => {
          setQuery(v);
          setActiveIdx(-1); // 입력 바뀌면 강조 초기화
          setFocused(true); // 재입력 시 토글 다시 열기
        }}
        onFocus={() => setFocused(true)}
        onClear={() => {
          setQuery("");
          setActiveIdx(-1);
        }}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && (
        <AutocompleteDropdown
          result={result}
          query={query}
          onSelect={handleSelect}
          onSubmitQuery={handleSubmit}
          submitActive={activeIdx === -1}
          activeIndex={activeIdx}
        />
      )}
    </div>
  );
}
