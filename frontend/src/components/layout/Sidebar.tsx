import { useEffect, useState } from 'react';
import { formatCurrency } from '../../features/products/presentation.utils';
import { salesApi } from '../../features/sales/api/sales.api';
import type { CashboxBalances } from '../../features/sales/types';
import type { AppSection } from './MainLayout';

interface SidebarProps {
  currentSection: AppSection;
  onNavigate: (section: AppSection) => void;
}

export const Sidebar = ({ currentSection, onNavigate }: SidebarProps) => {
  const [cashbox, setCashbox] = useState<CashboxBalances | null>(null);
  const [isLoadingCashbox, setIsLoadingCashbox] = useState(false);
  const [cashboxError, setCashboxError] = useState<string | null>(null);
  const [isCashboxModalOpen, setIsCashboxModalOpen] = useState(false);
  const [cashInput, setCashInput] = useState('0');
  const [cardInput, setCardInput] = useState('0');
  const [isSavingCashbox, setIsSavingCashbox] = useState(false);

  const fetchCashbox = async () => {
    setIsLoadingCashbox(true);
    setCashboxError(null);
    try {
      const data = await salesApi.getCashbox();
      setCashbox(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar caja.';
      setCashboxError(message);
    } finally {
      setIsLoadingCashbox(false);
    }
  };

  useEffect(() => {
    void fetchCashbox();

    const handleCashboxChange = () => {
      void fetchCashbox();
    };

    window.addEventListener('inventory:changed', handleCashboxChange);
    window.addEventListener('cashbox:changed', handleCashboxChange);

    return () => {
      window.removeEventListener('inventory:changed', handleCashboxChange);
      window.removeEventListener('cashbox:changed', handleCashboxChange);
    };
  }, []);

  const openCashboxModal = () => {
    setCashInput(String(cashbox?.cash ?? 0));
    setCardInput(String(cashbox?.card ?? 0));
    setIsCashboxModalOpen(true);
  };

  const closeCashboxModal = () => {
    setIsCashboxModalOpen(false);
    setCashInput('0');
    setCardInput('0');
  };

  const handleSaveCashbox = async () => {
    const nextCash = Number(cashInput);
    const nextCard = Number(cardInput);

    if (!Number.isFinite(nextCash) || !Number.isFinite(nextCard)) {
      setCashboxError('Los saldos deben ser numeros validos.');
      return;
    }

    if (nextCash < 0 || nextCard < 0) {
      setCashboxError('Los saldos no pueden ser negativos.');
      return;
    }

    setIsSavingCashbox(true);
    setCashboxError(null);

    try {
      const updated = await salesApi.updateCashbox({
        cash: Math.floor(nextCash),
        card: Math.floor(nextCard),
      });
      setCashbox(updated);
      closeCashboxModal();
      window.dispatchEvent(new Event('cashbox:changed'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo actualizar caja.';
      setCashboxError(message);
    } finally {
      setIsSavingCashbox(false);
    }
  };

  const handleResetCashbox = async () => {
    const shouldReset = window.confirm('Deseas reiniciar caja a 0 en efectivo y tarjeta?');
    if (!shouldReset) return;

    setIsSavingCashbox(true);
    setCashboxError(null);

    try {
      const updated = await salesApi.resetCashbox();
      setCashbox(updated);
      closeCashboxModal();
      window.dispatchEvent(new Event('cashbox:changed'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo reiniciar caja.';
      setCashboxError(message);
    } finally {
      setIsSavingCashbox(false);
    }
  };

  return (
    <div>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">INV</span>
          <span className="sidebar-title">Inventario</span>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item${currentSection === 'products' ? ' active' : ''}`}
            onClick={() => onNavigate('products')}
          >
            <span className="nav-icon">P</span>
            <span className="nav-label">Productos</span>
          </button>
          <button
            type="button"
            className={`nav-item${currentSection === 'categories' ? ' active' : ''}`}
            onClick={() => onNavigate('categories')}
          >
            <span className="nav-icon">C</span>
            <span className="nav-label">Categorias</span>
          </button>
          <button
            type="button"
            className={`nav-item${currentSection === 'brands' ? ' active' : ''}`}
            onClick={() => onNavigate('brands')}
          >
            <span className="nav-icon">M</span>
            <span className="nav-label">Marcas</span>
          </button>
          <button
            type="button"
            className={`nav-item${currentSection === 'sales' ? ' active' : ''}`}
            onClick={() => onNavigate('sales')}
          >
            <span className="nav-icon">V</span>
            <span className="nav-label">Ventas</span>
          </button>
          <button
            type="button"
            className={`nav-item${currentSection === 'finance' ? ' active' : ''}`}
            onClick={() => onNavigate('finance')}
          >
            <span className="nav-icon">F</span>
            <span className="nav-label">Finanzas</span>
          </button>
        </nav>

        <section className="sidebar-cashbox">
          <div className="sidebar-cashbox-header">
            <span className="sidebar-cashbox-title">Caja actual</span>
            <button
              type="button"
              className="sidebar-cashbox-settings"
              onClick={openCashboxModal}
              title="Configurar caja"
            >
              ⚙
            </button>
          </div>

          {isLoadingCashbox ? (
            <p className="sidebar-cashbox-hint">Cargando...</p>
          ) : cashboxError ? (
            <p className="sidebar-cashbox-hint sidebar-cashbox-hint--error">{cashboxError}</p>
          ) : (
            <>
              <div className="sidebar-cashbox-row">
                <span>Efectivo</span>
                <strong>{formatCurrency(cashbox?.cash ?? 0)}</strong>
              </div>
              <div className="sidebar-cashbox-row">
                <span>Tarjeta</span>
                <strong>{formatCurrency(cashbox?.card ?? 0)}</strong>
              </div>
              <div className="sidebar-cashbox-row sidebar-cashbox-row--total">
                <span>Total</span>
                <strong>{formatCurrency(cashbox?.total ?? 0)}</strong>
              </div>
            </>
          )}
        </section>
      </aside>

      {isCashboxModalOpen ? (
        <div className="modal-overlay modal-overlay--visible" role="dialog" aria-modal="true">
          <div className="modal modal--small">
            <div className="modal-header">
              <h3 className="modal-title">Configurar caja</h3>
              <button type="button" className="modal-close" onClick={closeCashboxModal}>
                x
              </button>
            </div>

            <div className="modal-content">
              <div className="form-field">
                <label className="form-label" htmlFor="cashbox-cash">
                  Efectivo
                </label>
                <input
                  id="cashbox-cash"
                  className="form-input"
                  type="number"
                  min={0}
                  step={1}
                  value={cashInput}
                  onChange={(event) => setCashInput(event.target.value)}
                />
              </div>

              <div className="form-field" style={{ marginTop: '8px' }}>
                <label className="form-label" htmlFor="cashbox-card">
                  Tarjeta
                </label>
                <input
                  id="cashbox-card"
                  className="form-input"
                  type="number"
                  min={0}
                  step={1}
                  value={cardInput}
                  onChange={(event) => setCardInput(event.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={() => {
                  void handleResetCashbox();
                }}
                disabled={isSavingCashbox}
              >
                Reiniciar
              </button>
              <button type="button" className="btn btn-ghost" onClick={closeCashboxModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  void handleSaveCashbox();
                }}
                disabled={isSavingCashbox}
              >
                {isSavingCashbox ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
