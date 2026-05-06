import type { AppSection } from './MainLayout';

interface SidebarProps {
  activeSection: AppSection;
  onGoToProducts: () => void;
  onGoToSales: () => void;
}

export const Sidebar = ({
  activeSection,
  onGoToProducts,
  onGoToSales,
}: SidebarProps) => {
  return (
    <div>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">INV</span>
          <span className="sidebar-title">Inventario</span>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item${activeSection === 'products' ? ' active' : ''}`}
            onClick={onGoToProducts}
          >
            <span className="nav-icon">P</span>
            <span className="nav-label">Productos</span>
          </button>
          <button
            type="button"
            className={`nav-item${activeSection === 'sales' ? ' active' : ''}`}
            onClick={onGoToSales}
          >
            <span className="nav-icon">V</span>
            <span className="nav-label">Ventas</span>
          </button>
        </nav>
      </aside>
    </div>
  );
};
