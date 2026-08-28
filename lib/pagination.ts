export function clampPage(total: number, pageSize: number, requestedPage: number) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  return Math.min(Math.max(requestedPage, 1), totalPages);
}
