import { useCallback, useEffect, useMemo, useState } from 'react';
import { cashApi } from '../../features/cash/api/cash.api';
import { formatCurrency } from '../../features/products/presentation.utils';
import type { AppSection } from './MainLayout';

interface SidebarProps {
  activeSection: AppSection;
  onGoToProducts: () => void;
  onGoToSales: () => void;
  onGoToCash: () => void;
}

export const Sidebar = ({
  activeSection,
  onGoToProducts,
  onGoToSales,
  onGoToCash,
}: SidebarProps) => {
  const [cashTotals, setCashTotals] = useState({ cash: 0, transfer: 0 });
  const [isLoadingCashTotals, setIsLoadingCashTotals] = useState(false);

  const totalBalance = useMemo(
    () => cashTotals.cash + cashTotals.transfer,
    [cashTotals.cash, cashTotals.transfer],
  );

  const fetchCashTotals = useCallback(async () => {
    setIsLoadingCashTotals(true);
    try {
      const response = await cashApi.getSummary({ page: 1, limit: 1 });
      setCashTotals({
        cash: response.totals.cash,
        transfer: response.totals.card,
      });
    } catch {
      setCashTotals({ cash: 0, transfer: 0 });
    } finally {
      setIsLoadingCashTotals(false);
    }
  }, []);

  useEffect(() => {
    void fetchCashTotals();

    const handleBalanceChange = () => {
      void fetchCashTotals();
    };

    window.addEventListener('inventory:changed', handleBalanceChange);
    window.addEventListener('cash:changed', handleBalanceChange);
    return () => {
      window.removeEventListener('inventory:changed', handleBalanceChange);
      window.removeEventListener('cash:changed', handleBalanceChange);
    };
  }, [fetchCashTotals]);

  return (
    <div>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M4 3h16a1 1 0 0 1 1 1v5a3 3 0 0 1-2 2.83V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.17A3 3 0 0 1 3 9V4a1 1 0 0 1 1-1Zm3 10v6h10v-6H7Zm3 2h4v2h-4v-2ZM5 5v4a1 1 0 0 0 2 0V5H5Zm4 0v4a1 1 0 0 0 2 0V5H9Zm4 0v4a1 1 0 0 0 2 0V5h-2Zm4 0v4a1 1 0 0 0 2 0V5h-2Z"
              />
            </svg>
          </span>
          <span className="sidebar-title">Inventario</span>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item${activeSection === 'products' ? ' active' : ''}`}
            onClick={onGoToProducts}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M5 4h14a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2Zm-2 7h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm4 3v2h7v-2H7Z"
                />
              </svg>
            </span>
            <span className="nav-label">Productos</span>
          </button>
          <button
            type="button"
            className={`nav-item${activeSection === 'sales' ? ' active' : ''}`}
            onClick={onGoToSales}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M7 4h13v2H8.2l.6 3H19a2 2 0 0 1 1.9 2.6l-1.2 4A2 2 0 0 1 17.8 17H9a2 2 0 0 1-2-1.6L4.4 3H2V1h4l1 3Zm2.2 11h8.6l1.2-4H8.4l.8 4ZM9 22a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm9 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
                />
              </svg>
            </span>
            <span className="nav-label">Ventas</span>
          </button>
          <button
            type="button"
            className={`nav-item${activeSection === 'cash' ? ' active' : ''}`}
            onClick={onGoToCash}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M3 6h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 4v8h18v-8H3Zm3 2h6v2H6v-2Zm12-8v2H6V4h12Z"
                />
              </svg>
            </span>
            <span className="nav-label">Caja</span>
          </button>
        </nav>

        <section className="sidebar-cash-summary" aria-label="Resumen de caja">
          <div className="sidebar-cash-summary__header">
            <span className="sidebar-cash-summary__eyebrow">Caja actual</span>
            {isLoadingCashTotals ? (
              <span className="sidebar-cash-summary__status">Actualizando</span>
            ) : null}
          </div>

          <div className="sidebar-cash-summary__total">
            {formatCurrency(totalBalance)}
          </div>

          <div className="sidebar-cash-summary__grid">
            <div className="sidebar-cash-summary__item">
              <span>Efectivo</span>
              <strong>{formatCurrency(cashTotals.cash)}</strong>
            </div>
            <div className="sidebar-cash-summary__item">
              <span>Transferencia</span>
              <strong>{formatCurrency(cashTotals.transfer)}</strong>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
};
