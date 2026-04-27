export const Sidebar = () => {
  return (
    <div>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">INV</span>
          <span className="sidebar-title">Inventario</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="nav-icon">P</span>
            <span className="nav-label">Productos</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">C</span>
            <span className="nav-label">Categorias</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">M</span>
            <span className="nav-label">Marcas</span>
          </a>
        </nav>
      </aside>
    </div>
  );
};
