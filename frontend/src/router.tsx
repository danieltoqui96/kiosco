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
  CatalogRouteState,
  CatalogSection,
  ProductRouteState,
} from './components/layout/MainLayout';

type SectionPath = 'productos' | 'categorias' | 'marcas';

interface RouterSearchState {
  page: number;
  q?: string;
  search?: string;
  brand?: string;
  category?: string;
  status?: 'true' | 'false';
  codebar?: string;
}

const defaultProductsSearch: RouterSearchState = {
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
  };
}

function toSection(sectionPath: SectionPath): CatalogSection {
  if (sectionPath === 'categorias') return 'categories';
  if (sectionPath === 'marcas') return 'brands';
  return 'products';
}

function toSectionPath(section: CatalogSection): SectionPath {
  if (section === 'categories') return 'categorias';
  if (section === 'brands') return 'marcas';
  return 'productos';
}

function isAllowedSection(section: string): section is SectionPath {
  return section === 'productos' || section === 'categorias' || section === 'marcas';
}

function getSectionPath(section: string): SectionPath {
  return isAllowedSection(section) ? section : 'productos';
}

function getDefaultSearchState(section: SectionPath): RouterSearchState {
  if (section === 'productos') return defaultProductsSearch;
  return { page: 1 };
}

function sanitizeSearchForSection(
  section: SectionPath,
  search: RouterSearchState,
): RouterSearchState {
  if (section === 'productos') {
    return {
      page: search.page,
      search: search.search,
      brand: search.brand,
      category: search.category,
      status: search.status,
      codebar: search.codebar,
    };
  }

  return {
    page: search.page,
    q: search.q,
  };
}

function isSameSearchState(left: RouterSearchState, right: RouterSearchState): boolean {
  return (
    left.page === right.page &&
    left.q === right.q &&
    left.search === right.search &&
    left.brand === right.brand &&
    left.category === right.category &&
    left.status === right.status &&
    left.codebar === right.codebar
  );
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

  useEffect(() => {
    if (isSameSearchState(rawSearch, currentSearch)) return;

    void navigate({
      to: '/$section',
      params: { section: sectionPath },
      search: currentSearch,
      replace: true,
    });
  }, [currentSearch, navigate, rawSearch, sectionPath]);

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
    (nextSection: CatalogSection) => {
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
            ? currentSearch.page
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
      if (sectionPath === 'productos') return;

      updateSearch({
        page:
          next.page === undefined
            ? currentSearch.page
            : Math.max(1, Math.floor(next.page)),
        q: next.q === undefined ? currentSearch.q : parseOptionalText(next.q),
      });
    },
    [currentSearch, sectionPath, updateSearch],
  );

  const productRouteState: ProductRouteState = {
    page: currentSearch.page,
    search: currentSearch.search ?? '',
    brand: currentSearch.brand ?? '',
    category: currentSearch.category ?? '',
    status: currentSearch.status ?? '',
    codebar: currentSearch.codebar ?? '',
  };

  const catalogRouteState: CatalogRouteState = {
    page: currentSearch.page,
    q: currentSearch.q ?? '',
  };

  return (
    <Home
      section={currentSection}
      onNavigate={handleSectionNavigate}
      productRouteState={productRouteState}
      onProductRouteStateChange={handleProductRouteStateChange}
      catalogRouteState={catalogRouteState}
      onCatalogRouteStateChange={handleCatalogRouteStateChange}
    />
  );
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
