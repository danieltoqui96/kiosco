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
import type {
  AppSection,
  CatalogRouteState,
  FinanceRouteState,
  ProductRouteState,
  SalesRouteState,
} from './components/layout/MainLayout';

type SectionPath = 'productos' | 'categorias' | 'marcas' | 'ventas' | 'finanzas';

interface RouterSearchState {
  page?: number;
  q?: string;
  search?: string;
  brand?: string;
  category?: string;
  status?: 'true' | 'false';
  codebar?: string;
  from?: string;
  to?: string;
  saleId?: string;
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

const CATALOG_QUERY_KEYS = new Set(['page', 'q']);
const SALES_QUERY_KEYS = new Set(['page', 'q']);
const FINANCE_QUERY_KEYS = new Set(['from', 'to', 'saleId']);

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

function parseText(rawValue: unknown): string {
  return typeof rawValue === 'string' ? rawValue : '';
}

function parseOptionalText(rawValue: unknown): string | undefined {
  const value = parseText(rawValue).trim();
  return value.length > 0 ? value : undefined;
}

function parseStatus(rawValue: unknown): 'true' | 'false' | undefined {
  if (rawValue === 'true' || rawValue === 'false') return rawValue;
  return undefined;
}

function normalizeSearchState(search: Record<string, unknown>): RouterSearchState {
  return {
    page: parsePage(search.page),
    q: parseOptionalText(search.q),
    search: parseOptionalText(search.search),
    brand: parseOptionalText(search.brand),
    category: parseOptionalText(search.category),
    status: parseStatus(search.status),
    codebar: parseOptionalText(search.codebar),
    from: parseOptionalText(search.from),
    to: parseOptionalText(search.to),
    saleId: parseOptionalText(search.saleId),
  };
}

function toSection(sectionPath: SectionPath): AppSection {
  if (sectionPath === 'categorias') return 'categories';
  if (sectionPath === 'marcas') return 'brands';
  if (sectionPath === 'ventas') return 'sales';
  if (sectionPath === 'finanzas') return 'finance';
  return 'products';
}

function toSectionPath(section: AppSection): SectionPath {
  if (section === 'categories') return 'categorias';
  if (section === 'brands') return 'marcas';
  if (section === 'sales') return 'ventas';
  if (section === 'finance') return 'finanzas';
  return 'productos';
}

function isAllowedSection(section: string): section is SectionPath {
  return (
    section === 'productos' ||
    section === 'categorias' ||
    section === 'marcas' ||
    section === 'ventas' ||
    section === 'finanzas'
  );
}

function getSectionPath(section: string): SectionPath {
  return isAllowedSection(section) ? section : 'productos';
}

function sanitizeSearchForSection(
  section: SectionPath,
  search: RouterSearchState,
): RouterSearchState {
  if (section === 'productos') {
    return {
      page: parsePage(search.page),
      search: search.search,
      brand: search.brand,
      category: search.category,
      status: search.status,
      codebar: search.codebar,
    };
  }

  if (section === 'categorias' || section === 'marcas') {
    return {
      page: parsePage(search.page),
      q: search.q,
    };
  }

  if (section === 'ventas') {
    return {
      page: parsePage(search.page),
      q: search.q,
    };
  }

  return {
    from: search.from,
    to: search.to,
    saleId: search.saleId,
  };
}

function getDefaultSearchState(section: SectionPath): RouterSearchState {
  if (section === 'productos') return defaultProductsSearch;
  if (section === 'categorias' || section === 'marcas' || section === 'ventas') {
    return { page: 1 };
  }
  return {};
}

function isSameSearchState(left: RouterSearchState, right: RouterSearchState): boolean {
  return (
    left.page === right.page &&
    left.q === right.q &&
    left.search === right.search &&
    left.brand === right.brand &&
    left.category === right.category &&
    left.status === right.status &&
    left.codebar === right.codebar &&
    left.from === right.from &&
    left.to === right.to &&
    left.saleId === right.saleId
  );
}

function isQueryCanonical(
  section: SectionPath,
  search: RouterSearchState,
): boolean {
  if (typeof window === 'undefined') return true;

  const params = new URLSearchParams(window.location.search);
  const allowedKeys =
    section === 'productos'
      ? PRODUCT_QUERY_KEYS
      : section === 'ventas'
        ? SALES_QUERY_KEYS
        : section === 'finanzas'
          ? FINANCE_QUERY_KEYS
          : CATALOG_QUERY_KEYS;

  for (const key of params.keys()) {
    if (!allowedKeys.has(key)) return false;
    if (params.getAll(key).length > 1) return false;
  }

  const expectedValues: Record<string, string | undefined> =
    section === 'productos'
      ? {
          page: String(parsePage(search.page)),
          search: search.search,
          brand: search.brand,
          category: search.category,
          status: search.status,
          codebar: search.codebar,
        }
      : section === 'categorias' || section === 'marcas'
        ? {
            page: String(parsePage(search.page)),
            q: search.q,
          }
        : section === 'ventas'
          ? {
              page: String(parsePage(search.page)),
              q: search.q,
            }
          : {
              from: search.from,
              to: search.to,
              saleId: search.saleId,
            };

  for (const [key, expectedValue] of Object.entries(expectedValues)) {
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
      to: '/$section',
      params: { section: 'productos' },
      search: defaultProductsSearch,
    });
  },
});

const sectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$section',
  validateSearch: (search: Record<string, unknown>): RouterSearchState =>
    normalizeSearchState(search),
  beforeLoad: ({ params }) => {
    if (!isAllowedSection(params.section)) {
      throw redirect({
        to: '/$section',
        params: { section: 'productos' },
        search: defaultProductsSearch,
      });
    }
  },
  component: SectionView,
});

const routeTree = rootRoute.addChildren([indexRoute, sectionRoute]);

export const router = createRouter({ routeTree });

function SectionView() {
  const navigate = useNavigate({ from: sectionRoute.fullPath });
  const { section } = sectionRoute.useParams();
  const rawSearch = sectionRoute.useSearch();
  const sectionPath = getSectionPath(section);
  const currentSection = toSection(sectionPath);
  const currentSearch = sanitizeSearchForSection(sectionPath, rawSearch);
  const queryIsCanonical = isQueryCanonical(sectionPath, currentSearch);

  useEffect(() => {
    if (queryIsCanonical) return;

    void navigate({
      to: '/$section',
      params: { section: sectionPath },
      search: currentSearch,
      replace: true,
    });
  }, [currentSearch, navigate, queryIsCanonical, sectionPath]);

  const updateSearch = useCallback(
    (patch: Partial<RouterSearchState>) => {
      const mergedSearch: RouterSearchState = {
        ...currentSearch,
        ...patch,
      };
      const nextSearch = sanitizeSearchForSection(sectionPath, mergedSearch);

      if (isSameSearchState(currentSearch, nextSearch)) return;

      void navigate({
        to: '/$section',
        params: { section: sectionPath },
        search: nextSearch,
        replace: true,
      });
    },
    [currentSearch, navigate, sectionPath],
  );

  const handleSectionNavigate = useCallback(
    (nextSection: AppSection) => {
      if (nextSection === currentSection) return;
      const targetPath = toSectionPath(nextSection);
      void navigate({
        to: '/$section',
        params: { section: targetPath },
        search: getDefaultSearchState(targetPath),
      });
    },
    [currentSection, navigate],
  );

  const handleProductRouteStateChange = useCallback(
    (next: Partial<ProductRouteState>) => {
      if (sectionPath !== 'productos') return;

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
    [currentSearch, sectionPath, updateSearch],
  );

  const handleCatalogRouteStateChange = useCallback(
    (next: Partial<CatalogRouteState>) => {
      if (sectionPath !== 'categorias' && sectionPath !== 'marcas') return;

      updateSearch({
        page:
          next.page === undefined
            ? parsePage(currentSearch.page)
            : Math.max(1, Math.floor(next.page)),
        q: next.q === undefined ? currentSearch.q : parseOptionalText(next.q),
      });
    },
    [currentSearch, sectionPath, updateSearch],
  );

  const handleSalesRouteStateChange = useCallback(
    (next: Partial<SalesRouteState>) => {
      if (sectionPath !== 'ventas') return;

      updateSearch({
        page:
          next.page === undefined
            ? parsePage(currentSearch.page)
            : Math.max(1, Math.floor(next.page)),
        q: next.q === undefined ? currentSearch.q : parseOptionalText(next.q),
      });
    },
    [currentSearch, sectionPath, updateSearch],
  );

  const handleFinanceRouteStateChange = useCallback(
    (next: Partial<FinanceRouteState>) => {
      if (sectionPath !== 'finanzas') return;

      updateSearch({
        from: next.from === undefined ? currentSearch.from : parseOptionalText(next.from),
        to: next.to === undefined ? currentSearch.to : parseOptionalText(next.to),
        saleId:
          next.saleId === undefined ? currentSearch.saleId : parseOptionalText(next.saleId),
      });
    },
    [currentSearch, sectionPath, updateSearch],
  );

  const productRouteState: ProductRouteState = {
    page: parsePage(currentSearch.page),
    search: currentSearch.search ?? '',
    brand: currentSearch.brand ?? '',
    category: currentSearch.category ?? '',
    status: currentSearch.status ?? '',
    codebar: currentSearch.codebar ?? '',
  };

  const catalogRouteState: CatalogRouteState = {
    page: parsePage(currentSearch.page),
    q: currentSearch.q ?? '',
  };

  const salesRouteState: SalesRouteState = {
    page: parsePage(currentSearch.page),
    q: currentSearch.q ?? '',
  };

  const financeRouteState: FinanceRouteState = {
    from: currentSearch.from ?? '',
    to: currentSearch.to ?? '',
    saleId: currentSearch.saleId ?? '',
  };

  return (
    <Home
      section={currentSection}
      onNavigate={handleSectionNavigate}
      productRouteState={productRouteState}
      onProductRouteStateChange={handleProductRouteStateChange}
      catalogRouteState={catalogRouteState}
      onCatalogRouteStateChange={handleCatalogRouteStateChange}
      salesRouteState={salesRouteState}
      onSalesRouteStateChange={handleSalesRouteStateChange}
      financeRouteState={financeRouteState}
      onFinanceRouteStateChange={handleFinanceRouteStateChange}
    />
  );
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
