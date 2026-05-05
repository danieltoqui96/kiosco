import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FinanceRouteState } from '../../../components/layout/MainLayout';
import '../../products/styles/products.css';
import { formatCurrency } from '../../products/presentation.utils';
import { salesApi } from '../../sales/api/sales.api';
import type { Sale, SaleProduct, SaleSummary } from '../../sales/types';

interface FinancePageProps {
  routeState: FinanceRouteState;
  onRouteStateChange: (next: Partial<FinanceRouteState>) => void;
}

interface EditableSaleItem {
  productId: number;
  codebar: string;
  name: string;
  brand: string;
  unitSalePrice: number;
  quantity: number;
}

function formatDateTimeLabel(dateTimeIso: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateTimeIso));
}

function toDatetimeLocal(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export const FinancePage = ({ routeState, onRouteStateChange }: FinancePageProps) => {
  const [salesRows, setSalesRows] = useState<SaleSummary[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(
    routeState.saleId ? Number(routeState.saleId) : null,
  );
  const [saleDetail, setSaleDetail] = useState<Sale | null>(null);
  const [fromInput, setFromInput] = useState(routeState.from);
  const [toInput, setToInput] = useState(routeState.to);
  const [fromQuery, setFromQuery] = useState(routeState.from);
  const [toQuery, setToQuery] = useState(routeState.to);
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSoldAt, setEditSoldAt] = useState('');
  const [editItems, setEditItems] = useState<EditableSaleItem[]>([]);
  const [editSearchInput, setEditSearchInput] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<SaleProduct[]>([]);
  const [isSearchingEditProducts, setIsSearchingEditProducts] = useState(false);
  const [editSearchError, setEditSearchError] = useState<string | null>(null);

  const syncFinanceRoute = useCallback(
    (next: Partial<FinanceRouteState>) => {
      onRouteStateChange({
        from: next.from ?? fromQuery,
        to: next.to ?? toQuery,
        saleId:
          next.saleId ??
          (selectedSaleId !== null ? String(selectedSaleId) : ''),
      });
    },
    [fromQuery, onRouteStateChange, selectedSaleId, toQuery],
  );

  useEffect(() => {
    setFromInput((current) => (current === routeState.from ? current : routeState.from));
    setToInput((current) => (current === routeState.to ? current : routeState.to));
    setFromQuery((current) => (current === routeState.from ? current : routeState.from));
    setToQuery((current) => (current === routeState.to ? current : routeState.to));

    const nextSaleId = routeState.saleId ? Number(routeState.saleId) : null;
    if (nextSaleId === null || Number.isNaN(nextSaleId)) {
      setSelectedSaleId((current) => (current === null ? current : null));
    } else {
      setSelectedSaleId((current) => (current === nextSaleId ? current : nextSaleId));
    }
  }, [routeState.from, routeState.saleId, routeState.to]);

  const fetchSales = useCallback(async () => {
    setIsListLoading(true);
    setListError(null);

    try {
      const response = await salesApi.getSales({
        page: 1,
        limit: 1000,
        from: fromQuery || undefined,
        to: toQuery || undefined,
      });

      setSalesRows(response.items);

      if (response.items.length === 0) {
        setSelectedSaleId(null);
        setSaleDetail(null);
        syncFinanceRoute({ saleId: '' });
        return;
      }

      const hasCurrentSale =
        selectedSaleId !== null &&
        response.items.some((sale) => sale.id === selectedSaleId);

      if (hasCurrentSale) return;

      const nextSaleId = response.items[0].id;
      setSelectedSaleId(nextSaleId);
      syncFinanceRoute({ saleId: String(nextSaleId) });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron cargar ventas.';
      setListError(message);
      setSalesRows([]);
      setSelectedSaleId(null);
      setSaleDetail(null);
    } finally {
      setIsListLoading(false);
    }
  }, [fromQuery, selectedSaleId, syncFinanceRoute, toQuery]);

  const fetchSaleDetail = useCallback(async () => {
    if (!selectedSaleId) {
      setSaleDetail(null);
      return;
    }

    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await salesApi.getSaleById(selectedSaleId);
      setSaleDetail(detail);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo cargar el detalle de la venta.';
      setDetailError(message);
      setSaleDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, [selectedSaleId]);

  useEffect(() => {
    void fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    void fetchSaleDetail();
  }, [fetchSaleDetail]);

  const selectedSaleSummary = useMemo(
    () => salesRows.find((sale) => sale.id === selectedSaleId) ?? null,
    [salesRows, selectedSaleId],
  );

  const openEditModal = () => {
    if (!saleDetail) return;

    setEditSoldAt(toDatetimeLocal(saleDetail.soldAt));
    setEditItems(
      saleDetail.items.map((item) => ({
        productId: item.productId,
        codebar: item.codebar,
        name: item.name,
        brand: item.brand,
        unitSalePrice: item.unitSalePrice,
        quantity: item.quantity,
      })),
    );
    setEditSearchInput('');
    setEditSearchResults([]);
    setEditSearchError(null);
    setIsEditModalOpen(true);
    setActionMessage(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditSoldAt('');
    setEditItems([]);
    setEditSearchInput('');
    setEditSearchResults([]);
    setEditSearchError(null);
  };

  const handleSearchProductsForEdit = async () => {
    setIsSearchingEditProducts(true);
    setEditSearchError(null);

    try {
      const response = await salesApi.getProducts({
        page: 1,
        limit: 10,
        search: editSearchInput.trim() || undefined,
      });
      setEditSearchResults(response.items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron buscar productos.';
      setEditSearchError(message);
      setEditSearchResults([]);
    } finally {
      setIsSearchingEditProducts(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!saleDetail) return;

    const normalizedItems = editItems
      .map((item) => ({
        productId: item.productId,
        quantity: Math.max(0, Math.floor(item.quantity)),
      }))
      .filter((item) => item.quantity > 0);

    if (normalizedItems.length === 0) {
      setDetailError('La venta debe tener al menos un item con cantidad mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setDetailError(null);
    setActionMessage(null);

    try {
      const soldAtIso = fromDatetimeLocal(editSoldAt);
      const updated = await salesApi.updateSale(saleDetail.id, {
        items: normalizedItems,
        soldAt: soldAtIso,
      });

      closeEditModal();
      setActionMessage(`Venta #${updated.id} actualizada correctamente.`);
      await fetchSales();
      await fetchSaleDetail();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo actualizar la venta.';
      setDetailError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!saleDetail) return;

    const shouldDelete = window.confirm(
      `Deseas eliminar la venta #${saleDetail.id}? Esta accion restituira stock.`,
    );
    if (!shouldDelete) return;

    setIsSubmitting(true);
    setDetailError(null);
    setActionMessage(null);

    try {
      await salesApi.deleteSale(saleDetail.id);
      setActionMessage(`Venta #${saleDetail.id} eliminada correctamente.`);
      setSaleDetail(null);
      await fetchSales();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo eliminar la venta.';
      setDetailError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Modulo de finanzas</h1>
            <span className="breadcrumb">Inicio / Finanzas</span>
          </div>
        </header>

        <section className="filters-bar">
          <div className="filters-group">
            <div className="filter-item filter-item--date">
              <label className="filter-label" htmlFor="finance-from">
                Desde
              </label>
              <input
                id="finance-from"
                className="form-input"
                type="date"
                value={fromInput}
                onChange={(event) => setFromInput(event.target.value)}
              />
            </div>
            <div className="filter-item filter-item--date">
              <label className="filter-label" htmlFor="finance-to">
                Hasta
              </label>
              <input
                id="finance-to"
                className="form-input"
                type="date"
                value={toInput}
                onChange={(event) => setToInput(event.target.value)}
              />
            </div>
          </div>

          <div className="filters-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const normalizedFrom = fromInput.trim();
                const normalizedTo = toInput.trim();
                setFromQuery(normalizedFrom);
                setToQuery(normalizedTo);
                syncFinanceRoute({
                  from: normalizedFrom,
                  to: normalizedTo,
                  saleId: '',
                });
              }}
            >
              Buscar
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setFromInput('');
                setToInput('');
                setFromQuery('');
                setToQuery('');
                syncFinanceRoute({
                  from: '',
                  to: '',
                  saleId: '',
                });
              }}
            >
              Limpiar
            </button>
            <span className="results-count">{salesRows.length} ventas en el rango</span>
          </div>
        </section>

        {listError ? <p className="form-error">{listError}</p> : null}
        {actionMessage ? <p className="form-success">{actionMessage}</p> : null}

        <section className="data-table-container">
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th className="table-cell table-cell--header">ID</th>
                <th className="table-cell table-cell--header">Fecha</th>
                <th className="table-cell table-cell--header table-cell--right">Items</th>
                <th className="table-cell table-cell--header table-cell--right">Total venta</th>
                <th className="table-cell table-cell--header table-cell--right">Costo</th>
                <th className="table-cell table-cell--header table-cell--right">Utilidad</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isListLoading ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={6}>
                    Cargando ventas...
                  </td>
                </tr>
              ) : salesRows.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={6}>
                    No hay ventas en el rango seleccionado.
                  </td>
                </tr>
              ) : (
                salesRows.map((sale) => {
                  const isSelected = selectedSaleId === sale.id;
                  return (
                    <tr
                      key={sale.id}
                      className={`table-row table-row--clickable${isSelected ? ' table-row--selected' : ''}`}
                      onClick={() => {
                        setSelectedSaleId(sale.id);
                        setIsDetailOpen(true);
                        syncFinanceRoute({ saleId: String(sale.id) });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedSaleId(sale.id);
                          setIsDetailOpen(true);
                          syncFinanceRoute({ saleId: String(sale.id) });
                        }
                      }}
                      tabIndex={0}
                    >
                      <td className="table-cell table-cell--number">{sale.id}</td>
                      <td className="table-cell">{formatDateTimeLabel(sale.soldAt)}</td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {sale.itemsCount}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(sale.totalSale)}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(sale.totalCost)}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(sale.profit)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </main>

      <aside className={`detail-panel${isDetailOpen ? ' detail-panel--open' : ''}`}>
        <div className="panel-header">
          <h2 className="panel-title">Detalle de venta</h2>
          <button
            type="button"
            className="panel-close"
            title="Cerrar"
            onClick={() => setIsDetailOpen(false)}
          >
            x
          </button>
        </div>

        <div className="panel-content">
          {!selectedSaleSummary ? (
            <div className="detail-section">
              <h4 className="section-title">Sin seleccion</h4>
              <p className="detail-description">
                Selecciona una venta de la tabla para ver su detalle.
              </p>
            </div>
          ) : (
            <>
              <div className="detail-section detail-section--first">
                <h4 className="section-title">Venta #{selectedSaleSummary.id}</h4>
                <p className="detail-description">
                  Fecha: {formatDateTimeLabel(selectedSaleSummary.soldAt)}
                </p>
              </div>

              {detailError ? <p className="form-error">{detailError}</p> : null}

              {isDetailLoading ? (
                <p className="detail-description">Cargando detalle de venta...</p>
              ) : saleDetail ? (
                <>
                  <div className="detail-stats">
                    <div className="stat-card">
                      <span className="stat-label">Items</span>
                      <span className="stat-value">{saleDetail.itemsCount}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Total</span>
                      <span className="stat-value stat-value--price">
                        {formatCurrency(saleDetail.totalSale)}
                      </span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Utilidad</span>
                      <span className="stat-value">{formatCurrency(saleDetail.profit)}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4 className="section-title">Items vendidos</h4>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead className="table-header">
                          <tr>
                            <th className="table-cell table-cell--header">Producto</th>
                            <th className="table-cell table-cell--header">Marca</th>
                            <th className="table-cell table-cell--header table-cell--right">Cant.</th>
                            <th className="table-cell table-cell--header table-cell--right">Precio</th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {saleDetail.items.length === 0 ? (
                            <tr className="table-row">
                              <td className="table-cell" colSpan={4}>
                                Esta venta no tiene items.
                              </td>
                            </tr>
                          ) : (
                            saleDetail.items.map((item) => (
                              <tr key={item.id} className="table-row">
                                <td className="table-cell">{item.name}</td>
                                <td className="table-cell">{item.brand || 'Sin marca'}</td>
                                <td className="table-cell table-cell--right table-cell--number">
                                  {item.quantity}
                                </td>
                                <td className="table-cell table-cell--right table-cell--number">
                                  {formatCurrency(item.unitSalePrice)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>

        <div className="panel-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openEditModal}
            disabled={!saleDetail || isSubmitting}
          >
            Editar venta
          </button>
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={() => {
              void handleDeleteSale();
            }}
            disabled={!saleDetail || isSubmitting}
          >
            Eliminar venta
          </button>
        </div>
      </aside>

      {isEditModalOpen ? (
        <div className="modal-overlay modal-overlay--visible" role="dialog" aria-modal="true">
          <div className="modal modal--large finance-edit-modal">
            <div className="modal-header">
              <h3 className="modal-title">Editar venta</h3>
              <button type="button" className="modal-close" onClick={closeEditModal}>
                x
              </button>
            </div>

            <div className="modal-content">
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="edit-sold-at">
                    Fecha y hora
                  </label>
                  <input
                    id="edit-sold-at"
                    className="form-input"
                    type="datetime-local"
                    value={editSoldAt}
                    onChange={(event) => setEditSoldAt(event.target.value)}
                  />
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Items</h4>
                <div className="info-list">
                  <div className="sales-edit-items-header">
                    <span>Codigo</span>
                    <span>Producto</span>
                    <span>Marca</span>
                    <span>Precio</span>
                    <span>Cantidad</span>
                  </div>
                  {editItems.map((item, index) => (
                    <div key={item.productId} className="sales-edit-item-row">
                      <div className="sales-edit-item-meta">
                        <div className="sales-edit-item-field">
                          <span className="info-value info-value--mono">{item.codebar}</span>
                        </div>
                        <div className="sales-edit-item-field">
                          <span className="info-value">{item.name}</span>
                        </div>
                        <div className="sales-edit-item-field">
                          <span className="info-value">{item.brand || 'Sin marca'}</span>
                        </div>
                        <div className="sales-edit-item-field">
                          <span className="info-value">{formatCurrency(item.unitSalePrice)}</span>
                        </div>
                      </div>
                      <div className="sales-edit-item-actions">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditItems((current) =>
                              current.map((currentItem, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      ...currentItem,
                                      quantity: Math.max(0, currentItem.quantity - 1),
                                    }
                                  : currentItem,
                              ),
                            );
                          }}
                        >
                          -
                        </button>
                        <span className="info-value">{item.quantity}</span>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditItems((current) =>
                              current.map((currentItem, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      ...currentItem,
                                      quantity: currentItem.quantity + 1,
                                    }
                                  : currentItem,
                              ),
                            );
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Agregar producto</h4>
                <div className="filters-bar">
                  <div className="filters-group">
                    <div className="filter-item">
                      <label className="filter-label" htmlFor="edit-sale-search-product">
                        Buscar producto
                      </label>
                      <input
                        id="edit-sale-search-product"
                        className="form-input"
                        placeholder="Nombre o codigo..."
                        value={editSearchInput}
                        onChange={(event) => setEditSearchInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void handleSearchProductsForEdit();
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
                        void handleSearchProductsForEdit();
                      }}
                      disabled={isSearchingEditProducts}
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                {editSearchError ? <p className="form-error">{editSearchError}</p> : null}

                <div className="data-table-container">
                  <table className="data-table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell table-cell--header">Producto</th>
                        <th className="table-cell table-cell--header">Marca</th>
                        <th className="table-cell table-cell--header">Codigo</th>
                        <th className="table-cell table-cell--header table-cell--right">Stock</th>
                        <th className="table-cell table-cell--header">Accion</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {isSearchingEditProducts ? (
                        <tr className="table-row">
                          <td className="table-cell" colSpan={5}>
                            Buscando productos...
                          </td>
                        </tr>
                      ) : editSearchResults.length === 0 ? (
                        <tr className="table-row">
                          <td className="table-cell" colSpan={5}>
                            No hay resultados.
                          </td>
                        </tr>
                      ) : (
                        editSearchResults.map((product) => (
                          <tr key={product.id} className="table-row">
                            <td className="table-cell">{product.name}</td>
                            <td className="table-cell">{product.brand}</td>
                            <td className="table-cell table-cell--code">{product.codebar}</td>
                            <td className="table-cell table-cell--right table-cell--number">
                              {product.stock}
                            </td>
                            <td className="table-cell">
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                  setEditItems((current) => {
                                    const existing = current.find(
                                      (item) => item.productId === product.id,
                                    );
                                    if (existing) {
                                      return current.map((item) =>
                                        item.productId === product.id
                                          ? { ...item, quantity: item.quantity + 1 }
                                          : item,
                                      );
                                    }

                                    return [
                                      ...current,
                                      {
                                        productId: product.id,
                                        codebar: product.codebar,
                                        name: product.name,
                                        brand: product.brand,
                                        unitSalePrice: product.salePrice,
                                        quantity: 1,
                                      },
                                    ];
                                  });
                                }}
                              >
                                Agregar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeEditModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  void handleSaveEdit();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
