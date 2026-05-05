import {
  type AppSection,
  type CatalogRouteState,
  type FinanceRouteState,
  MainLayout,
  type ProductRouteState,
  type SalesRouteState,
} from '../components/layout/MainLayout';
import { Sidebar } from '../components/layout/Sidebar';

interface HomeProps {
  section: AppSection;
  onNavigate: (section: AppSection) => void;
  productRouteState: ProductRouteState;
  onProductRouteStateChange: (next: Partial<ProductRouteState>) => void;
  catalogRouteState: CatalogRouteState;
  onCatalogRouteStateChange: (next: Partial<CatalogRouteState>) => void;
  salesRouteState: SalesRouteState;
  onSalesRouteStateChange: (next: Partial<SalesRouteState>) => void;
  financeRouteState: FinanceRouteState;
  onFinanceRouteStateChange: (next: Partial<FinanceRouteState>) => void;
}

export const Home = ({
  section,
  onNavigate,
  productRouteState,
  onProductRouteStateChange,
  catalogRouteState,
  onCatalogRouteStateChange,
  salesRouteState,
  onSalesRouteStateChange,
  financeRouteState,
  onFinanceRouteStateChange,
}: HomeProps) => {
  return (
    <div className="app-layout">
      <Sidebar currentSection={section} onNavigate={onNavigate} />
      <MainLayout
        section={section}
        productRouteState={productRouteState}
        onProductRouteStateChange={onProductRouteStateChange}
        catalogRouteState={catalogRouteState}
        onCatalogRouteStateChange={onCatalogRouteStateChange}
        salesRouteState={salesRouteState}
        onSalesRouteStateChange={onSalesRouteStateChange}
        financeRouteState={financeRouteState}
        onFinanceRouteStateChange={onFinanceRouteStateChange}
      />
    </div>
  );
};
