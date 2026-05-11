import { ProductPage } from '../../features/products/pages/ProductPage';
import { CashPage } from '../../features/cash/pages/CashPage';
import { SalesPage } from '../../features/sales/pages/SalesPage';

export type AppSection = 'products' | 'sales' | 'cash';

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
  paymentMethod: '' | 'cash' | 'card';
  soldDate: string;
}

export interface CashRouteState {
  page: number;
  from: string;
  to: string;
}

interface MainLayoutProps {
  section: AppSection;
  productRouteState: ProductRouteState;
  onProductRouteStateChange: (next: Partial<ProductRouteState>) => void;
  salesRouteState: SalesRouteState;
  onSalesRouteStateChange: (next: Partial<SalesRouteState>) => void;
  cashRouteState: CashRouteState;
  onCashRouteStateChange: (next: Partial<CashRouteState>) => void;
}

export const MainLayout = ({
  section,
  productRouteState,
  onProductRouteStateChange,
  salesRouteState,
  onSalesRouteStateChange,
  cashRouteState,
  onCashRouteStateChange,
}: MainLayoutProps) => {
  if (section === 'sales') {
    return (
      <SalesPage
        routeState={salesRouteState}
        onRouteStateChange={onSalesRouteStateChange}
      />
    );
  }

  if (section === 'cash') {
    return (
      <CashPage
        routeState={cashRouteState}
        onRouteStateChange={onCashRouteStateChange}
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
