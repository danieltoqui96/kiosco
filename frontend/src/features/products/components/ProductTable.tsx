import { formatCurrency, getStatusBadgeClass } from '../presentation.utils';
import type { ProductViewModel } from '../types';

interface ProductTableProps {
  products: ProductViewModel[];
  selectedProductId: number | null;
  onSelectProduct: (productId: number) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
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
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPrevPage,
  onNextPage,
  onGoToPage,
  isLoading = false,
  emptyMessage = 'No products found.',
}: ProductTableProps) => {
  const visiblePages = buildVisiblePages(currentPage, totalPages);
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  return (
    <section className="data-table-container">
      <table className="data-table">
        <thead className="table-header">
          <tr>
            <th className="table-cell table-cell--header">Codigo</th>
            <th className="table-cell table-cell--header">Producto</th>
            <th className="table-cell table-cell--header">Categoria</th>
            <th className="table-cell table-cell--header table-cell--right">
              Precio
            </th>
            <th className="table-cell table-cell--header table-cell--right">
              Stock
            </th>
            <th className="table-cell table-cell--header">Estado</th>
          </tr>
        </thead>

        <tbody className="table-body">
          {isLoading ? (
            <tr className="table-row">
              <td className="table-cell" colSpan={6}>
                Cargando productos...
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr className="table-row">
              <td className="table-cell" colSpan={6}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const isSelected = selectedProductId === product.id;
              return (
                <tr
                  key={product.id}
                  className={`table-row table-row--clickable${isSelected ? ' table-row--selected' : ''}`}
                  onClick={() => onSelectProduct(product.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectProduct(product.id);
                    }
                  }}
                  tabIndex={0}
                >
                  <td className="table-cell table-cell--code">{product.codebar}</td>

                  <td className="table-cell">
                    <div className="product-cell">
                      <div className="product-image">
                        <span className="product-image-placeholder">PR</span>
                      </div>
                      <div className="product-info">
                        <span className="product-name">{product.name}</span>
                        <span className="product-sku">{product.brand}</span>
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
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="table-pagination">
        <div className="pagination-info">
          Mostrando {rangeStart}-{rangeEnd} de {totalItems} registros
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className={`pagination-btn${currentPage <= 1 ? ' pagination-btn--disabled' : ''}`}
            onClick={onPrevPage}
            disabled={currentPage <= 1}
          >
            Anterior
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
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
};
