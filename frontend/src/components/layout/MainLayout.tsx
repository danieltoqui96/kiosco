import { CatalogPage } from '../../features/catalog/pages/CatalogPage';
import { ProductPage } from '../../features/products/pages/ProductPage';

export type CatalogSection = 'products' | 'categories' | 'brands';

interface MainLayoutProps {
  section: CatalogSection;
}

export const MainLayout = ({ section }: MainLayoutProps) => {
  if (section === 'products') {
    return <ProductPage />;
  }

  if (section === 'brands') {
    return <CatalogPage mode="brands" />;
  }

  return <CatalogPage mode="categories" />;
};
