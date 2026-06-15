// public/ 정적 파일 경로에 Vite base를 붙인다 (GitHub Pages 하위경로 배포 대응).
// 예: asset("/logos/qesg.svg") → "/qesg-data-portal-frontend/logos/qesg.svg"
export const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
