import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SalesRouteState } from '../../../components/layout/MainLayout';
import '../../products/styles/products.css';
import { formatCurrency } from '../../products/presentation.utils';
import { salesApi } from '../api/sales.api';
import type { PaymentMethod, Sale, SaleProduct, SaleSummary } from '../types';

interface SalesPageProps {
  routeState: SalesRouteState;
  onRouteStateChange: (next: Partial<SalesRouteState>) => void;
}

interface EditableSaleItem {
  productId: number;
  codebar: string;
  name: string;
  brand: string;
  stock: number;
  baseQuantity: number;
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

function getEditableItemMaxQuantity(item: EditableSaleItem): number {
  return Math.max(0, item.baseQuantity + item.stock);
}

function getEditableItemAvailableStock(item: EditableSaleItem): number {
  return Math.max(0, getEditableItemMaxQuantity(item) - item.quantity);
}

function formatPaymentMethod(method: PaymentMethod): string {
  return method === 'card' ? 'Tarjeta' : 'Efectivo';
}

export const SalesPage = ({ routeState, onRouteStateChange }: SalesPageProps) => {
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
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('cash');
  const [editItems, setEditItems] = useState<EditableSaleItem[]>([]);
  const [editSearchInput, setEditSearchInput] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<SaleProduct[]>([]);
  const [isSearchingEditProducts, setIsSearchingEditProducts] = useState(false);
  const [editSearchError, setEditSearchError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSoldAt, setCreateSoldAt] = useState('');
  const [createPaymentMethod, setCreatePaymentMethod] = useState<PaymentMethod>('cash');
  const [createItems, setCreateItems] = useState<EditableSaleItem[]>([]);
  const [createSearchInput, setCreateSearchInput] = useState('');
  const [createSearchResults, setCreateSearchResults] = useState<SaleProduct[]>([]);
  const [isSearchingCreateProducts, setIsSearchingCreateProducts] = useState(false);
  const [createSearchError, setCreateSearchError] = useState<string | null>(null);

  const syncSalesRoute = useCallback(
    (next: Partial<SalesRouteState>) => {
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
      const sortedItems = [...response.items].sort((a, b) => b.id - a.id);

      setSalesRows(sortedItems);

      if (sortedItems.length === 0) {
        setSelectedSaleId(null);
        setSaleDetail(null);
        syncSalesRoute({ saleId: '' });
        return;
      }

      const hasCurrentSale =
        selectedSaleId !== null &&
        sortedItems.some((sale) => sale.id === selectedSaleId);

      if (hasCurrentSale) return;

      const nextSaleId = sortedItems[0].id;
      setSelectedSaleId(nextSaleId);
      syncSalesRoute({ saleId: String(nextSaleId) });
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
  }, [fromQuery, selectedSaleId, syncSalesRoute, toQuery]);

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

  const openCreateModal = () => {
    setCreateSoldAt(toDatetimeLocal(new Date().toISOString()));
    setCreatePaymentMethod('cash');
    setCreateItems([]);
    setCreateSearchInput('');
    setCreateSearchResults([]);
    setCreateSearchError(null);
    setIsCreateModalOpen(true);
    setActionMessage(null);
    setDetailError(null);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateSoldAt('');
    setCreatePaymentMethod('cash');
    setCreateItems([]);
    setCreateSearchInput('');
    setCreateSearchResults([]);
    setCreateSearchError(null);
  };

  const handleSearchProductsForCreate = async () => {
    setIsSearchingCreateProducts(true);
    setCreateSearchError(null);

    try {
      const response = await salesApi.getProducts({
        page: 1,
        limit: 10,
        search: createSearchInput.trim() || undefined,
      });
      setCreateSearchResults(response.items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron buscar productos.';
      setCreateSearchError(message);
      setCreateSearchResults([]);
    } finally {
      setIsSearchingCreateProducts(false);
    }
  };

  const handleSaveCreate = async () => {
    const normalizedItems = createItems
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
      const soldAtIso = fromDatetimeLocal(createSoldAt);
      const created = await salesApi.createSale({
        items: normalizedItems,
        paymentMethod: createPaymentMethod,
        soldAt: soldAtIso,
      });

      closeCreateModal();
      setActionMessage(`Venta #${created.id} registrada correctamente.`);
      window.dispatchEvent(new Event('inventory:changed'));
      window.dispatchEvent(new Event('cashbox:changed'));
      await fetchSales();
      setSelectedSaleId(created.id);
      syncSalesRoute({ saleId: String(created.id) });
      await fetchSaleDetail();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo registrar la venta.';
      setDetailError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (!saleDetail) return;

    setEditSoldAt(toDatetimeLocal(saleDetail.soldAt));
    setEditPaymentMethod(saleDetail.paymentMethod);
    setEditItems(
      saleDetail.items.map((item) => ({
        productId: item.productId,
        codebar: item.codebar,
        name: item.name,
        brand: item.brand,
        stock: item.stock,
        baseQuantity: item.quantity,
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
    setEditPaymentMethod('cash');
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

    const saleId = saleDetail.id;
    const currentSoldAt = editSoldAt;
    const currentItems = normalizedItems;
    const currentPaymentMethod = editPaymentMethod;

    setIsSubmitting(true);
    setDetailError(null);
    setActionMessage(null);

    try {
      const soldAtIso = fromDatetimeLocal(currentSoldAt);
      const updated = await salesApi.updateSale(saleId, {
        items: currentItems,
        soldAt: soldAtIso,
        paymentMethod: currentPaymentMethod,
      });

      closeEditModal();
      setActionMessage(`Venta #${updated.id} actualizada correctamente.`);
      window.dispatchEvent(new Event('inventory:changed'));
      window.dispatchEvent(new Event('cashbox:changed'));
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
      window.dispatchEvent(new Event('inventory:changed'));
      window.dispatchEvent(new Event('cashbox:changed'));
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
            <h1 className="page-title">Modulo de ventas</h1>
            <span className="breadcrumb">Inicio / Ventas</span>
          </div>
        </header>

        <section className="filters-bar">
          <div className="filters-group">
            <div className="filter-item filter-item--date">
              <label className="filter-label" htmlFor="sales-from">
                Desde
              </label>
              <input
                id="sales-from"
                className="form-input"
                type="date"
                value={fromInput}
                onChange={(event) => setFromInput(event.target.value)}
              />
            </div>
            <div className="filter-item filter-item--date">
              <label className="filter-label" htmlFor="sales-to">
                Hasta
              </label>
              <input
                id="sales-to"
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
                syncSalesRoute({
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
                syncSalesRoute({
                  from: '',
                  to: '',
                  saleId: '',
                });
              }}
            >
              Limpiar
            </button>
            <button type="button" className="btn btn-secondary" onClick={openCreateModal}>
              Nueva venta
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
                <th className="table-cell table-cell--header">Pago</th>
                <th className="table-cell table-cell--header table-cell--right">Items</th>
                <th className="table-cell table-cell--header table-cell--right">Total venta</th>
                <th className="table-cell table-cell--header table-cell--right">Costo</th>
                <th className="table-cell table-cell--header table-cell--right">Utilidad</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isListLoading ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={7}>
                    Cargando ventas...
                  </td>
                </tr>
              ) : salesRows.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={7}>
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
                        syncSalesRoute({ saleId: String(sale.id) });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedSaleId(sale.id);
                          setIsDetailOpen(true);
                          syncSalesRoute({ saleId: String(sale.id) });
                        }
                      }}
                      tabIndex={0}
                    >
                      <td className="table-cell table-cell--number">{sale.id}</td>
                      <td className="table-cell">{formatDateTimeLabel(sale.soldAt)}</td>
                      <td className="table-cell">{formatPaymentMethod(sale.paymentMethod)}</td>
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
                    <div className="stat-card">
                      <span className="stat-label">Pago</span>
                      <span className="stat-value">
                        {formatPaymentMethod(saleDetail.paymentMethod)}
                      </span>
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
                <div className="form-field">
                  <label className="form-label" htmlFor="edit-payment-method">
                    Metodo de pago
                  </label>
                  <select
                    id="edit-payment-method"
                    className="form-select"
                    value={editPaymentMethod}
                    onChange={(event) => setEditPaymentMethod(event.target.value as PaymentMethod)}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Items</h4>
                <div className="info-list">
                  <div className="sales-edit-items-header">
                    <span>Codigo</span>
                    <span>Producto</span>
                    <span>Marca</span>
                    <span>Stock</span>
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
                          <span className="info-value">{getEditableItemAvailableStock(item)}</span>
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
                          disabled={item.quantity >= getEditableItemMaxQuantity(item)}
                          onClick={() => {
                            setEditItems((current) =>
                              current.map((currentItem, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      ...currentItem,
                                      quantity: Math.min(
                                        getEditableItemMaxQuantity(currentItem),
                                        currentItem.quantity + 1,
                                      ),
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
                        editSearchResults.map((product) => {
                          const existing = editItems.find(
                            (item) => item.productId === product.id,
                          );
                          const availableStock = existing
                            ? Math.max(
                                0,
                                existing.baseQuantity + product.stock - existing.quantity,
                              )
                            : Math.max(0, product.stock);
                          const canAdd = availableStock > 0;

                          return (
                            <tr key={product.id} className="table-row">
                              <td className="table-cell">{product.name}</td>
                              <td className="table-cell">{product.brand}</td>
                              <td className="table-cell table-cell--code">{product.codebar}</td>
                              <td className="table-cell table-cell--right table-cell--number">
                                {availableStock}
                              </td>
                              <td className="table-cell">
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  disabled={!canAdd}
                                  onClick={() => {
                                    setEditItems((current) => {
                                      const currentExisting = current.find(
                                        (item) => item.productId === product.id,
                                      );

                                      if (currentExisting) {
                                        const maxForCurrent = Math.max(
                                          0,
                                          currentExisting.baseQuantity + product.stock,
                                        );
                                        if (currentExisting.quantity >= maxForCurrent) {
                                          return current;
                                        }

                                        return current.map((item) =>
                                          item.productId === product.id
                                            ? {
                                                ...item,
                                                stock: product.stock,
                                                quantity: Math.min(
                                                  maxForCurrent,
                                                  item.quantity + 1,
                                                ),
                                              }
                                            : item,
                                        );
                                      }

                                      if (product.stock <= 0) return current;

                                      return [
                                        ...current,
                                        {
                                          productId: product.id,
                                          codebar: product.codebar,
                                          name: product.name,
                                          brand: product.brand,
                                          stock: product.stock,
                                          baseQuantity: 0,
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
                          );
                        })
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

      {isCreateModalOpen ? (
        <div className="modal-overlay modal-overlay--visible" role="dialog" aria-modal="true">
          <div className="modal modal--large finance-edit-modal">
            <div className="modal-header">
              <h3 className="modal-title">Nueva venta</h3>
              <button type="button" className="modal-close" onClick={closeCreateModal}>
                x
              </button>
            </div>

            <div className="modal-content">
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="create-sold-at">
                    Fecha y hora
                  </label>
                  <input
                    id="create-sold-at"
                    className="form-input"
                    type="datetime-local"
                    value={createSoldAt}
                    onChange={(event) => setCreateSoldAt(event.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="create-payment-method">
                    Metodo de pago
                  </label>
                  <select
                    id="create-payment-method"
                    className="form-select"
                    value={createPaymentMethod}
                    onChange={(event) => setCreatePaymentMethod(event.target.value as PaymentMethod)}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Items</h4>
                <div className="info-list">
                  <div className="sales-edit-items-header">
                    <span>Codigo</span>
                    <span>Producto</span>
                    <span>Marca</span>
                    <span>Stock</span>
                    <span>Precio</span>
                    <span>Cantidad</span>
                  </div>
                  {createItems.map((item, index) => (
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
                          <span className="info-value">{getEditableItemAvailableStock(item)}</span>
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
                            setCreateItems((current) =>
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
                          disabled={item.quantity >= getEditableItemMaxQuantity(item)}
                          onClick={() => {
                            setCreateItems((current) =>
                              current.map((currentItem, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      ...currentItem,
                                      quantity: Math.min(
                                        getEditableItemMaxQuantity(currentItem),
                                        currentItem.quantity + 1,
                                      ),
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
                      <label className="filter-label" htmlFor="create-sale-search-product">
                        Buscar producto
                      </label>
                      <input
                        id="create-sale-search-product"
                        className="form-input"
                        placeholder="Nombre o codigo..."
                        value={createSearchInput}
                        onChange={(event) => setCreateSearchInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void handleSearchProductsForCreate();
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
                        void handleSearchProductsForCreate();
                      }}
                      disabled={isSearchingCreateProducts}
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                {createSearchError ? <p className="form-error">{createSearchError}</p> : null}

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
                      {isSearchingCreateProducts ? (
                        <tr className="table-row">
                          <td className="table-cell" colSpan={5}>
                            Buscando productos...
                          </td>
                        </tr>
                      ) : createSearchResults.length === 0 ? (
                        <tr className="table-row">
                          <td className="table-cell" colSpan={5}>
                            No hay resultados.
                          </td>
                        </tr>
                      ) : (
                        createSearchResults.map((product) => {
                          const existing = createItems.find(
                            (item) => item.productId === product.id,
                          );
                          const availableStock = existing
                            ? Math.max(0, product.stock - existing.quantity)
                            : Math.max(0, product.stock);
                          const canAdd = availableStock > 0;

                          return (
                            <tr key={product.id} className="table-row">
                              <td className="table-cell">{product.name}</td>
                              <td className="table-cell">{product.brand}</td>
                              <td className="table-cell table-cell--code">{product.codebar}</td>
                              <td className="table-cell table-cell--right table-cell--number">
                                {availableStock}
                              </td>
                              <td className="table-cell">
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  disabled={!canAdd}
                                  onClick={() => {
                                    setCreateItems((current) => {
                                      const currentExisting = current.find(
                                        (item) => item.productId === product.id,
                                      );

                                      if (currentExisting) {
                                        const maxForCurrent = Math.max(0, product.stock);
                                        if (currentExisting.quantity >= maxForCurrent) {
                                          return current;
                                        }

                                        return current.map((item) =>
                                          item.productId === product.id
                                            ? {
                                                ...item,
                                                stock: product.stock,
                                                quantity: Math.min(
                                                  maxForCurrent,
                                                  item.quantity + 1,
                                                ),
                                              }
                                            : item,
                                        );
                                      }

                                      if (product.stock <= 0) return current;

                                      return [
                                        ...current,
                                        {
                                          productId: product.id,
                                          codebar: product.codebar,
                                          name: product.name,
                                          brand: product.brand,
                                          stock: product.stock,
                                          baseQuantity: 0,
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
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeCreateModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  void handleSaveCreate();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Registrar venta'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
