import {
  type AppSection,
  MainLayout,
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
  onGoToProducts: () => void;
  onGoToSales: () => void;
}

export const Home = ({
  section,
  productRouteState,
  onProductRouteStateChange,
  salesRouteState,
  onSalesRouteStateChange,
  onGoToProducts,
  onGoToSales,
}: HomeProps) => {
  return (
    <div className="app-layout">
      <Sidebar
        activeSection={section}
        onGoToProducts={onGoToProducts}
        onGoToSales={onGoToSales}
      />
      <MainLayout
        section={section}
        productRouteState={productRouteState}
        onProductRouteStateChange={onProductRouteStateChange}
        salesRouteState={salesRouteState}
        onSalesRouteStateChange={onSalesRouteStateChange}
      />
    </div>
  );
};
