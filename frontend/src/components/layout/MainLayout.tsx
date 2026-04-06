export const MainLayout = () => {
  return (
    <div>
      <main className="main-content">
        {/* <!-- ==================== HEADER ==================== --> */}
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Gestión de Productos</h1>
            <span className="breadcrumb">Inicio / Productos</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary">
              <span className="btn-icon">+</span>
              Nuevo Producto
            </button>
          </div>
        </header>

        {/* <!-- ============== BARCODE SCANNER (POS Style) ============== --> */}
        <section className="barcode-scanner">
          <div className="scanner-container">
            <div className="scanner-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                <line x1="7" y1="12" x2="17" y2="12"></line>
              </svg>
            </div>
            <input
              type="text"
              className="scanner-input"
              placeholder="Escanear código de barras o buscar producto..."
              // autofocus
            />
            <button className="scanner-btn">Buscar</button>
          </div>
          <div className="scanner-hint">
            Presione Enter para buscar o escanee el código de barras del
            producto
          </div>
        </section>

        {/* <!-- ==================== FILTERS BAR ==================== --> */}
        <section className="filters-bar">
          <div className="filters-group">
            <div className="filter-item">
              <label className="filter-label">Categoría</label>
              <select className="filter-select">
                <option value="">Todas</option>
                <option value="electronics">Electrónicos</option>
                <option value="clothing">Ropa</option>
                <option value="food">Alimentos</option>
                <option value="office">Oficina</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">Estado</label>
              <select className="filter-select">
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="low-stock">Stock Bajo</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">Proveedor</label>
              <select className="filter-select">
                <option value="">Todos</option>
                <option value="prov1">TechSupply SA</option>
                <option value="prov2">Distribuidora Norte</option>
                <option value="prov3">Importadora Global</option>
              </select>
            </div>
          </div>
          <div className="filters-actions">
            <button className="btn btn-ghost">Limpiar filtros</button>
            <span className="results-count">Mostrando 24 de 156 productos</span>
          </div>
        </section>

        {/* <!-- ==================== PRODUCTS TABLE ==================== --> */}
        <section className="data-table-container">
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th className="table-cell table-cell--header">
                  <input type="checkbox" className="checkbox" />
                </th>
                <th className="table-cell table-cell--header table-cell--sortable">
                  Código
                  <span className="sort-icon">↕</span>
                </th>
                <th className="table-cell table-cell--header table-cell--sortable">
                  Producto
                  <span className="sort-icon">↕</span>
                </th>
                <th className="table-cell table-cell--header">Categoría</th>
                <th className="table-cell table-cell--header table-cell--sortable table-cell--right">
                  Precio
                  <span className="sort-icon">↕</span>
                </th>
                <th className="table-cell table-cell--header table-cell--sortable table-cell--right">
                  Stock
                  <span className="sort-icon">↓</span>
                </th>
                <th className="table-cell table-cell--header">Estado</th>
                <th className="table-cell table-cell--header table-cell--center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="table-body">
              <tr className="table-row">
                <td className="table-cell">
                  <input type="checkbox" className="checkbox" />
                </td>
                <td className="table-cell table-cell--code">7501234567890</td>
                <td className="table-cell">
                  <div className="product-cell">
                    <div className="product-image">
                      <span className="product-image-placeholder">📱</span>
                    </div>
                    <div className="product-info">
                      <span className="product-name">
                        Smartphone Galaxy A54
                      </span>
                      <span className="product-sku">SKU: SAM-A54-128</span>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="category-badge">Electrónicos</span>
                </td>
                <td className="table-cell table-cell--right table-cell--number">
                  $8,499.00
                </td>
                <td className="table-cell table-cell--right">
                  <span className="stock-indicator stock-indicator--ok">
                    45
                  </span>
                </td>
                <td className="table-cell">
                  <span className="status-badge status-badge--active">
                    Activo
                  </span>
                </td>
                <td className="table-cell table-cell--center">
                  <div className="action-buttons">
                    <button
                      className="action-btn action-btn--view"
                      title="Ver detalle"
                    >
                      <span className="action-icon">👁</span>
                    </button>
                    <button
                      className="action-btn action-btn--edit"
                      title="Editar"
                    >
                      <span className="action-icon">✏️</span>
                    </button>
                    <button
                      className="action-btn action-btn--delete"
                      title="Eliminar"
                    >
                      <span className="action-icon">🗑</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="table-row">
                <td className="table-cell">
                  <input type="checkbox" className="checkbox" />
                </td>
                <td className="table-cell table-cell--code">7509876543210</td>
                <td className="table-cell">
                  <div className="product-cell">
                    <div className="product-image">
                      <span className="product-image-placeholder">💻</span>
                    </div>
                    <div className="product-info">
                      <span className="product-name">
                        Laptop HP Pavilion 15
                      </span>
                      <span className="product-sku">SKU: HP-PAV15-512</span>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="category-badge">Electrónicos</span>
                </td>
                <td className="table-cell table-cell--right table-cell--number">
                  $15,999.00
                </td>
                <td className="table-cell table-cell--right">
                  <span className="stock-indicator stock-indicator--low">
                    3
                  </span>
                </td>
                <td className="table-cell">
                  <span className="status-badge status-badge--warning">
                    Stock Bajo
                  </span>
                </td>
                <td className="table-cell table-cell--center">
                  <div className="action-buttons">
                    <button
                      className="action-btn action-btn--view"
                      title="Ver detalle"
                    >
                      <span className="action-icon">👁</span>
                    </button>
                    <button
                      className="action-btn action-btn--edit"
                      title="Editar"
                    >
                      <span className="action-icon">✏️</span>
                    </button>
                    <button
                      className="action-btn action-btn--delete"
                      title="Eliminar"
                    >
                      <span className="action-icon">🗑</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="table-row">
                <td className="table-cell">
                  <input type="checkbox" className="checkbox" />
                </td>
                <td className="table-cell table-cell--code">7501111222333</td>
                <td className="table-cell">
                  <div className="product-cell">
                    <div className="product-image">
                      <span className="product-image-placeholder">🖨</span>
                    </div>
                    <div className="product-info">
                      <span className="product-name">
                        Impresora Epson L3250
                      </span>
                      <span className="product-sku">SKU: EPS-L3250-MF</span>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="category-badge">Oficina</span>
                </td>
                <td className="table-cell table-cell--right table-cell--number">
                  $4,299.00
                </td>
                <td className="table-cell table-cell--right">
                  <span className="stock-indicator stock-indicator--ok">
                    28
                  </span>
                </td>
                <td className="table-cell">
                  <span className="status-badge status-badge--active">
                    Activo
                  </span>
                </td>
                <td className="table-cell table-cell--center">
                  <div className="action-buttons">
                    <button
                      className="action-btn action-btn--view"
                      title="Ver detalle"
                    >
                      <span className="action-icon">👁</span>
                    </button>
                    <button
                      className="action-btn action-btn--edit"
                      title="Editar"
                    >
                      <span className="action-icon">✏️</span>
                    </button>
                    <button
                      className="action-btn action-btn--delete"
                      title="Eliminar"
                    >
                      <span className="action-icon">🗑</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="table-row table-row--selected">
                <td className="table-cell">
                  <input type="checkbox" className="checkbox" checked />
                </td>
                <td className="table-cell table-cell--code">7504445556667</td>
                <td className="table-cell">
                  <div className="product-cell">
                    <div className="product-image">
                      <span className="product-image-placeholder">🎧</span>
                    </div>
                    <div className="product-info">
                      <span className="product-name">
                        Audífonos Sony WH-1000XM5
                      </span>
                      <span className="product-sku">SKU: SNY-WH1000-BK</span>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="category-badge">Electrónicos</span>
                </td>
                <td className="table-cell table-cell--right table-cell--number">
                  $7,499.00
                </td>
                <td className="table-cell table-cell--right">
                  <span className="stock-indicator stock-indicator--ok">
                    12
                  </span>
                </td>
                <td className="table-cell">
                  <span className="status-badge status-badge--active">
                    Activo
                  </span>
                </td>
                <td className="table-cell table-cell--center">
                  <div className="action-buttons">
                    <button
                      className="action-btn action-btn--view"
                      title="Ver detalle"
                    >
                      <span className="action-icon">👁</span>
                    </button>
                    <button
                      className="action-btn action-btn--edit"
                      title="Editar"
                    >
                      <span className="action-icon">✏️</span>
                    </button>
                    <button
                      className="action-btn action-btn--delete"
                      title="Eliminar"
                    >
                      <span className="action-icon">🗑</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="table-row">
                <td className="table-cell">
                  <input type="checkbox" className="checkbox" />
                </td>
                <td className="table-cell table-cell--code">7507778889990</td>
                <td className="table-cell">
                  <div className="product-cell">
                    <div className="product-image">
                      <span className="product-image-placeholder">⌨️</span>
                    </div>
                    <div className="product-info">
                      <span className="product-name">
                        Teclado Mecánico Logitech G Pro
                      </span>
                      <span className="product-sku">SKU: LOG-GPRO-MX</span>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="category-badge">Electrónicos</span>
                </td>
                <td className="table-cell table-cell--right table-cell--number">
                  $2,899.00
                </td>
                <td className="table-cell table-cell--right">
                  <span className="stock-indicator stock-indicator--zero">
                    0
                  </span>
                </td>
                <td className="table-cell">
                  <span className="status-badge status-badge--inactive">
                    Sin Stock
                  </span>
                </td>
                <td className="table-cell table-cell--center">
                  <div className="action-buttons">
                    <button
                      className="action-btn action-btn--view"
                      title="Ver detalle"
                    >
                      <span className="action-icon">👁</span>
                    </button>
                    <button
                      className="action-btn action-btn--edit"
                      title="Editar"
                    >
                      <span className="action-icon">✏️</span>
                    </button>
                    <button
                      className="action-btn action-btn--delete"
                      title="Eliminar"
                    >
                      <span className="action-icon">🗑</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* <!-- Pagination --> */}
          <div className="table-pagination">
            <div className="pagination-info">
              Mostrando 1-5 de 156 registros
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn pagination-btn--disabled"
                disabled
              >
                Anterior
              </button>
              <span className="pagination-pages">
                <button className="pagination-page pagination-page--active">
                  1
                </button>
                <button className="pagination-page">2</button>
                <button className="pagination-page">3</button>
                <span className="pagination-ellipsis">...</span>
                <button className="pagination-page">32</button>
              </span>
              <button className="pagination-btn">Siguiente</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
