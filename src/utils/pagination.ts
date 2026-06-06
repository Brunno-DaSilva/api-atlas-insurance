import { Request } from 'express';

export interface Pagination {
  page: number;
  limit: number;
  from: number; // inclusive start index for supabase .range()
  to: number; // inclusive end index for supabase .range()
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Parse `?page` and `?limit` query params into safe pagination bounds. */
export function getPagination(req: Request): Pagination {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const rawLimit = parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { page, limit, from, to };
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function buildPaginated<T>(
  items: T[],
  total: number,
  pagination: Pagination
): PaginatedResult<T> {
  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
    },
  };
}
