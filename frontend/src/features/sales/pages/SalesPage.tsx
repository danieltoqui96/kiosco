import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SalesRouteState } from '../../../components/layout/MainLayout';
import '../../products/styles/products.css';
import {
  formatCurrency,
  getStockAlertLabel,
  getStockStatus,
} from '../../products/presentation.utils';
import { salesApi } from '../api/sales.api';
import type { SaleProduct } from '../types';

interface CartItem {
  product: SaleProduct;
  quantity: number;
}

const PAGE_SIZE = 10;

interface SalesPageProps {
  routeState: SalesRouteState;
  onRouteStateChange: (next: Partial<SalesRouteState>) => void;
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

export const SalesPage = ({ routeState, onRouteStateChange }: SalesPageProps) => {
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [searchInput, setSearchInput] = useState(routeState.q);
  const [searchQuery, setSearchQuery] = useState(routeState.q);
  const [page, setPage] = useState(routeState.page);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(true);

  const syncSalesRoute = useCallback(
    (next: Partial<SalesRouteState>) => {
      onRouteStateChange({
        page: next.page ?? page,
        q: next.q ?? searchQuery,
      });
    },
    [onRouteStateChange, page, searchQuery],
  );

  useEffect(() => {
    setPage((current) => (current === routeState.page ? current : routeState.page));
    setSearchQuery((current) => (current === routeState.q ? current : routeState.q));
    setSearchInput((current) => (current === routeState.q ? current : routeState.q));
  }, [routeState.page, routeState.q]);

  const cartItems = useMemo(
    () => Object.values(cart).sort((a, b) => a.product.name.localeCompare(b.product.name)),
    [cart],
  );

  const cartItemsCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity * item.product.salePrice, 0),
    [cartItems],
  );

  const cartQuantityByProductId = useMemo(() => {
    const map = new Map<number, number>();
    cartItems.forEach((item) => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cartItems]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await salesApi.getProducts({
        page,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
      });

      if (response.totalPages === 0 && page !== 1) {
        setPage(1);
        syncSalesRoute({ page: 1 });
        return;
      }

      if (response.totalPages > 0 && page > response.totalPages) {
        setPage(response.totalPages);
        syncSalesRoute({ page: response.totalPages });
        return;
      }

      setProducts(response.items);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar productos para venta.';
      setErrorMessage(message);
      setProducts([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, syncSalesRoute]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const addToCart = (product: SaleProduct) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    setCart((current) => {
      const existing = current[product.id];
      const nextQuantity = (existing?.quantity ?? 0) + 1;

      if (nextQuantity > product.stock) return current;

      return {
        ...current,
        [product.id]: {
          product,
          quantity: nextQuantity,
        },
      };
    });

    setIsCartOpen(true);
  };

  const increaseQuantity = (productId: number) => {
    setCart((current) => {
      const existing = current[productId];
      if (!existing) return current;
      if (existing.quantity >= existing.product.stock) return current;

      return {
        ...current,
        [productId]: {
          ...existing,
          quantity: existing.quantity + 1,
        },
      };
    });
  };

  const decreaseQuantity = (productId: number) => {
    setCart((current) => {
      const existing = current[productId];
      if (!existing) return current;

      if (existing.quantity <= 1) {
        const next = { ...current };
        delete next[productId];
        return next;
      }

      return {
        ...current,
        [productId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const handleConfirmSale = async () => {
    if (cartItems.length === 0) {
      setErrorMessage('El carrito esta vacio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const sale = await salesApi.createSale({
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      setCart({});
      setSuccessMessage(
        `Venta #${sale.id} registrada. Total: ${formatCurrency(sale.totalSale)}.`,
      );

      if (page !== 1) {
        setPage(1);
        syncSalesRoute({ page: 1 });
      } else {
        await fetchProducts();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo registrar la venta.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visiblePages = useMemo(() => buildVisiblePages(page, totalPages), [page, totalPages]);
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <>
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Modulo de ventas</h1>
            <span className="breadcrumb">Inicio / Ventas</span>
          </div>
        </header>

        <section className="filters-bar">
          <div className="filters-group">
            <div className="filter-item">
              <label className="filter-label" htmlFor="sales-search">
                Buscar producto
              </label>
              <input
                id="sales-search"
                className="form-input"
                placeholder="Nombre, codigo, marca o categoria..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const nextQuery = searchInput.trim();
                    setSearchQuery(nextQuery);
                    setPage(1);
                    syncSalesRoute({ q: nextQuery, page: 1 });
                  }
                }}
              />
            </div>
          </div>

          <div className="filters-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const nextQuery = searchInput.trim();
                setSearchQuery(nextQuery);
                setPage(1);
                syncSalesRoute({ q: nextQuery, page: 1 });
              }}
            >
              Buscar
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setPage(1);
                syncSalesRoute({ q: '', page: 1 });
              }}
            >
              Limpiar
            </button>
            <span className="results-count">
              Mostrando {products.length} de {totalItems} productos activos
            </span>
          </div>
        </section>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        {successMessage ? <p className="form-success">{successMessage}</p> : null}

        <section className="data-table-container">
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th className="table-cell table-cell--header">Producto</th>
                <th className="table-cell table-cell--header">Marca</th>
                <th className="table-cell table-cell--header">Categoria</th>
                <th className="table-cell table-cell--header">Codigo</th>
                <th className="table-cell table-cell--header table-cell--right">
                  Precio
                </th>
                <th className="table-cell table-cell--header table-cell--right">
                  Unidades
                </th>
                <th className="table-cell table-cell--header">Stock</th>
                <th className="table-cell table-cell--header">Accion</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={8}>
                    Cargando productos para venta...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={8}>
                    No hay productos activos para vender.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const inCart = cartQuantityByProductId.get(product.id) ?? 0;
                  const availableStock = Math.max(0, product.stock - inCart);
                  const canAdd = availableStock > 0;
                  const stockStatus = getStockStatus(availableStock);
                  const stockAlertLabel = getStockAlertLabel(stockStatus);

                  return (
                    <tr key={product.id} className="table-row">
                      <td className="table-cell">
                        <div className="product-cell">
                          <div className="product-info">
                            <span className="product-name">{product.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">{product.brand}</td>
                      <td className="table-cell">
                        <span className="category-badge">{product.category}</span>
                      </td>
                      <td className="table-cell table-cell--code">{product.codebar}</td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(product.salePrice)}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {availableStock}
                      </td>
                      <td className="table-cell">
                        <span className={`stock-indicator stock-indicator--${stockStatus}`}>
                          {stockAlertLabel ?? 'Normal'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => addToCart(product)}
                          disabled={!canAdd || isSubmitting}
                        >
                          {canAdd ? 'Agregar' : 'Sin stock'}
                        </button>
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
                className={`pagination-btn${page <= 1 ? ' pagination-btn--disabled' : ''}`}
                onClick={() => {
                  const nextPage = Math.max(1, page - 1);
                  setPage(nextPage);
                  syncSalesRoute({ page: nextPage });
                }}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <span className="pagination-pages">
                {visiblePages.map((visiblePage, index) => {
                  const previousPage = visiblePages[index - 1];
                  const needsEllipsis =
                    previousPage !== undefined && visiblePage - previousPage > 1;

                  return (
                    <span key={visiblePage}>
                      {needsEllipsis ? (
                        <span className="pagination-ellipsis">...</span>
                      ) : null}
                      <button
                        type="button"
                        className={`pagination-page${page === visiblePage ? ' pagination-page--active' : ''}`}
                        onClick={() => {
                          setPage(visiblePage);
                          syncSalesRoute({ page: visiblePage });
                        }}
                      >
                        {visiblePage}
                      </button>
                    </span>
                  );
                })}
              </span>
              <button
                type="button"
                className={`pagination-btn${page >= totalPages ? ' pagination-btn--disabled' : ''}`}
                onClick={() => {
                  const nextPage = totalPages === 0 ? 1 : Math.min(totalPages, page + 1);
                  setPage(nextPage);
                  syncSalesRoute({ page: nextPage });
                }}
                disabled={page >= totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </main>

      <aside className={`detail-panel${isCartOpen ? ' detail-panel--open' : ''}`}>
        <div className="panel-header">
          <h2 className="panel-title">Carrito</h2>
          <button
            type="button"
            className="panel-close"
            title="Cerrar"
            onClick={() => setIsCartOpen(false)}
          >
            x
          </button>
        </div>

        <div className="panel-content">
          {cartItems.length === 0 ? (
            <div className="detail-section">
              <h4 className="section-title">Sin productos</h4>
              <p className="detail-description">
                Agrega productos desde la lista para armar la venta.
              </p>
            </div>
          ) : (
            <div className="detail-section">
              <h4 className="section-title">Items del carrito</h4>
              <div className="info-list">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="info-row">
                    <div>
                      <div className="info-value">{item.product.name}</div>
                      <div className="info-label">
                        {formatCurrency(item.product.salePrice)} c/u
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => decreaseQuantity(item.product.id)}
                        disabled={isSubmitting}
                      >
                        -
                      </button>
                      <span className="info-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => increaseQuantity(item.product.id)}
                        disabled={isSubmitting || item.quantity >= item.product.stock}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => removeFromCart(item.product.id)}
                        disabled={isSubmitting}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="panel-footer">
          <div style={{ width: '100%' }}>
            <div className="info-row">
              <span className="info-label">Items</span>
              <span className="info-value">{cartItemsCount}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total</span>
              <span className="info-value info-value--highlight">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void handleConfirmSale();
              }}
              disabled={isSubmitting || cartItems.length === 0}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {isSubmitting ? 'Procesando venta...' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
