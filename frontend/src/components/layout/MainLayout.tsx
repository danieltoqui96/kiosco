import { CatalogPage } from '../../features/catalog/pages/CatalogPage';
import { FinancePage } from '../../features/finance/pages/FinancePage';
import { ProductPage } from '../../features/products/pages/ProductPage';
import { SalesPage } from '../../features/sales/pages/SalesPage';

export type AppSection = 'products' | 'categories' | 'brands' | 'sales' | 'finance';

export interface ProductRouteState {
  page: number;
  search: string;
  brand: string;
  category: string;
  status: '' | 'true' | 'false';
  codebar: string;
}

export interface CatalogRouteState {
  page: number;
  q: string;
}

export interface SalesRouteState {
  page: number;
  q: string;
}

export interface FinanceRouteState {
  from: string;
  to: string;
  day: string;
}

interface MainLayoutProps {
  section: AppSection;
  productRouteState: ProductRouteState;
  onProductRouteStateChange: (next: Partial<ProductRouteState>) => void;
  catalogRouteState: CatalogRouteState;
  onCatalogRouteStateChange: (next: Partial<CatalogRouteState>) => void;
  salesRouteState: SalesRouteState;
  onSalesRouteStateChange: (next: Partial<SalesRouteState>) => void;
  financeRouteState: FinanceRouteState;
  onFinanceRouteStateChange: (next: Partial<FinanceRouteState>) => void;
}

export const MainLayout = ({
  section,
  productRouteState,
  onProductRouteStateChange,
  catalogRouteState,
  onCatalogRouteStateChange,
  salesRouteState,
  onSalesRouteStateChange,
  financeRouteState,
  onFinanceRouteStateChange,
}: MainLayoutProps) => {
  if (section === 'products') {
    return (
      <ProductPage
        routeState={productRouteState}
        onRouteStateChange={onProductRouteStateChange}
      />
    );
  }

  if (section === 'brands') {
    return (
      <CatalogPage
        mode="brands"
        routeState={catalogRouteState}
        onRouteStateChange={onCatalogRouteStateChange}
      />
    );
  }

  if (section === 'sales') {
    return (
      <SalesPage
        routeState={salesRouteState}
        onRouteStateChange={onSalesRouteStateChange}
      />
    );
  }

  if (section === 'finance') {
    return (
      <FinancePage
        routeState={financeRouteState}
        onRouteStateChange={onFinanceRouteStateChange}
      />
    );
  }

  return (
    <CatalogPage
      mode="categories"
      routeState={catalogRouteState}
      onRouteStateChange={onCatalogRouteStateChange}
    />
  );
};
