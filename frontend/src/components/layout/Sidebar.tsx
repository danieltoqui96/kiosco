export const Sidebar = () => {
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
            className="nav-item active"
          >
            <span className="nav-icon">P</span>
            <span className="nav-label">Productos</span>
          </button>
        </nav>
      </aside>
    </div>
  );
};
