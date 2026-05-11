import {
  type AppSection,
  MainLayout,
  type CashRouteState,
  type ProductRouteState,
  type SalesRouteState,
} from '../components/layout/MainLayout';
import { Sidebar } from '../components/layout/Sidebar';

interface HomeProps {
  section: AppSection;
  productRouteState: ProductRouteState;
  onProductRouteStateChange: (next: Partial<ProductRouteState>) => void;
  salesRouteState: SalesRouteState;
  onSalesRouteStateChange: (next: Partial<SalesRouteState>) => void;
  cashRouteState: CashRouteState;
  onCashRouteStateChange: (next: Partial<CashRouteState>) => void;
  onGoToProducts: () => void;
  onGoToSales: () => void;
  onGoToCash: () => void;
}

export const Home = ({
  section,
  productRouteState,
  onProductRouteStateChange,
  salesRouteState,
  onSalesRouteStateChange,
  cashRouteState,
  onCashRouteStateChange,
  onGoToProducts,
  onGoToSales,
  onGoToCash,
}: HomeProps) => {
  return (
    <div className="app-layout">
      <Sidebar
        activeSection={section}
        onGoToProducts={onGoToProducts}
        onGoToSales={onGoToSales}
        onGoToCash={onGoToCash}
      />
      <MainLayout
        section={section}
        productRouteState={productRouteState}
        onProductRouteStateChange={onProductRouteStateChange}
        salesRouteState={salesRouteState}
        onSalesRouteStateChange={onSalesRouteStateChange}
        cashRouteState={cashRouteState}
        onCashRouteStateChange={onCashRouteStateChange}
      />
    </div>
  );
};
