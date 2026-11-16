export interface Paginated<T> {
  page: number;
  totalPages: number;
  items: T[];
}
