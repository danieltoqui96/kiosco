/* eslint-disable react-refresh/only-export-components */
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';
import { Home } from './pages/Home';
import type { ProductRouteState } from './components/layout/MainLayout';

interface RouterSearchState {
  page?: number;
  search?: string;
  brand?: string;
  category?: string;
  status?: 'true' | 'false';
  codebar?: string;
}

const defaultProductsSearch: RouterSearchState = {
  page: 1,
};

const PRODUCT_QUERY_KEYS = new Set([
  'page',
  'search',
  'brand',
  'category',
  'status',
  'codebar',
]);

function parsePage(rawValue: unknown): number {
  const parsedValue =
    typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string'
        ? Number(rawValue)
        : Number.NaN;
  if (!Number.isFinite(parsedValue)) return 1;
  return Math.max(1, Math.floor(parsedValue));
}

function parseOptionalText(rawValue: unknown): string | undefined {
  if (typeof rawValue !== 'string') return undefined;
  const value = rawValue.trim();
  return value.length > 0 ? value : undefined;
}

function parseStatus(rawValue: unknown): 'true' | 'false' | undefined {
  if (rawValue === 'true' || rawValue === 'false') return rawValue;
  return undefined;
}

function normalizeSearchState(search: Record<string, unknown>): RouterSearchState {
  return {
    page: parsePage(search.page),
    search: parseOptionalText(search.search),
    brand: parseOptionalText(search.brand),
    category: parseOptionalText(search.category),
    status: parseStatus(search.status),
    codebar: parseOptionalText(search.codebar),
  };
}

function sanitizeProductsSearch(search: RouterSearchState): RouterSearchState {
  return {
    page: parsePage(search.page),
    search: search.search,
    brand: search.brand,
    category: search.category,
    status: search.status,
    codebar: search.codebar,
  };
}

function isSameSearchState(left: RouterSearchState, right: RouterSearchState): boolean {
  return (
    left.page === right.page &&
    left.search === right.search &&
    left.brand === right.brand &&
    left.category === right.category &&
    left.status === right.status &&
    left.codebar === right.codebar
  );
}

function isQueryCanonical(search: RouterSearchState): boolean {
  if (typeof window === 'undefined') return true;

  const params = new URLSearchParams(window.location.search);
  for (const key of params.keys()) {
    if (!PRODUCT_QUERY_KEYS.has(key)) return false;
    if (params.getAll(key).length > 1) return false;
  }

  const expected: Record<string, string | undefined> = {
    page: String(parsePage(search.page)),
    search: search.search,
    brand: search.brand,
    category: search.category,
    status: search.status,
    codebar: search.codebar,
  };

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = params.get(key);
    if (expectedValue === undefined) {
      if (actualValue !== null) return false;
    } else if (actualValue !== expectedValue) {
      return false;
    }
  }

  return true;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({
      to: '/productos',
      search: defaultProductsSearch,
    });
  },
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'productos',
  validateSearch: (search: Record<string, unknown>): RouterSearchState =>
    normalizeSearchState(search),
  component: ProductsView,
});

const routeTree = rootRoute.addChildren([indexRoute, productsRoute]);

export const router = createRouter({ routeTree });

function ProductsView() {
  const navigate = useNavigate({ from: productsRoute.fullPath });
  const rawSearch = productsRoute.useSearch();
  const currentSearch = sanitizeProductsSearch(rawSearch);
  const queryIsCanonical = isQueryCanonical(currentSearch);

  useEffect(() => {
    if (queryIsCanonical) return;
    void navigate({
      to: '/productos',
      search: currentSearch,
      replace: true,
    });
  }, [currentSearch, navigate, queryIsCanonical]);

  const updateSearch = useCallback(
    (patch: Partial<RouterSearchState>) => {
      const merged = sanitizeProductsSearch({ ...currentSearch, ...patch });
      if (isSameSearchState(currentSearch, merged)) return;
      void navigate({
        to: '/productos',
        search: merged,
        replace: true,
      });
    },
    [currentSearch, navigate],
  );

  const productRouteState: ProductRouteState = {
    page: parsePage(currentSearch.page),
    search: currentSearch.search ?? '',
    brand: currentSearch.brand ?? '',
    category: currentSearch.category ?? '',
    status: currentSearch.status ?? '',
    codebar: currentSearch.codebar ?? '',
  };

  const handleProductRouteStateChange = useCallback(
    (next: Partial<ProductRouteState>) => {
      updateSearch({
        page:
          next.page === undefined
            ? parsePage(currentSearch.page)
            : Math.max(1, Math.floor(next.page)),
        search:
          next.search === undefined
            ? currentSearch.search
            : parseOptionalText(next.search),
        brand:
          next.brand === undefined
            ? currentSearch.brand
            : parseOptionalText(next.brand),
        category:
          next.category === undefined
            ? currentSearch.category
            : parseOptionalText(next.category),
        status:
          next.status === undefined
            ? currentSearch.status
            : parseStatus(next.status),
        codebar:
          next.codebar === undefined
            ? currentSearch.codebar
            : parseOptionalText(next.codebar),
      });
    },
    [currentSearch, updateSearch],
  );

  return (
    <Home
      productRouteState={productRouteState}
      onProductRouteStateChange={handleProductRouteStateChange}
    />
  );
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
