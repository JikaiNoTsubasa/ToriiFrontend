/** One page of a list — mirror of the backend `PagedResult<T>` (`page` is 1-based). */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
