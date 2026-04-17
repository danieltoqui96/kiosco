export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function toSingleValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : null;
  }
  return typeof value === 'string' ? value : null;
}

function parsePositiveInt(value: unknown): number | null {
  const parsedValue = toSingleValue(value);
  if (!parsedValue) return null;

  const parsedNumber = Number(parsedValue);
  if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) return null;

  return parsedNumber;
}

export function getPaginationParams(
  pageQuery: unknown,
  limitQuery: unknown,
  defaultLimit = 20,
  maxLimit = 100,
): PaginationParams {
  const page = parsePositiveInt(pageQuery) ?? 1;
  const requestedLimit = parsePositiveInt(limitQuery) ?? defaultLimit;
  const limit = Math.min(requestedLimit, maxLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

