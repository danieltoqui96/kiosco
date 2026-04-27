import { useState } from 'react';
import { MainLayout, type CatalogSection } from '../components/layout/MainLayout';
import { Sidebar } from '../components/layout/Sidebar';

export const Home = () => {
  const [section, setSection] = useState<CatalogSection>('products');

  return (
    <div className="app-layout">
      <Sidebar currentSection={section} onNavigate={setSection} />
      <MainLayout section={section} />
    </div>
  );
};
