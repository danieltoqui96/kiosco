import { ProductPage } from '../../features/products/pages/ProductPage';

export type AppSection = 'products';

export interface ProductRouteState {
  page: number;
  search: string;
  brand: string;
  category: string;
  status: '' | 'true' | 'false';
  codebar: string;
}

interface MainLayoutProps {
  productRouteState: ProductRouteState;
  onProductRouteStateChange: (next: Partial<ProductRouteState>) => void;
}

export const MainLayout = ({
  productRouteState,
  onProductRouteStateChange,
}: MainLayoutProps) => {
  return (
    <ProductPage
      routeState={productRouteState}
      onRouteStateChange={onProductRouteStateChange}
    />
  );
};
