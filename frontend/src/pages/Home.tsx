import {
  MainLayout,
  type CatalogRouteState,
  type CatalogSection,
  type ProductRouteState,
} from '../components/layout/MainLayout';
import { Sidebar } from '../components/layout/Sidebar';

interface HomeProps {
  section: CatalogSection;
  onNavigate: (section: CatalogSection) => void;
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
