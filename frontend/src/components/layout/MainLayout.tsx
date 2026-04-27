import { CatalogPage } from '../../features/catalog/pages/CatalogPage';
import { ProductPage } from '../../features/products/pages/ProductPage';

export type CatalogSection = 'products' | 'categories' | 'brands';

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

interface MainLayoutProps {
  section: CatalogSection;
  productRouteState: ProductRouteState;
  onProductRouteStateChange: (next: Partial<ProductRouteState>) => void;
  catalogRouteState: CatalogRouteState;
  onCatalogRouteStateChange: (next: Partial<CatalogRouteState>) => void;
}

export const MainLayout = ({
  section,
  productRouteState,
  onProductRouteStateChange,
  catalogRouteState,
  onCatalogRouteStateChange,
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

  return (
    <CatalogPage
      mode="categories"
      routeState={catalogRouteState}
      onRouteStateChange={onCatalogRouteStateChange}
    />
  );
};
