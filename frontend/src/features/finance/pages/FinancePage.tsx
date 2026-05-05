import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FinanceRouteState } from '../../../components/layout/MainLayout';
import '../../products/styles/products.css';
import { formatCurrency } from '../../products/presentation.utils';
import { financeApi } from '../api/finance.api';
import type { FinanceDailyDetail, FinanceDailySaleDetail, FinanceDailySummary } from '../types';

interface FinancePageProps {
  routeState: FinanceRouteState;
  onRouteStateChange: (next: Partial<FinanceRouteState>) => void;
}

function formatDayLabel(day: string): string {
  const date = new Date(`${day}T12:00:00.000Z`);
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'full' }).format(date);
}

function formatDateTimeLabel(dateTimeIso: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateTimeIso));
}

export const FinancePage = ({ routeState, onRouteStateChange }: FinancePageProps) => {
  const [summaryRows, setSummaryRows] = useState<FinanceDailySummary[]>([]);
  const [selectedDay, setSelectedDay] = useState(routeState.day);
  const [dailyDetail, setDailyDetail] = useState<FinanceDailyDetail | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [fromInput, setFromInput] = useState(routeState.from);
  const [toInput, setToInput] = useState(routeState.to);
  const [fromQuery, setFromQuery] = useState(routeState.from);
  const [toQuery, setToQuery] = useState(routeState.to);
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const syncFinanceRoute = useCallback(
    (next: Partial<FinanceRouteState>) => {
      onRouteStateChange({
        from: next.from ?? fromQuery,
        to: next.to ?? toQuery,
        day: next.day ?? selectedDay,
      });
    },
    [fromQuery, onRouteStateChange, selectedDay, toQuery],
  );

  useEffect(() => {
    setFromInput((current) => (current === routeState.from ? current : routeState.from));
    setToInput((current) => (current === routeState.to ? current : routeState.to));
    setFromQuery((current) => (current === routeState.from ? current : routeState.from));
    setToQuery((current) => (current === routeState.to ? current : routeState.to));
    setSelectedDay((current) => (current === routeState.day ? current : routeState.day));
  }, [routeState.day, routeState.from, routeState.to]);

  const fetchSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);

    try {
      const rows = await financeApi.getDailySummary({
        from: fromQuery || undefined,
        to: toQuery || undefined,
      });

      setSummaryRows(rows);

      if (rows.length === 0) {
        setSelectedDay('');
        setDailyDetail(null);
        setSelectedSaleId(null);
        if (selectedDay !== '') {
          syncFinanceRoute({ day: '' });
        }
        return;
      }

      const hasCurrentDay = selectedDay.length > 0 && rows.some((row) => row.day === selectedDay);
      if (hasCurrentDay) return;

      const nextDay = rows[0].day;
      setSelectedDay(nextDay);
      syncFinanceRoute({ day: nextDay });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cargar el resumen diario.';
      setSummaryError(message);
      setSummaryRows([]);
      setSelectedDay('');
      setDailyDetail(null);
      setSelectedSaleId(null);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [fromQuery, selectedDay, syncFinanceRoute, toQuery]);

  const fetchDailyDetail = useCallback(async () => {
    if (!selectedDay) {
      setDailyDetail(null);
      setSelectedSaleId(null);
      return;
    }

    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await financeApi.getDailyDetail(selectedDay);
      setDailyDetail(detail);
      setSelectedSaleId((current) => {
        if (current && detail.sales.some((sale) => sale.id === current)) return current;
        return detail.sales[0]?.id ?? null;
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cargar el detalle diario.';
      setDetailError(message);
      setDailyDetail(null);
      setSelectedSaleId(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    void fetchDailyDetail();
  }, [fetchDailyDetail]);

  const selectedSale = useMemo<FinanceDailySaleDetail | null>(() => {
    if (!dailyDetail || dailyDetail.sales.length === 0) return null;
    if (!selectedSaleId) return dailyDetail.sales[0];
    return dailyDetail.sales.find((sale) => sale.id === selectedSaleId) ?? dailyDetail.sales[0];
  }, [dailyDetail, selectedSaleId]);

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
                setSelectedDay('');
                syncFinanceRoute({
                  from: normalizedFrom,
                  to: normalizedTo,
                  day: '',
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
                setSelectedDay('');
                syncFinanceRoute({
                  from: '',
                  to: '',
                  day: '',
                });
              }}
            >
              Limpiar
            </button>
            <span className="results-count">{summaryRows.length} dias con ventas</span>
          </div>
        </section>

        {summaryError ? <p className="form-error">{summaryError}</p> : null}

        <section className="data-table-container">
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th className="table-cell table-cell--header">Fecha</th>
                <th className="table-cell table-cell--header table-cell--right">Ventas</th>
                <th className="table-cell table-cell--header table-cell--right">Items</th>
                <th className="table-cell table-cell--header table-cell--right">Total venta</th>
                <th className="table-cell table-cell--header table-cell--right">Costo</th>
                <th className="table-cell table-cell--header table-cell--right">Utilidad</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isSummaryLoading ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={6}>
                    Cargando resumen diario...
                  </td>
                </tr>
              ) : summaryRows.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={6}>
                    No hay ventas en el rango seleccionado.
                  </td>
                </tr>
              ) : (
                summaryRows.map((row) => {
                  const isSelected = row.day === selectedDay;
                  return (
                    <tr
                      key={row.day}
                      className={`table-row table-row--clickable${isSelected ? ' table-row--selected' : ''}`}
                      onClick={() => {
                        setSelectedDay(row.day);
                        setIsDetailOpen(true);
                        syncFinanceRoute({ day: row.day });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedDay(row.day);
                          setIsDetailOpen(true);
                          syncFinanceRoute({ day: row.day });
                        }
                      }}
                      tabIndex={0}
                    >
                      <td className="table-cell">{formatDayLabel(row.day)}</td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {row.salesCount}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {row.itemsCount}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(row.totalSale)}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(row.totalCost)}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(row.profit)}
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
          <h2 className="panel-title">Detalle diario</h2>
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
          {!selectedDay ? (
            <div className="detail-section">
              <h4 className="section-title">Sin seleccion</h4>
              <p className="detail-description">Selecciona un dia para revisar sus ventas.</p>
            </div>
          ) : (
            <>
              <div className="detail-section detail-section--first">
                <h4 className="section-title">{formatDayLabel(selectedDay)}</h4>
                <p className="detail-description">
                  Informacion agrupada por ventas del dia seleccionado.
                </p>
              </div>

              {detailError ? <p className="form-error">{detailError}</p> : null}

              {isDetailLoading ? (
                <p className="detail-description">Cargando detalle del dia...</p>
              ) : dailyDetail ? (
                <>
                  <div className="detail-stats">
                    <div className="stat-card">
                      <span className="stat-label">Ventas</span>
                      <span className="stat-value">{dailyDetail.salesCount}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Items</span>
                      <span className="stat-value">{dailyDetail.itemsCount}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Total venta</span>
                      <span className="stat-value stat-value--price">
                        {formatCurrency(dailyDetail.totalSale)}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4 className="section-title">Ventas del dia</h4>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead className="table-header">
                          <tr>
                            <th className="table-cell table-cell--header">ID venta</th>
                            <th className="table-cell table-cell--header">Fecha</th>
                            <th className="table-cell table-cell--header table-cell--right">
                              Items
                            </th>
                            <th className="table-cell table-cell--header table-cell--right">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {dailyDetail.sales.length === 0 ? (
                            <tr className="table-row">
                              <td className="table-cell" colSpan={4}>
                                No hay ventas registradas este dia.
                              </td>
                            </tr>
                          ) : (
                            dailyDetail.sales.map((sale) => {
                              const isSaleSelected = selectedSale?.id === sale.id;
                              return (
                                <tr
                                  key={sale.id}
                                  className={`table-row table-row--clickable${isSaleSelected ? ' table-row--selected' : ''}`}
                                  onClick={() => setSelectedSaleId(sale.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault();
                                      setSelectedSaleId(sale.id);
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
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4 className="section-title">
                      {selectedSale
                        ? `Items de venta #${selectedSale.id}`
                        : 'Items de venta'}
                    </h4>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead className="table-header">
                          <tr>
                            <th className="table-cell table-cell--header">ID</th>
                            <th className="table-cell table-cell--header">Codigo</th>
                            <th className="table-cell table-cell--header">Producto</th>
                            <th className="table-cell table-cell--header table-cell--right">Cant.</th>
                            <th className="table-cell table-cell--header table-cell--right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {!selectedSale || selectedSale.items.length === 0 ? (
                            <tr className="table-row">
                              <td className="table-cell" colSpan={5}>
                                No hay items para esta venta.
                              </td>
                            </tr>
                          ) : (
                            selectedSale.items.map((item) => (
                              <tr key={item.id} className="table-row">
                                <td className="table-cell table-cell--number">{item.productId}</td>
                                <td className="table-cell table-cell--code">{item.codebar}</td>
                                <td className="table-cell">{item.name}</td>
                                <td className="table-cell table-cell--right table-cell--number">
                                  {item.quantity}
                                </td>
                                <td className="table-cell table-cell--right table-cell--number">
                                  {formatCurrency(item.lineSaleTotal)}
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
      </aside>
    </>
  );
};
