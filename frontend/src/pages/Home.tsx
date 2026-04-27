import { MainLayout } from '../components/layout/MainLayout';
import { Sidebar } from '../components/layout/Sidebar';

export const Home = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <MainLayout />
    </div>
  );
};
