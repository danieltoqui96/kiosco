import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import '../../../features/products/styles/products.css';
import { ApiClientError } from '../../products/api/http';
import { formatCurrency } from '../../products/presentation.utils';
import type { CashRouteState } from '../../../components/layout/MainLayout';
import { cashApi } from '../api/cash.api';
import type { CashDayDetail, CashDaySummary } from '../types';

const DEFAULT_PAGE_SIZE = 10;

interface CashPageProps {
  routeState: CashRouteState;
  onRouteStateChange: (next: Partial<CashRouteState>) => void;
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

function formatDay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date);
}

function formatDayParts(value: string): { date: string } {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return {
      date: value,
    };
  }

  return {
    date: new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date),
  };
}

function formatDateTimeParts(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      date: value,
      time: '',
    };
  }

  return {
    date: new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date),
  };
}

function DateOnlyCell({
  value,
  compact = false,
}: {
  value: string;
  compact?: boolean;
}) {
  const dateParts = formatDayParts(value);

  return (
    <span className={`date-cell${compact ? ' date-cell--compact' : ''}`}>
      <span className="date-cell__day">{dateParts.date}</span>
    </span>
  );
}

function DateTimeCell({
  value,
  compact = false,
}: {
  value: string;
  compact?: boolean;
}) {
  const dateParts = formatDateTimeParts(value);

  return (
    <span className={`date-cell${compact ? ' date-cell--compact' : ''}`}>
      <span className="date-cell__day">{dateParts.date}</span>
      {dateParts.time ? <span className="date-cell__time">{dateParts.time}</span> : null}
    </span>
  );
}

function TimeCell({ value }: { value: string }) {
  const dateParts = formatDateTimeParts(value);

  return (
    <span className="date-cell date-cell--time-only">
      <span className="date-cell__time">{dateParts.time || dateParts.date}</span>
    </span>
  );
}

function parseAmountInput(value: string): number {
  const normalizedValue = value.replace(/\./g, '').trim();
  if (normalizedValue.length === 0) return 0;
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatAmountInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(Number(digits));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const detailsMessage =
      typeof error.details === 'object' &&
      error.details !== null &&
      'message' in error.details &&
      typeof (error.details as { message?: unknown }).message === 'string'
        ? String((error.details as { message: string }).message)
        : null;
    return detailsMessage ?? error.message;
  }

  if (error instanceof Error) return error.message;
  return 'Operacion no disponible.';
}

export const CashPage = ({ routeState, onRouteStateChange }: CashPageProps) => {
  const [days, setDays] = useState<CashDaySummary[]>([]);
  const [globalTotals, setGlobalTotals] = useState({ cash: 0, card: 0 });
  const [page, setPage] = useState(routeState.page);
  const [fromDate, setFromDate] = useState(routeState.from);
  const [toDate, setToDate] = useState(routeState.to);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CashDayDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(true);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isSavingDeposit, setIsSavingDeposit] = useState(false);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPaymentMethod, setWithdrawPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isSavingWithdrawal, setIsSavingWithdrawal] = useState(false);

  useEffect(() => {
    setPage((current) => (current === routeState.page ? current : routeState.page));
    setFromDate((current) => (current === routeState.from ? current : routeState.from));
    setToDate((current) => (current === routeState.to ? current : routeState.to));
  }, [routeState.from, routeState.page, routeState.to]);

  const syncRoute = useCallback(
    (next: Partial<CashRouteState>) => {
      onRouteStateChange({
        page: next.page ?? page,
        from: next.from ?? fromDate,
        to: next.to ?? toDate,
      });
    },
    [fromDate, onRouteStateChange, page, toDate],
  );

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await cashApi.getSummary({
        page,
        limit: DEFAULT_PAGE_SIZE,
        from: fromDate || undefined,
        to: toDate || undefined,
      });

      if (response.totalPages === 0 && page !== 1) {
        setPage(1);
        syncRoute({ page: 1 });
        return;
      }

      if (response.totalPages > 0 && page > response.totalPages) {
        setPage(response.totalPages);
        syncRoute({ page: response.totalPages });
        return;
      }

      setDays(response.items);
      setGlobalTotals(response.totals);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);

      if (response.items.length === 0) {
        setSelectedDay(null);
        setSelectedDetail(null);
      } else {
        const currentSelection = selectedDay;
        const stillExists =
          currentSelection !== null &&
          response.items.some((item) => item.day === currentSelection);
        if (!stillExists) {
          setSelectedDay(response.items[0]?.day ?? null);
          setIsDetailOpen(true);
        }
      }
    } catch (error) {
      setDays([]);
      setGlobalTotals({ cash: 0, card: 0 });
      setTotalItems(0);
      setTotalPages(0);
      setSelectedDay(null);
      setSelectedDetail(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, page, selectedDay, syncRoute, toDate]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const fetchDetail = useCallback(async (day: string) => {
    setIsLoadingDetail(true);
    setErrorMessage(null);
    try {
      const detail = await cashApi.getDayDetail(day);
      setSelectedDetail(detail);
    } catch (error) {
      setSelectedDetail(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedDay) {
      setSelectedDetail(null);
      return;
    }
    void fetchDetail(selectedDay);
  }, [fetchDetail, selectedDay]);

  useEffect(() => {
    const handleInventoryChange = () => {
      void fetchSummary();
      if (selectedDay) {
        void fetchDetail(selectedDay);
      }
    };

    window.addEventListener('inventory:changed', handleInventoryChange);
    return () => {
      window.removeEventListener('inventory:changed', handleInventoryChange);
    };
  }, [fetchDetail, fetchSummary, selectedDay]);

  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
    setIsDetailOpen(true);
  };

  const visiblePages = useMemo(() => buildVisiblePages(page, totalPages), [page, totalPages]);
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * DEFAULT_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * DEFAULT_PAGE_SIZE, totalItems);

  const handleSaveDeposit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDay || isSavingDeposit) return;

    const parsedAmount = parseAmountInput(depositAmount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('El ingreso debe ser un monto entero mayor a 0.');
      return;
    }

    setIsSavingDeposit(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const detail = await cashApi.createDeposit(selectedDay, {
        paymentMethod: depositPaymentMethod,
        amount: parsedAmount,
        reason: 'deposit',
      });
      setSelectedDetail(detail);
      setIsDepositModalOpen(false);
      setDepositAmount('');
      setDepositPaymentMethod('cash');
      setSuccessMessage(`Ingreso registrado para ${formatDay(selectedDay)}.`);
      window.dispatchEvent(new Event('cash:changed'));
      await fetchSummary();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingDeposit(false);
    }
  };

  const handleSaveWithdrawal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDay || isSavingWithdrawal) return;

    const parsedAmount = parseAmountInput(withdrawAmount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('El retiro debe ser un monto entero mayor a 0.');
      return;
    }

    setIsSavingWithdrawal(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const detail = await cashApi.createWithdrawal(selectedDay, {
        paymentMethod: withdrawPaymentMethod,
        amount: parsedAmount,
        reason: 'purchase',
      });
      setSelectedDetail(detail);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setWithdrawPaymentMethod('cash');
      setSuccessMessage(`Retiro registrado para ${formatDay(selectedDay)}.`);
      window.dispatchEvent(new Event('cash:changed'));
      await fetchSummary();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingWithdrawal(false);
    }
  };

  return (
    <>
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Caja diaria</h1>
            <span className="breadcrumb">Inicio / Caja</span>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (!selectedDay) {
                  setErrorMessage('Selecciona un dia para registrar ingreso.');
                  return;
                }
                setIsDepositModalOpen(true);
              }}
            >
              Agregar dinero
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!selectedDay) {
                  setErrorMessage('Selecciona un dia para registrar retiro.');
                  return;
                }
                setIsWithdrawModalOpen(true);
              }}
            >
              Retirar dinero
            </button>
          </div>
        </header>

        <section className="filters-bar">
          <div className="filters-group">
            <div className="filter-item filter-item--date">
              <label className="filter-label" htmlFor="cash-from-date">
                Desde
              </label>
              <input
                id="cash-from-date"
                type="date"
                className="form-input"
                value={fromDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setFromDate(value);
                  setPage(1);
                  syncRoute({ from: value, page: 1 });
                }}
              />
            </div>
            <div className="filter-item filter-item--date">
              <label className="filter-label" htmlFor="cash-to-date">
                Hasta
              </label>
              <input
                id="cash-to-date"
                type="date"
                className="form-input"
                value={toDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setToDate(value);
                  setPage(1);
                  syncRoute({ to: value, page: 1 });
                }}
              />
            </div>
          </div>

          <div className="filters-actions cash-filters-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setPage(1);
                syncRoute({ from: '', to: '', page: 1 });
              }}
            >
              Limpiar
            </button>

            <div className="cash-summary-inline">
              <div className="cash-summary-pill">
                <span>Efectivo</span>
                <strong>{formatCurrency(globalTotals.cash)}</strong>
              </div>
              <div className="cash-summary-pill">
                <span>Tarjeta</span>
                <strong>{formatCurrency(globalTotals.card)}</strong>
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        {successMessage ? <p className="form-success">{successMessage}</p> : null}

        <section className="data-table-container cash-table app-compact-table">
          <table className="data-table">
            <colgroup>
              <col className="cash-table__day" />
              <col className="cash-table__sales" />
              <col className="cash-table__items" />
              <col className="cash-table__cash" />
              <col className="cash-table__card" />
              <col className="cash-table__total" />
            </colgroup>
            <thead className="table-header">
              <tr>
                <th className="table-cell table-cell--header">Dia</th>
                <th className="table-cell table-cell--header table-cell--right">Ventas</th>
                <th className="table-cell table-cell--header table-cell--right">Items</th>
                <th className="table-cell table-cell--header table-cell--right">Efectivo</th>
                <th className="table-cell table-cell--header table-cell--right">Tarjeta</th>
                <th className="table-cell table-cell--header table-cell--right">Caja final</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={6}>
                    Cargando resumen de caja...
                  </td>
                </tr>
              ) : days.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={6}>
                    No hay dias para mostrar en ese rango.
                  </td>
                </tr>
              ) : (
                days.map((day) => {
                  const isSelected = day.day === selectedDay;
                  return (
                    <tr
                      key={day.day}
                      className={`table-row table-row--clickable${isSelected ? ' table-row--selected' : ''}`}
                      tabIndex={0}
                      onClick={() => handleSelectDay(day.day)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSelectDay(day.day);
                        }
                      }}
                    >
                      <td className="table-cell">
                        <DateOnlyCell value={day.day} />
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {day.salesCount}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {day.itemsCount}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(day.currentCash)}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(day.currentCard)}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(day.currentCash + day.currentCard)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="table-pagination">
            <div className="pagination-info">
              Mostrando {rangeStart}-{rangeEnd} de {totalItems} dias
            </div>
            <div className="pagination-controls">
              <button
                type="button"
                className={`pagination-btn${page <= 1 ? ' pagination-btn--disabled' : ''}`}
                onClick={() => {
                  if (page <= 1) return;
                  const nextPage = page - 1;
                  setPage(nextPage);
                  syncRoute({ page: nextPage });
                }}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <span className="pagination-pages">
                {visiblePages.map((visiblePage, index) => {
                  const previous = visiblePages[index - 1];
                  const showEllipsis = previous !== undefined && visiblePage - previous > 1;
                  return (
                    <span key={visiblePage}>
                      {showEllipsis ? <span className="pagination-ellipsis">...</span> : null}
                      <button
                        type="button"
                        className={`pagination-page${visiblePage === page ? ' pagination-page--active' : ''}`}
                        onClick={() => {
                          setPage(visiblePage);
                          syncRoute({ page: visiblePage });
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
                  if (page >= totalPages) return;
                  const nextPage = page + 1;
                  setPage(nextPage);
                  syncRoute({ page: nextPage });
                }}
                disabled={page >= totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </main>

      <aside className={`detail-panel${isDetailOpen ? ' detail-panel--open' : ''}`}>
        <div className="panel-header">
          <h2 className="panel-title">Detalle de caja</h2>
          <button type="button" className="panel-close" title="Cerrar" onClick={() => setIsDetailOpen(false)}>
            x
          </button>
        </div>

        <div className="panel-content">
          {isLoadingDetail ? (
            <div className="detail-section">
              <p className="detail-description">Cargando detalle...</p>
            </div>
          ) : !selectedDetail ? (
            <div className="detail-section">
              <h4 className="section-title">Sin dia seleccionado</h4>
              <p className="detail-description">Selecciona un dia para ver sus ventas.</p>
            </div>
          ) : (
            <>
              <div className="detail-summary-card">
                <div className="detail-summary-head">
                  <span className="status-badge status-badge--active">Caja del dia</span>
                  <h3 className="detail-summary-title">
                    <DateOnlyCell value={selectedDetail.summary.day} compact />
                  </h3>
                  <div className="detail-summary-pills">
                    <span className="detail-summary-pill">Ventas {selectedDetail.summary.salesCount}</span>
                    <span className="detail-summary-pill">Items {selectedDetail.summary.itemsCount}</span>
                  </div>
                </div>

                <div className="detail-summary-grid">
                  <div className="detail-summary-item">
                    <span className="detail-summary-label">Efectivo</span>
                    <span className="detail-summary-value">
                      {formatCurrency(selectedDetail.summary.currentCash)}
                    </span>
                  </div>
                  <div className="detail-summary-item">
                    <span className="detail-summary-label">Tarjeta</span>
                    <span className="detail-summary-value">
                      {formatCurrency(selectedDetail.summary.currentCard)}
                    </span>
                  </div>
                  <div className="detail-summary-item">
                    <span className="detail-summary-label">Retiros</span>
                    <span className="detail-summary-value">
                      {formatCurrency(
                        selectedDetail.summary.withdrawalsCash + selectedDetail.summary.withdrawalsCard,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Ventas del dia</h4>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell table-cell--header">Venta</th>
                        <th className="table-cell table-cell--header">Hora</th>
                        <th className="table-cell table-cell--header table-cell--right">Items</th>
                        <th className="table-cell table-cell--header table-cell--center">Pago</th>
                        <th className="table-cell table-cell--header table-cell--right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {selectedDetail.sales.length === 0 ? (
                        <tr className="table-row">
                          <td className="table-cell" colSpan={5}>
                            No hay ventas registradas para este dia.
                          </td>
                        </tr>
                      ) : (
                        selectedDetail.sales.map((sale) => (
                          <tr key={sale.saleId} className="table-row">
                            <td className="table-cell">#{sale.saleId}</td>
                            <td className="table-cell">
                              <TimeCell value={sale.soldAt} />
                            </td>
                            <td className="table-cell table-cell--right table-cell--number">
                              {sale.totalItems}
                            </td>
                            <td className="table-cell table-cell--center">
                              <span
                                className="cash-icon-badge cash-icon-badge--type"
                                title={sale.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
                              >
                                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                  {sale.paymentMethod === 'card' ? (
                                    <path
                                      fill="currentColor"
                                      d="M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1zm0 3v2h18V9H3zm3 5h4v2H6v-2z"
                                    />
                                  ) : (
                                    <path
                                      fill="currentColor"
                                      d="M2 7h20v10H2V7zm2 2v6h16V9H4zm3 1h2v4H7v-4zm4 0h9v1h-9v-1zm0 2h9v1h-9v-1z"
                                    />
                                  )}
                                </svg>
                              </span>
                            </td>
                            <td className="table-cell table-cell--right table-cell--number">
                              {formatCurrency(sale.totalAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Historial de movimientos</h4>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell table-cell--header">Hora</th>
                        <th className="table-cell table-cell--header table-cell--center">Mov.</th>
                        <th className="table-cell table-cell--header table-cell--center">Tipo</th>
                        <th className="table-cell table-cell--header table-cell--right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {selectedDetail.withdrawals.length === 0 ? (
                        <tr className="table-row">
                          <td className="table-cell" colSpan={4}>
                            No hay movimientos registrados para este dia.
                          </td>
                        </tr>
                      ) : (
                        selectedDetail.withdrawals.map((withdrawal) => (
                          <tr key={withdrawal.id} className="table-row">
                            <td className="table-cell">
                              <DateTimeCell value={withdrawal.createdAt} compact />
                            </td>
                            <td className="table-cell table-cell--center">
                              <span
                                className={`cash-icon-badge ${
                                  withdrawal.movementType === 'in'
                                    ? 'cash-icon-badge--in'
                                    : 'cash-icon-badge--out'
                                }`}
                                title={withdrawal.movementType === 'in' ? 'Ingreso' : 'Retiro'}
                              >
                                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                  {withdrawal.movementType === 'in' ? (
                                    <path
                                      fill="currentColor"
                                      d="M12 4l6 6h-4v8h-4v-8H6l6-6z"
                                    />
                                  ) : (
                                    <path
                                      fill="currentColor"
                                      d="M12 20l-6-6h4V6h4v8h4l-6 6z"
                                    />
                                  )}
                                </svg>
                              </span>
                            </td>
                            <td className="table-cell table-cell--center">
                              <span
                                className="cash-icon-badge cash-icon-badge--type"
                                title={withdrawal.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
                              >
                                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                  {withdrawal.paymentMethod === 'card' ? (
                                    <path
                                      fill="currentColor"
                                      d="M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1zm0 3v2h18V9H3zm3 5h4v2H6v-2z"
                                    />
                                  ) : (
                                    <path
                                      fill="currentColor"
                                      d="M2 7h20v10H2V7zm2 2v6h16V9H4zm3 1h2v4H7v-4zm4 0h9v1h-9v-1zm0 2h9v1h-9v-1z"
                                    />
                                  )}
                                </svg>
                              </span>
                            </td>
                            <td className="table-cell table-cell--right table-cell--number">
                              {formatCurrency(withdrawal.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {isDepositModalOpen ? (
        <div className="modal-overlay modal-overlay--visible" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Registrar ingreso</h3>
              <button type="button" className="modal-close" onClick={() => setIsDepositModalOpen(false)}>
                x
              </button>
            </div>
            <form onSubmit={handleSaveDeposit}>
              <div className="modal-content">
                <div className="form-grid form-grid--2col">
                  <div className="form-field">
                    <label className="form-label" htmlFor="deposit-method">
                      Tipo de saldo
                    </label>
                    <select
                      id="deposit-method"
                      className="form-select"
                      value={depositPaymentMethod}
                      onChange={(event) =>
                        setDepositPaymentMethod(event.target.value as 'cash' | 'card')
                      }
                    >
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="deposit-amount">
                      Monto
                    </label>
                    <input
                      id="deposit-amount"
                      className="form-input"
                      inputMode="numeric"
                      value={depositAmount}
                      onChange={(event) => setDepositAmount(formatAmountInput(event.target.value))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsDepositModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSavingDeposit}>
                  {isSavingDeposit ? 'Guardando...' : 'Agregar dinero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isWithdrawModalOpen ? (
        <div className="modal-overlay modal-overlay--visible" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Registrar retiro</h3>
              <button type="button" className="modal-close" onClick={() => setIsWithdrawModalOpen(false)}>
                x
              </button>
            </div>
            <form onSubmit={handleSaveWithdrawal}>
              <div className="modal-content">
                <div className="form-grid form-grid--2col">
                  <div className="form-field">
                    <label className="form-label" htmlFor="withdraw-method">
                      Tipo de saldo
                    </label>
                    <select
                      id="withdraw-method"
                      className="form-select"
                      value={withdrawPaymentMethod}
                      onChange={(event) =>
                        setWithdrawPaymentMethod(event.target.value as 'cash' | 'card')
                      }
                    >
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="withdraw-amount">
                      Monto
                    </label>
                    <input
                      id="withdraw-amount"
                      className="form-input"
                      inputMode="numeric"
                      value={withdrawAmount}
                      onChange={(event) => setWithdrawAmount(formatAmountInput(event.target.value))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsWithdrawModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSavingWithdrawal}>
                  {isSavingWithdrawal ? 'Guardando...' : 'Registrar retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </>
  );
};
