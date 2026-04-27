import type { CatalogSection } from './MainLayout';

interface SidebarProps {
  currentSection: CatalogSection;
  onNavigate: (section: CatalogSection) => void;
}

export const Sidebar = ({ currentSection, onNavigate }: SidebarProps) => {
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
            className={`nav-item${currentSection === 'products' ? ' active' : ''}`}
            onClick={() => onNavigate('products')}
          >
            <span className="nav-icon">P</span>
            <span className="nav-label">Productos</span>
          </button>
          <button
            type="button"
            className={`nav-item${currentSection === 'categories' ? ' active' : ''}`}
            onClick={() => onNavigate('categories')}
          >
            <span className="nav-icon">C</span>
            <span className="nav-label">Categorias</span>
          </button>
          <button
            type="button"
            className={`nav-item${currentSection === 'brands' ? ' active' : ''}`}
            onClick={() => onNavigate('brands')}
          >
            <span className="nav-icon">M</span>
            <span className="nav-label">Marcas</span>
          </button>
        </nav>
      </aside>
    </div>
  );
};
