import { formatCurrency, getStatusBadgeClass } from '../presentation.utils';
import type { ProductViewModel } from '../types';

interface ProductTableProps {
  products: ProductViewModel[];
  selectedProductId: number | null;
  onSelectProduct: (productId: number) => void;
  onViewProduct: (productId: number) => void;
  onEditProduct: (productId: number) => void;
  onDeleteProduct: (productId: number) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  isLoading?: boolean;
}

function getStockClass(stockStatus: ProductViewModel['stockStatus']): string {
  if (stockStatus === 'ok') return 'stock-indicator stock-indicator--ok';
  if (stockStatus === 'low') return 'stock-indicator stock-indicator--low';
  return 'stock-indicator stock-indicator--zero';
}

function buildVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, 4, totalPages];
  if (currentPage >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
}

export const ProductTable = ({
  products,
  selectedProductId,
  onSelectProduct,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPrevPage,
  onNextPage,
  onGoToPage,
  isLoading = false,
}: ProductTableProps) => {
  const visiblePages = buildVisiblePages(currentPage, totalPages);
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  return (
    <section className="data-table-container">
      <table className="data-table">
        <thead className="table-header">
          <tr>
            <th className="table-cell table-cell--header">Sel</th>
            <th className="table-cell table-cell--header">Code</th>
            <th className="table-cell table-cell--header">Product</th>
            <th className="table-cell table-cell--header">Category</th>
            <th className="table-cell table-cell--header table-cell--right">
              Sale Price
            </th>
            <th className="table-cell table-cell--header table-cell--right">
              Stock
            </th>
            <th className="table-cell table-cell--header">Status</th>
            <th className="table-cell table-cell--header table-cell--center">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="table-body">
          {isLoading ? (
            <tr className="table-row">
              <td className="table-cell" colSpan={8}>
                Loading products...
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr className="table-row">
              <td className="table-cell" colSpan={8}>
                No products found.
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const isSelected = selectedProductId === product.id;
              return (
                <tr
                  key={product.id}
                  className={`table-row${isSelected ? ' table-row--selected' : ''}`}
                >
                  <td className="table-cell">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectProduct(product.id)}
                      aria-label={`Select product ${product.name}`}
                    />
                  </td>

                  <td className="table-cell table-cell--code">{product.codebar}</td>

                  <td className="table-cell">
                    <div className="product-cell">
                      <div className="product-image">
                        <span className="product-image-placeholder">PR</span>
                      </div>
                      <div className="product-info">
                        <span className="product-name">{product.name}</span>
                        <span className="product-sku">
                          {product.sku ?? `ID: ${product.id}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="table-cell">
                    <span className="category-badge">{product.category}</span>
                  </td>

                  <td className="table-cell table-cell--right table-cell--number">
                    {formatCurrency(product.salePrice)}
                  </td>

                  <td className="table-cell table-cell--right">
                    <span className={getStockClass(product.stockStatus)}>
                      {product.stock}
                    </span>
                  </td>

                  <td className="table-cell">
                    <span className={getStatusBadgeClass(product.statusLabel)}>
                      {product.statusLabel}
                    </span>
                  </td>

                  <td className="table-cell table-cell--center">
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="action-btn action-btn--view"
                        title="View details"
                        onClick={() => onViewProduct(product.id)}
                      >
                        <span className="action-icon">V</span>
                      </button>
                      <button
                        type="button"
                        className="action-btn action-btn--edit"
                        title="Edit product"
                        onClick={() => onEditProduct(product.id)}
                      >
                        <span className="action-icon">E</span>
                      </button>
                      <button
                        type="button"
                        className="action-btn action-btn--delete"
                        title="Delete product"
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        <span className="action-icon">D</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="table-pagination">
        <div className="pagination-info">
          Showing {rangeStart}-{rangeEnd} of {totalItems} records
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className={`pagination-btn${currentPage <= 1 ? ' pagination-btn--disabled' : ''}`}
            onClick={onPrevPage}
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span className="pagination-pages">
            {visiblePages.map((page, index) => {
              const prevPage = visiblePages[index - 1];
              const needsEllipsis = prevPage !== undefined && page - prevPage > 1;
              return (
                <span key={page}>
                  {needsEllipsis ? (
                    <span className="pagination-ellipsis">...</span>
                  ) : null}
                  <button
                    type="button"
                    className={`pagination-page${currentPage === page ? ' pagination-page--active' : ''}`}
                    onClick={() => onGoToPage(page)}
                  >
                    {page}
                  </button>
                </span>
              );
            })}
          </span>
          <button
            type="button"
            className={`pagination-btn${currentPage >= totalPages ? ' pagination-btn--disabled' : ''}`}
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};
