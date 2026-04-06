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
            <span className="nav-icon">📦</span>
            <span className="nav-label">Productos</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📋</span>
            <span className="nav-label">Categorías</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">🏢</span>
            <span className="nav-label">Proveedores</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-label">Reportes</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Configuración</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">JD</div>
            <div className="user-details">
              <span className="user-name">Juan Díaz</span>
              <span className="user-role">Administrador</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
