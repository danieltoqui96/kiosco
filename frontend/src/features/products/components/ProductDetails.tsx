import { formatCurrency, getStatusBadgeClass } from '../presentation.utils';
import type { ProductViewModel } from '../types';

interface ProductDetailsProps {
  product: ProductViewModel | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onEdit: (productId: number) => void;
  onDelete: (productId: number) => void;
}

function calculateMargin(purchasePrice: number, salePrice: number): string {
  if (purchasePrice <= 0) return '0%';
  const margin = ((salePrice - purchasePrice) / purchasePrice) * 100;
  return `${margin.toFixed(1)}%`;
}

export const ProductDetails = ({
  product,
  isOpen,
  isLoading = false,
  onClose,
  onEdit,
  onDelete,
}: ProductDetailsProps) => {
  const panelClass = `detail-panel${isOpen ? ' detail-panel--open' : ''}`;

  return (
    <aside className={panelClass}>
      <div className="panel-header">
        <h2 className="panel-title">Detalle del producto</h2>
        <button type="button" className="panel-close" title="Cerrar" onClick={onClose}>
          x
        </button>
      </div>

      <div className="panel-content">
        {isLoading ? (
          <div className="detail-section">
            <p className="detail-description">Cargando detalle del producto...</p>
          </div>
        ) : !product ? (
          <div className="detail-section">
            <h4 className="section-title">Sin producto seleccionado</h4>
            <p className="detail-description">
              Selecciona una fila de la tabla para ver su detalle.
            </p>
          </div>
        ) : (
          <>
            <div className="detail-hero">
              <div className="detail-header-info">
                <span className={getStatusBadgeClass(product.statusLabel)}>
                  {product.statusLabel}
                </span>
                <h3 className="detail-title">{product.name}</h3>
                <p className="detail-sku">ID: {product.id}</p>
              </div>
            </div>

            <div className="detail-stats">
              <div className="stat-card">
                <span className="stat-label">Precio venta</span>
                <span className="stat-value stat-value--price">
                  {formatCurrency(product.salePrice)}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Stock</span>
                <span className="stat-value">{product.stock} unidades</span>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Informacion general</h4>
              <dl className="info-list">
                <div className="info-row">
                  <dt className="info-label">Codigo de barras</dt>
                  <dd className="info-value info-value--mono">{product.codebar}</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Categoria</dt>
                  <dd className="info-value">{product.category}</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Marca</dt>
                  <dd className="info-value">{product.brand}</dd>
                </div>
              </dl>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Precios</h4>
              <dl className="info-list">
                <div className="info-row">
                  <dt className="info-label">Precio compra</dt>
                  <dd className="info-value">{formatCurrency(product.purchasePrice)}</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Precio venta</dt>
                  <dd className="info-value info-value--highlight">
                    {formatCurrency(product.salePrice)}
                  </dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Margen</dt>
                  <dd className="info-value info-value--success">
                    {calculateMargin(product.purchasePrice, product.salePrice)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Inventario</h4>
              <dl className="info-list">
                <div className="info-row">
                  <dt className="info-label">Stock actual</dt>
                  <dd className="info-value">{product.stock} unidades</dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>

      <div className="panel-footer">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!product}
          onClick={() => {
            if (product) onEdit(product.id);
          }}
        >
          Editar producto
        </button>
        <button
          type="button"
          className="btn btn-danger-outline"
          disabled={!product}
          onClick={() => {
            if (product) onDelete(product.id);
          }}
        >
          Eliminar
        </button>
      </div>
    </aside>
  );
};
