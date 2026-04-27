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
  CatalogRouteState,
  CatalogSection,
  ProductRouteState,
} from './components/layout/MainLayout';

type SectionPath = 'productos' | 'categorias' | 'marcas';

interface RouterSearchState {
  page: number;
  q: string;
  search: string;
  brand: string;
  category: string;
  status: '' | 'true' | 'false';
  codebar: string;
}

const defaultSearchState: RouterSearchState = {
  page: 1,
  q: '',
  search: '',
  brand: '',
  category: '',
  status: '',
  codebar: '',
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

function parseStatus(rawValue: unknown): '' | 'true' | 'false' {
  if (rawValue === 'true' || rawValue === 'false') return rawValue;
  return '';
}

function normalizeSearchState(search: Record<string, unknown>): RouterSearchState {
  return {
    page: parsePage(search.page),
    q: parseText(search.q),
    search: parseText(search.search),
    brand: parseText(search.brand),
    category: parseText(search.category),
    status: parseStatus(search.status),
    codebar: parseText(search.codebar),
  };
}

function toSection(sectionPath: string): CatalogSection {
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
      search: defaultSearchState,
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
        search: defaultSearchState,
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
  const search = sectionRoute.useSearch();
  const currentSection = toSection(section);

  const updateSearch = useCallback(
    (patch: Partial<RouterSearchState>) => {
      const nextSearch: RouterSearchState = {
        ...search,
        ...patch,
      };

      if (isSameSearchState(search, nextSearch)) return;

      void navigate({
        to: '/$section',
        params: { section },
        search: nextSearch,
        replace: true,
      });
    },
    [navigate, search, section],
  );

  const handleSectionNavigate = useCallback(
    (nextSection: CatalogSection) => {
      if (nextSection === currentSection) return;
      void navigate({
        to: '/$section',
        params: { section: toSectionPath(nextSection) },
        search: defaultSearchState,
      });
    },
    [currentSection, navigate],
  );

  const handleProductRouteStateChange = useCallback(
    (next: Partial<ProductRouteState>) => {
      updateSearch({
        page: next.page === undefined ? search.page : Math.max(1, Math.floor(next.page)),
        search: next.search ?? search.search,
        brand: next.brand ?? search.brand,
        category: next.category ?? search.category,
        status: next.status ?? search.status,
        codebar: next.codebar ?? search.codebar,
      });
    },
    [search, updateSearch],
  );

  const handleCatalogRouteStateChange = useCallback(
    (next: Partial<CatalogRouteState>) => {
      updateSearch({
        page: next.page === undefined ? search.page : Math.max(1, Math.floor(next.page)),
        q: next.q ?? search.q,
      });
    },
    [search, updateSearch],
  );

  const productRouteState: ProductRouteState = {
    page: search.page,
    search: search.search,
    brand: search.brand,
    category: search.category,
    status: search.status,
    codebar: search.codebar,
  };

  const catalogRouteState: CatalogRouteState = {
    page: search.page,
    q: search.q,
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
