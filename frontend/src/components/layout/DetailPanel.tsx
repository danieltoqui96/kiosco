export const DetailPanel = () => {
  return (
    <div>
      <aside className="detail-panel detail-panel--open">
        <div className="panel-header">
          <h2 className="panel-title">Detalle del Producto</h2>
          <button className="panel-close" title="Cerrar">
            ×
          </button>
        </div>

        <div className="panel-content">
          {/* <!-- Product Header --> */}
          <div className="detail-hero">
            <div className="detail-image">
              <span className="detail-image-placeholder">🎧</span>
            </div>
            <div className="detail-header-info">
              <span className="status-badge status-badge--active">Activo</span>
              <h3 className="detail-title">Audífonos Sony WH-1000XM5</h3>
              <p className="detail-sku">SKU: SNY-WH1000-BK</p>
            </div>
          </div>

          {/* <!-- Quick Stats --> */}
          <div className="detail-stats">
            <div className="stat-card">
              <span className="stat-label">Precio</span>
              <span className="stat-value stat-value--price">$7,499.00</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Stock</span>
              <span className="stat-value stat-value--stock">12 unidades</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Ventas (mes)</span>
              <span className="stat-value">24</span>
            </div>
          </div>

          {/* <!-- Info Sections --> */}
          <div className="detail-section">
            <h4 className="section-title">Información General</h4>
            <dl className="info-list">
              <div className="info-row">
                <dt className="info-label">Código de Barras</dt>
                <dd className="info-value info-value--mono">7504445556667</dd>
              </div>
              <div className="info-row">
                <dt className="info-label">Categoría</dt>
                <dd className="info-value">Electrónicos</dd>
              </div>
              <div className="info-row">
                <dt className="info-label">Marca</dt>
                <dd className="info-value">Sony</dd>
              </div>
              <div className="info-row">
                <dt className="info-label">Modelo</dt>
                <dd className="info-value">WH-1000XM5</dd>
              </div>
              <div className="info-row">
                <dt className="info-label">Proveedor</dt>
                <dd className="info-value">TechSupply SA</dd>
              </div>
            </dl>
          </div>

          <div className="detail-section">
            <h4 className="section-title">Precios</h4>
            <dl className="info-list">
              <div className="info-row">
                <dt className="info-label">Precio de Compra</dt>
                <dd className="info-value">$5,200.00</dd>
              </div>
              <div className="info-row">
                <dt className="info-label">Precio de Venta</dt>
                <dd className="info-value info-value--highlight">$7,499.00</dd>
              </div>
              <div className="info-row">
                <dt className="info-label">Margen</dt>
                <dd className="info-value info-value--success">44.2%</dd>
              </div>
            </dl>
          </div>

          <div className="detail-section">
            <h4 className="section-title">Inventario</h4>
            <dl className="info-list">
              <div className="info-row">
                <dt className="info-label">Stock Actual</dt>
                <dd className="info-value">12 unidades</dd>
              </div>
              <div className="info-row">
                <dt className="info-label">Stock Mínimo</dt>
                <dd className="info-value">5 unidades</dd>
              </div>
              <div className="info-row">
                <dt className="info-label">Ubicación</dt>
                <dd className="info-value">Almacén A - Estante 3</dd>
              </div>
              <div className="info-row">
                <dt className="info-label">Última Entrada</dt>
                <dd className="info-value">15/03/2024</dd>
              </div>
            </dl>
          </div>

          <div className="detail-section">
            <h4 className="section-title">Descripción</h4>
            <p className="detail-description">
              Audífonos inalámbricos premium con cancelación de ruido líder en
              la industria. Hasta 30 horas de batería, diseño ultraligero y
              cómodo para uso prolongado. Compatible con audio de alta
              resolución y múltiples dispositivos simultáneos.
            </p>
          </div>
        </div>

        <div className="panel-footer">
          <button className="btn btn-secondary">Editar Producto</button>
          <button className="btn btn-danger-outline">Eliminar</button>
        </div>
      </aside>
    </div>
  );
};
