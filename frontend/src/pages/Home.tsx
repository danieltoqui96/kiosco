import {
  type AppSection,
  type CatalogRouteState,
  MainLayout,
  type ProductRouteState,
} from '../components/layout/MainLayout';
import { Sidebar } from '../components/layout/Sidebar';

interface HomeProps {
  section: AppSection;
  onNavigate: (section: AppSection) => void;
  productRouteState: ProductRouteState;
  onProductRouteStateChange: (next: Partial<ProductRouteState>) => void;
  catalogRouteState: CatalogRouteState;
  onCatalogRouteStateChange: (next: Partial<CatalogRouteState>) => void;
}

export const Home = ({
  section,
  onNavigate,
  productRouteState,
  onProductRouteStateChange,
  catalogRouteState,
  onCatalogRouteStateChange,
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
      />
    </div>
  );
};
