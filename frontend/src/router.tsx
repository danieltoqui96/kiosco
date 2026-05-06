/* eslint-disable react-refresh/only-export-components */
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useCallback } from 'react';
import { Home } from './pages/Home';
import type {
  ProductRouteState,
  SalesRouteState,
} from './components/layout/MainLayout';

interface ProductRouterSearchState {
  page?: number;
  search?: string;
  brand?: string;
  category?: string;
  status?: 'true' | 'false';
  codebar?: string;
}

interface SalesRouterSearchState {
  page?: number;
  q?: string;
  paymentMethod?: 'cash' | 'card';
  soldDate?: string;
}

const defaultProductsSearch: ProductRouterSearchState = {
  page: 1,
};

const defaultSalesSearch: SalesRouterSearchState = {
  page: 1,
};

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

function normalizeProductsSearch(
  search: Record<string, unknown>,
): ProductRouterSearchState {
  return {
    page: parsePage(search.page),
    search: parseOptionalText(search.search),
    brand: parseOptionalText(search.brand),
    category: parseOptionalText(search.category),
    status: parseStatus(search.status),
    codebar: parseOptionalText(search.codebar),
  };
}

function normalizeSalesSearch(search: Record<string, unknown>): SalesRouterSearchState {
  const paymentRaw = search.paymentMethod;
  const paymentMethod =
    paymentRaw === 'cash' || paymentRaw === 'card' ? paymentRaw : undefined;
  const soldDateRaw = parseOptionalText(search.soldDate);
  const soldDate =
    soldDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(soldDateRaw) ? soldDateRaw : undefined;

  return {
    page: parsePage(search.page),
    q: parseOptionalText(search.q),
    paymentMethod,
    soldDate,
  };
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
  validateSearch: (search: Record<string, unknown>): ProductRouterSearchState =>
    normalizeProductsSearch(search),
  component: ProductsView,
});

const salesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'ventas',
  validateSearch: (search: Record<string, unknown>): SalesRouterSearchState =>
    normalizeSalesSearch(search),
  component: SalesView,
});

const routeTree = rootRoute.addChildren([indexRoute, productsRoute, salesRoute]);

export const router = createRouter({ routeTree });

function ProductsView() {
  const navigate = useNavigate({ from: productsRoute.fullPath });
  const search = productsRoute.useSearch();

  const productRouteState: ProductRouteState = {
    page: parsePage(search.page),
    search: search.search ?? '',
    brand: search.brand ?? '',
    category: search.category ?? '',
    status: search.status ?? '',
    codebar: search.codebar ?? '',
  };

  const salesRouteState: SalesRouteState = {
    page: 1,
    q: '',
    paymentMethod: '',
    soldDate: '',
  };

  const handleProductRouteStateChange = useCallback(
    (next: Partial<ProductRouteState>) => {
      void navigate({
        to: '/productos',
        search: {
          page:
            next.page === undefined
              ? productRouteState.page
              : Math.max(1, Math.floor(next.page)),
          search:
            next.search === undefined
              ? parseOptionalText(productRouteState.search)
              : parseOptionalText(next.search),
          brand:
            next.brand === undefined
              ? parseOptionalText(productRouteState.brand)
              : parseOptionalText(next.brand),
          category:
            next.category === undefined
              ? parseOptionalText(productRouteState.category)
              : parseOptionalText(next.category),
          status:
            next.status === undefined
              ? parseStatus(productRouteState.status)
              : parseStatus(next.status),
          codebar:
            next.codebar === undefined
              ? parseOptionalText(productRouteState.codebar)
              : parseOptionalText(next.codebar),
        },
        replace: true,
      });
    },
    [navigate, productRouteState],
  );

  return (
    <Home
      section="products"
      productRouteState={productRouteState}
      onProductRouteStateChange={handleProductRouteStateChange}
      salesRouteState={salesRouteState}
      onSalesRouteStateChange={() => {}}
      onGoToProducts={() => {}}
      onGoToSales={() => {
        void navigate({
          to: '/ventas',
          search: defaultSalesSearch,
        });
      }}
    />
  );
}

function SalesView() {
  const navigate = useNavigate({ from: salesRoute.fullPath });
  const search = salesRoute.useSearch();

  const salesRouteState: SalesRouteState = {
    page: parsePage(search.page),
    q: search.q ?? '',
    paymentMethod: search.paymentMethod ?? '',
    soldDate: search.soldDate ?? '',
  };

  const productRouteState: ProductRouteState = {
    page: 1,
    search: '',
    brand: '',
    category: '',
    status: '',
    codebar: '',
  };

  const handleSalesRouteStateChange = useCallback(
    (next: Partial<SalesRouteState>) => {
      void navigate({
        to: '/ventas',
        search: {
          page:
            next.page === undefined
              ? salesRouteState.page
              : Math.max(1, Math.floor(next.page)),
          q:
            next.q === undefined
              ? parseOptionalText(salesRouteState.q)
              : parseOptionalText(next.q),
          paymentMethod:
            next.paymentMethod === undefined
              ? salesRouteState.paymentMethod || undefined
              : next.paymentMethod || undefined,
          soldDate:
            next.soldDate === undefined
              ? parseOptionalText(salesRouteState.soldDate)
              : parseOptionalText(next.soldDate),
        },
        replace: true,
      });
    },
    [navigate, salesRouteState],
  );

  return (
    <Home
      section="sales"
      productRouteState={productRouteState}
      onProductRouteStateChange={() => {}}
      salesRouteState={salesRouteState}
      onSalesRouteStateChange={handleSalesRouteStateChange}
      onGoToProducts={() => {
        void navigate({
          to: '/productos',
          search: defaultProductsSearch,
        });
      }}
      onGoToSales={() => {}}
    />
  );
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
