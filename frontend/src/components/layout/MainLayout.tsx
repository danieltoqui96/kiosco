import { ProductPage } from '../../features/products/pages/ProductPage';
import { SalesPage } from '../../features/sales/pages/SalesPage';

export type AppSection = 'products' | 'sales';

export interface ProductRouteState {
  page: number;
  search: string;
  brand: string;
  category: string;
  status: '' | 'true' | 'false';
  codebar: string;
}

export interface SalesRouteState {
  page: number;
  q: string;
}

interface MainLayoutProps {
  section: AppSection;
  productRouteState: ProductRouteState;
  onProductRouteStateChange: (next: Partial<ProductRouteState>) => void;
  salesRouteState: SalesRouteState;
  onSalesRouteStateChange: (next: Partial<SalesRouteState>) => void;
}

export const MainLayout = ({
  section,
  productRouteState,
  onProductRouteStateChange,
  salesRouteState,
  onSalesRouteStateChange,
}: MainLayoutProps) => {
  if (section === 'sales') {
    return (
      <SalesPage
        routeState={salesRouteState}
        onRouteStateChange={onSalesRouteStateChange}
      />
    );
  }

  return (
    <ProductPage
      routeState={productRouteState}
      onRouteStateChange={onProductRouteStateChange}
    />
  );
};
