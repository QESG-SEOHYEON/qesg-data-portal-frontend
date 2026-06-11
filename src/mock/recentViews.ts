// 최근 조회 이력 (localStorage + 인메모리 pub/sub) — 페이지 진입 즉시 레일에 반영.
// 목업: 방문한 개별 기업을 기록. 실제 전환 시 서버/계정 연동.
const KEY = "qesg:recentViews";
const MAX = 6;

export interface RecentView {
  id: string;
  name: string;
}

let cache: RecentView[] | null = null;
const listeners = new Set<() => void>();

function load(): RecentView[] {
  if (cache === null) {
    try {
      const raw = localStorage.getItem(KEY);
      cache = raw ? (JSON.parse(raw) as RecentView[]) : [];
    } catch {
      cache = [];
    }
  }
  return cache;
}

export function getRecentViews(): RecentView[] {
  return load();
}

export function pushRecentView(v: RecentView): void {
  const next = [v, ...load().filter((x) => x.id !== v.id)].slice(0, MAX);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* localStorage 불가 환경 무시 */
  }
  listeners.forEach((fn) => fn());
}

// 변경 구독 — 레일이 즉시 갱신되도록
export function subscribeRecentViews(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
