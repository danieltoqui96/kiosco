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
        <h2 className="panel-title">Product Details</h2>
        <button type="button" className="panel-close" title="Close" onClick={onClose}>
          x
        </button>
      </div>

      <div className="panel-content">
        {isLoading ? (
          <div className="detail-section">
            <p className="detail-description">Loading product detail...</p>
          </div>
        ) : !product ? (
          <div className="detail-section">
            <h4 className="section-title">No Product Selected</h4>
            <p className="detail-description">
              Select a product from the table to view details.
            </p>
          </div>
        ) : (
          <>
            <div className="detail-hero">
              <div className="detail-image">
                <span className="detail-image-placeholder">PR</span>
              </div>
              <div className="detail-header-info">
                <span className={getStatusBadgeClass(product.statusLabel)}>
                  {product.statusLabel}
                </span>
                <h3 className="detail-title">{product.name}</h3>
                <p className="detail-sku">{product.sku ?? `ID: ${product.id}`}</p>
              </div>
            </div>

            <div className="detail-stats">
              <div className="stat-card">
                <span className="stat-label">Sale Price</span>
                <span className="stat-value stat-value--price">
                  {formatCurrency(product.salePrice)}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Stock</span>
                <span className="stat-value stat-value--stock">
                  {product.stock} units
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Monthly Sales</span>
                <span className="stat-value">{product.monthlySales ?? '-'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">General Information</h4>
              <dl className="info-list">
                <div className="info-row">
                  <dt className="info-label">Barcode</dt>
                  <dd className="info-value info-value--mono">{product.codebar}</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Category</dt>
                  <dd className="info-value">{product.category}</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Brand</dt>
                  <dd className="info-value">{product.brand}</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Model</dt>
                  <dd className="info-value">{product.model ?? '-'}</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Provider</dt>
                  <dd className="info-value">{product.provider ?? '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Price</h4>
              <dl className="info-list">
                <div className="info-row">
                  <dt className="info-label">Purchase Price</dt>
                  <dd className="info-value">{formatCurrency(product.purchasePrice)}</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Sale Price</dt>
                  <dd className="info-value info-value--highlight">
                    {formatCurrency(product.salePrice)}
                  </dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Margin</dt>
                  <dd className="info-value info-value--success">
                    {calculateMargin(product.purchasePrice, product.salePrice)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Inventory</h4>
              <dl className="info-list">
                <div className="info-row">
                  <dt className="info-label">Current Stock</dt>
                  <dd className="info-value">{product.stock} units</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Minimum Stock</dt>
                  <dd className="info-value">
                    {product.minStock !== undefined ? `${product.minStock} units` : '-'}
                  </dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Location</dt>
                  <dd className="info-value">{product.location ?? '-'}</dd>
                </div>
                <div className="info-row">
                  <dt className="info-label">Last Entry</dt>
                  <dd className="info-value">{product.lastEntryDate ?? '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Description</h4>
              <p className="detail-description">
                {product.description ?? 'No description available for this product.'}
              </p>
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
          Edit Product
        </button>
        <button
          type="button"
          className="btn btn-danger-outline"
          disabled={!product}
          onClick={() => {
            if (product) onDelete(product.id);
          }}
        >
          Delete
        </button>
      </div>
    </aside>
  );
};
