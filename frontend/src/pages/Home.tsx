import {
  MainLayout,
  type ProductRouteState,
} from '../components/layout/MainLayout';
import { Sidebar } from '../components/layout/Sidebar';

interface HomeProps {
  productRouteState: ProductRouteState;
  onProductRouteStateChange: (next: Partial<ProductRouteState>) => void;
}

export const Home = ({
  productRouteState,
  onProductRouteStateChange,
}: HomeProps) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <MainLayout
        productRouteState={productRouteState}
        onProductRouteStateChange={onProductRouteStateChange}
      />
    </div>
  );
};
