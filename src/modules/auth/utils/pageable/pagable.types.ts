export interface PageableParams<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
