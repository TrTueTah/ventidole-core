export class PageInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page != null ? page : 0;
    this.limit = limit != null ? limit : 0;
    this.total = total != null ? total : 0;
    this.totalPages = this.limit > 0 ? Math.ceil(this.total / this.limit) : 0;
  }
}

export class PaginationResponse<T> {
  data: T[] | Record<string, any>;
  paging: PageInfo;

  constructor(data: T[] | Record<string, any>, paging: PageInfo) {
    this.data = data;
    this.paging = paging;
  }

  static of<T>(pagination: PaginationResponse<T>): PaginationResponse<T> {
    return new PaginationResponse(pagination.data, pagination.paging);
  }
}
