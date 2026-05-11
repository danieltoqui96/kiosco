import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import '../../../features/products/styles/products.css';
import { ApiClientError } from '../../products/api/http';
import { productsApi } from '../../products/api/products.api';
import { formatCurrency } from '../../products/presentation.utils';
import type { SalesRouteState } from '../../../components/layout/MainLayout';
import { salesApi } from '../api/sales.api';
import type {
  SaleDetail,
  SaleProduct,
  SaleSummary,
} from '../types';

const DEFAULT_PAGE_SIZE = 10;
const MODAL_PRODUCTS_LIMIT = 100;
const MODAL_SEARCH_MIN_CHARS = 2;
const MODAL_SEARCH_DEBOUNCE_MS = 250;
const BARCODE_SCAN_MAX_INTERVAL_MS = 100;
const BARCODE_SCAN_MIN_LENGTH = 4;

interface SalesPageProps {
  routeState: SalesRouteState;
  onRouteStateChange: (next: Partial<SalesRouteState>) => void;
}

interface CartItem {
  product: SaleProduct;
  quantity: number;
}

type SalesModalMode = 'create' | 'edit';

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

function formatSaleDateParts(value: string): { date: string; time: string } {
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

function DateTimeCell({
  value,
  compact = false,
}: {
  value: string;
  compact?: boolean;
}) {
  const dateParts = formatSaleDateParts(value);

  return (
    <span className={`date-cell${compact ? ' date-cell--compact' : ''}`}>
      <span className="date-cell__day">{dateParts.date}</span>
      {dateParts.time ? <span className="date-cell__time">{dateParts.time}</span> : null}
    </span>
  );
}

export const SalesPage = ({ routeState, onRouteStateChange }: SalesPageProps) => {
  const modalScanBufferRef = useRef('');
  const lastModalScanKeyTimeRef = useRef(0);
  const quantityRepeatTimeoutRef = useRef<number | null>(null);
  const quantityRepeatIntervalRef = useRef<number | null>(null);
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [page, setPage] = useState(routeState.page);
  const [search, setSearch] = useState(routeState.q);
  const [paymentFilter, setPaymentFilter] = useState<'' | 'cash' | 'card'>(
    routeState.paymentMethod,
  );
  const [soldDateFilter, setSoldDateFilter] = useState(routeState.soldDate);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<SalesModalMode>('create');
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [modalSearch, setModalSearch] = useState('');
  const [modalProducts, setModalProducts] = useState<SaleProduct[]>([]);
  const [isLoadingModalProducts, setIsLoadingModalProducts] = useState(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setPage((current) => (current === routeState.page ? current : routeState.page));
    setSearch((current) => (current === routeState.q ? current : routeState.q));
    setPaymentFilter((current) =>
      current === routeState.paymentMethod ? current : routeState.paymentMethod,
    );
    setSoldDateFilter((current) =>
      current === routeState.soldDate ? current : routeState.soldDate,
    );
  }, [routeState.page, routeState.paymentMethod, routeState.q, routeState.soldDate]);

  const syncRoute = useCallback(
    (next: Partial<SalesRouteState>) => {
      onRouteStateChange({
        page: next.page ?? page,
        q: next.q ?? search,
        paymentMethod: next.paymentMethod ?? paymentFilter,
        soldDate: next.soldDate ?? soldDateFilter,
      });
    },
    [onRouteStateChange, page, paymentFilter, search, soldDateFilter],
  );

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await salesApi.getAll({
        page,
        limit: DEFAULT_PAGE_SIZE,
        q: search || undefined,
        paymentMethod: paymentFilter || undefined,
        soldDate: soldDateFilter || undefined,
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

      setSales(response.items);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      setSales([]);
      setTotalItems(0);
      setTotalPages(0);
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar ventas.');
    } finally {
      setIsLoading(false);
    }
  }, [page, paymentFilter, search, soldDateFilter, syncRoute]);

  useEffect(() => {
    void fetchSales();
  }, [fetchSales]);

  const fetchSaleDetail = useCallback(async (saleId: number) => {
    setIsLoadingDetail(true);
    setErrorMessage(null);

    try {
      const detail = await salesApi.getById(saleId);
      setSelectedSale(detail);
    } catch (error) {
      setSelectedSale(null);
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo cargar el detalle de venta.',
      );
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSaleId) {
      setSelectedSale(null);
      return;
    }
    void fetchSaleDetail(selectedSaleId);
  }, [fetchSaleDetail, selectedSaleId]);

  const fetchModalProducts = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < MODAL_SEARCH_MIN_CHARS) {
      setModalProducts([]);
      setIsLoadingModalProducts(false);
      return;
    }

    setIsLoadingModalProducts(true);

    try {
      const response = await salesApi.getProducts({
        page: 1,
        limit: MODAL_PRODUCTS_LIMIT,
        q: normalizedQuery,
      });
      setModalProducts(response.items);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar productos para vender.',
      );
    } finally {
      setIsLoadingModalProducts(false);
    }
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const normalizedQuery = modalSearch.trim();
    if (normalizedQuery.length < MODAL_SEARCH_MIN_CHARS) {
      setModalProducts([]);
      setIsLoadingModalProducts(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchModalProducts(normalizedQuery);
    }, MODAL_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchModalProducts, isModalOpen, modalSearch]);

  const handleSelectSale = (saleId: number) => {
    setSelectedSaleId(saleId);
    setIsDetailOpen(true);
  };

  const handleOpenCreateModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setModalMode('create');
    setEditingSaleId(null);
    setPaymentMethod('cash');
    setModalSearch('');
    setModalProducts([]);
    setIsAutocompleteOpen(true);
    setCartItems([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmittingSale) return;
    setIsModalOpen(false);
    setCartItems([]);
    setModalSearch('');
    setModalProducts([]);
    setIsAutocompleteOpen(false);
    setModalMode('create');
    setEditingSaleId(null);
    setIsPreparingEdit(false);
  };

  const handleOpenEditModal = async () => {
    if (!selectedSale) {
      setErrorMessage('Selecciona una venta para editar.');
      return;
    }

    setIsPreparingEdit(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const productLookups = await Promise.all(
        selectedSale.items.map(async (item) => {
          const product = await productsApi.getById(item.productId).catch(() => null);
          return {
            item,
            product,
          };
        }),
      );

      const nextCartItems: CartItem[] = productLookups.map(({ item, product }) => ({
        quantity: item.quantity,
        product: {
          id: item.productId,
          codebar: item.productCodebar,
          name: item.productName,
          brand: item.brandName,
          salePrice: item.unitPrice,
          stock: (product?.stock ?? 0) + item.quantity,
        },
      }));

      setModalMode('edit');
      setEditingSaleId(selectedSale.id);
      setPaymentMethod(selectedSale.paymentMethod);
      setModalSearch('');
      setModalProducts([]);
      setIsAutocompleteOpen(false);
      setCartItems(nextCartItems);
      setIsModalOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo preparar la edicion.',
      );
    } finally {
      setIsPreparingEdit(false);
    }
  };

  const reservedByProduct = useMemo(() => {
    const map = new Map<number, number>();
    cartItems.forEach((item) => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cartItems]);

  const getAvailableStock = useCallback(
    (product: SaleProduct): number => {
      const reserved = reservedByProduct.get(product.id) ?? 0;
      const cartItem = cartItems.find((item) => item.product.id === product.id);
      const stockLimit = cartItem?.product.stock ?? product.stock;
      return Math.max(0, stockLimit - reserved);
    },
    [cartItems, reservedByProduct],
  );

  const addProductToCart = useCallback((product: SaleProduct) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      const reserved = existing?.quantity ?? 0;
      const stockLimit = existing?.product.stock ?? product.stock;
      if (reserved >= stockLimit) return current;

      if (!existing) return [...current, { product, quantity: 1 }];

      return current.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  }, []);

  const handleAddProductFromSearch = (product: SaleProduct) => {
    addProductToCart(product);
    setModalSearch('');
    setModalProducts([]);
    setIsAutocompleteOpen(false);
  };

  const handleAddProductByBarcode = useCallback(
    async (codebar: string) => {
      const normalizedCodebar = codebar.trim();
      if (normalizedCodebar.length === 0) return;

      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoadingModalProducts(true);

      try {
        const response = await salesApi.getProducts({
          page: 1,
          limit: MODAL_PRODUCTS_LIMIT,
          q: normalizedCodebar,
        });
        const product = response.items.find(
          (item) => item.codebar === normalizedCodebar,
        );

        if (!product) {
          setErrorMessage(`No existe un producto activo con codigo ${normalizedCodebar}.`);
          return;
        }

        const currentCartItem = cartItems.find((item) => item.product.id === product.id);
        const stockLimit = currentCartItem?.product.stock ?? product.stock;
        if ((currentCartItem?.quantity ?? 0) >= stockLimit) {
          setErrorMessage(`No queda stock disponible para ${product.name}.`);
          return;
        }

        addProductToCart(product);
        setModalSearch('');
        setModalProducts([]);
        setIsAutocompleteOpen(false);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se pudo agregar el producto escaneado.',
        );
      } finally {
        setIsLoadingModalProducts(false);
      }
    },
    [addProductToCart, cartItems],
  );

  useEffect(() => {
    if (!isModalOpen) {
      modalScanBufferRef.current = '';
      lastModalScanKeyTimeRef.current = 0;
      return;
    }

    const resetScanBuffer = () => {
      modalScanBufferRef.current = '';
      lastModalScanKeyTimeRef.current = 0;
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const currentTime = Date.now();
      const elapsedTime = currentTime - lastModalScanKeyTimeRef.current;

      if (
        lastModalScanKeyTimeRef.current > 0 &&
        elapsedTime > BARCODE_SCAN_MAX_INTERVAL_MS
      ) {
        modalScanBufferRef.current = '';
      }

      if (event.key === 'Enter') {
        const scannedCode = modalScanBufferRef.current.trim();
        resetScanBuffer();

        if (scannedCode.length >= BARCODE_SCAN_MIN_LENGTH) {
          event.preventDefault();
          void handleAddProductByBarcode(scannedCode);
        }

        return;
      }

      if (event.key.length !== 1) return;
      if (!/^[\w.-]$/.test(event.key)) return;

      modalScanBufferRef.current += event.key;
      lastModalScanKeyTimeRef.current = currentTime;
    };

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [handleAddProductByBarcode, isModalOpen]);

  const updateCartQuantity = useCallback((productId: number, delta: number) => {
    setCartItems((current) =>
      current.flatMap((item) => {
        if (item.product.id !== productId) return [item];

        const nextQuantity = item.quantity + delta;
        if (nextQuantity < 1) return [item];
        if (nextQuantity > item.product.stock) return [item];
        return [{ ...item, quantity: nextQuantity }];
      }),
    );
  }, []);

  const stopQuantityRepeat = useCallback(() => {
    if (quantityRepeatTimeoutRef.current !== null) {
      window.clearTimeout(quantityRepeatTimeoutRef.current);
      quantityRepeatTimeoutRef.current = null;
    }

    if (quantityRepeatIntervalRef.current !== null) {
      window.clearInterval(quantityRepeatIntervalRef.current);
      quantityRepeatIntervalRef.current = null;
    }
  }, []);

  const startQuantityRepeat = useCallback(
    (productId: number, delta: number) => {
      stopQuantityRepeat();
      updateCartQuantity(productId, delta);

      quantityRepeatTimeoutRef.current = window.setTimeout(() => {
        quantityRepeatIntervalRef.current = window.setInterval(() => {
          updateCartQuantity(productId, delta);
        }, 85);
      }, 350);
    },
    [stopQuantityRepeat, updateCartQuantity],
  );

  useEffect(() => {
    return () => {
      stopQuantityRepeat();
    };
  }, [stopQuantityRepeat]);

  const removeFromCart = (productId: number) => {
    setCartItems((current) => current.filter((item) => item.product.id !== productId));
  };

  const cartTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity * item.product.salePrice, 0),
    [cartItems],
  );

  const cartItemsCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );

  const handleSubmitSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingSale) return;

    if (cartItems.length === 0) {
      setErrorMessage('Debes agregar al menos un producto a la venta.');
      return;
    }

    setIsSubmittingSale(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        soldAt: new Date().toISOString(),
      };

      const sale =
        modalMode === 'edit' && editingSaleId !== null
          ? await salesApi.update(editingSaleId, payload)
          : await salesApi.create(payload);

      setIsModalOpen(false);
      setCartItems([]);
      setModalSearch('');
      setModalProducts([]);
      setIsAutocompleteOpen(false);
      setModalMode('create');
      setEditingSaleId(null);
      setSelectedSaleId(sale.id);
      setIsDetailOpen(true);
      setSuccessMessage(
        modalMode === 'edit'
          ? `Venta #${sale.id} actualizada correctamente.`
          : `Venta #${sale.id} registrada correctamente.`,
      );
      window.dispatchEvent(new Event('inventory:changed'));

      if (page !== 1) {
        setPage(1);
        syncRoute({ page: 1 });
      } else {
        await fetchSales();
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.statusCode === 404) {
          setSelectedSaleId(null);
          setSelectedSale(null);
          setSuccessMessage('La venta ya no existe. La lista se actualizo.');
          await fetchSales();
          return;
        }
        const detailsMessage =
          typeof error.details === 'object' &&
          error.details !== null &&
          'message' in error.details &&
          typeof (error.details as { message?: unknown }).message === 'string'
            ? String((error.details as { message: string }).message)
            : null;

        setErrorMessage(detailsMessage ?? error.message);
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo registrar la venta.',
        );
      }
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) {
      setErrorMessage('Selecciona una venta para eliminar.');
      return;
    }

    const shouldDelete = window.confirm(
      `Deseas eliminar la venta #${selectedSale.id}?`,
    );
    if (!shouldDelete) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await salesApi.remove(selectedSale.id);
      setSelectedSaleId(null);
      setSelectedSale(null);
      setSuccessMessage(`Venta #${selectedSale.id} eliminada.`);
      window.dispatchEvent(new Event('inventory:changed'));
      await fetchSales();
    } catch (error) {
      if (error instanceof ApiClientError) {
        const detailsMessage =
          typeof error.details === 'object' &&
          error.details !== null &&
          'message' in error.details &&
          typeof (error.details as { message?: unknown }).message === 'string'
            ? String((error.details as { message: string }).message)
            : null;
        setErrorMessage(detailsMessage ?? error.message);
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo eliminar la venta.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const visiblePages = useMemo(() => buildVisiblePages(page, totalPages), [page, totalPages]);
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * DEFAULT_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * DEFAULT_PAGE_SIZE, totalItems);

  return (
    <>
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Gestion de ventas</h1>
            <span className="breadcrumb">Inicio / Ventas</span>
          </div>
          <div className="header-actions">
            <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal}>
              <span className="btn-icon">+</span>
              Nueva venta
            </button>
          </div>
        </header>

        <section className="filters-bar">
          <div className="filters-group">
            <div className="filter-item">
              <label className="filter-label" htmlFor="sales-search">
                Buscar venta
              </label>
              <input
                id="sales-search"
                className="form-input"
                inputMode="numeric"
                placeholder="ID de venta"
                value={search}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, '');
                  setSearch(value);
                  setPage(1);
                  syncRoute({ q: value, page: 1 });
                }}
              />
            </div>
            <div className="filter-item">
              <label className="filter-label" htmlFor="sales-payment-filter">
                Tipo de pago
              </label>
              <select
                id="sales-payment-filter"
                className="filter-select"
                value={paymentFilter}
                onChange={(event) => {
                  const nextValue = event.target.value as '' | 'cash' | 'card';
                  setPaymentFilter(nextValue);
                  setPage(1);
                  syncRoute({ paymentMethod: nextValue, page: 1 });
                }}
              >
                <option value="">Todos</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label" htmlFor="sales-date-filter">
                Fecha
              </label>
              <input
                id="sales-date-filter"
                type="date"
                className="form-input"
                value={soldDateFilter}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  setSoldDateFilter(nextDate);
                  setPage(1);
                  syncRoute({ soldDate: nextDate, page: 1 });
                }}
              />
            </div>
          </div>
          <div className="filters-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearch('');
                setPaymentFilter('');
                setSoldDateFilter('');
                setPage(1);
                syncRoute({ q: '', paymentMethod: '', soldDate: '', page: 1 });
              }}
            >
              Limpiar
            </button>
            <span className="results-count">
              Mostrando {sales.length} de {totalItems} ventas
            </span>
          </div>
        </section>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        {successMessage ? <p className="form-success">{successMessage}</p> : null}

        <section className="data-table-container sales-table app-compact-table">
          <table className="data-table">
            <colgroup>
              <col className="sales-table__id" />
              <col className="sales-table__date" />
              <col className="sales-table__payment" />
              <col className="sales-table__items" />
              <col className="sales-table__total" />
            </colgroup>
            <thead className="table-header">
              <tr>
                <th className="table-cell table-cell--header">ID</th>
                <th className="table-cell table-cell--header">Fecha</th>
                <th className="table-cell table-cell--header">Tipo pago</th>
                <th className="table-cell table-cell--header table-cell--right">Items</th>
                <th className="table-cell table-cell--header table-cell--right">Total</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={5}>
                    Cargando ventas...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={5}>
                    No hay ventas para mostrar.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const isSelected = sale.id === selectedSaleId;
                  return (
                    <tr
                      key={sale.id}
                      className={`table-row table-row--clickable${isSelected ? ' table-row--selected' : ''}`}
                      tabIndex={0}
                      onClick={() => handleSelectSale(sale.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSelectSale(sale.id);
                        }
                      }}
                    >
                      <td className="table-cell">#{sale.id}</td>
                      <td className="table-cell">
                        <DateTimeCell value={sale.createdAt} />
                      </td>
                      <td className="table-cell">
                        <span className={`payment-badge payment-badge--${sale.paymentMethod}`}>
                          {sale.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
                        </span>
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {sale.totalItems}
                      </td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {formatCurrency(sale.totalAmount)}
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
                      {showEllipsis ? (
                        <span className="pagination-ellipsis">...</span>
                      ) : null}
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
          <h2 className="panel-title">Detalle de la venta</h2>
          <button type="button" className="panel-close" title="Cerrar" onClick={() => setIsDetailOpen(false)}>
            x
          </button>
        </div>

        <div className="panel-content">
          {isLoadingDetail ? (
            <div className="detail-section">
              <p className="detail-description">Cargando detalle de venta...</p>
            </div>
          ) : !selectedSale ? (
            <div className="detail-section">
              <h4 className="section-title">Sin venta seleccionada</h4>
              <p className="detail-description">
                Selecciona una fila para ver los productos vendidos.
              </p>
            </div>
          ) : (
            <>
              <div className="detail-summary-card">
                <div className="detail-summary-head">
                  <span className="status-badge status-badge--active">Venta registrada</span>
                  <h3 className="detail-summary-title">Venta #{selectedSale.id}</h3>
                  <div className="detail-summary-pills">
                    <span className="detail-summary-pill">
                      <DateTimeCell value={selectedSale.createdAt} compact />
                    </span>
                  </div>
                </div>

                <div className="detail-summary-grid">
                  <div className="detail-summary-item">
                    <span className="detail-summary-label">Total</span>
                    <span className="detail-summary-value">
                      {formatCurrency(selectedSale.totalAmount)}
                    </span>
                  </div>
                  <div className="detail-summary-item">
                    <span className="detail-summary-label">Items</span>
                    <span className="detail-summary-value">{selectedSale.totalItems}</span>
                  </div>
                  <div className="detail-summary-item">
                    <span className="detail-summary-label">Tipo de pago</span>
                    <span className="detail-summary-value">
                      {selectedSale.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Productos vendidos</h4>
                <div className="data-table-container sales-detail-items-table">
                  <table className="data-table">
                    <colgroup>
                      <col className="sales-detail-items-table__code" />
                      <col className="sales-detail-items-table__product" />
                      <col className="sales-detail-items-table__brand" />
                      <col className="sales-detail-items-table__qty" />
                      <col className="sales-detail-items-table__price" />
                    </colgroup>
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell table-cell--header">Cod.</th>
                        <th className="table-cell table-cell--header">Producto</th>
                        <th className="table-cell table-cell--header">Marca</th>
                        <th className="table-cell table-cell--header table-cell--right">Cant.</th>
                        <th className="table-cell table-cell--header table-cell--right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {selectedSale.items.map((item) => (
                        <tr className="table-row" key={`${selectedSale.id}-${item.productId}`}>
                          <td className="table-cell table-cell--code" title={item.productCodebar}>
                            {item.productCodebar}
                          </td>
                          <td className="table-cell" title={item.productName}>
                            <span className="sales-detail-items-table__text">
                              {item.productName}
                            </span>
                          </td>
                          <td className="table-cell" title={item.brandName}>
                            <span className="sales-detail-items-table__text">
                              {item.brandName}
                            </span>
                          </td>
                          <td className="table-cell table-cell--right table-cell--number">
                            {item.quantity}
                          </td>
                          <td className="table-cell table-cell--right table-cell--number">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="panel-footer">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!selectedSale || isPreparingEdit}
            onClick={() => {
              void handleOpenEditModal();
            }}
          >
            {isPreparingEdit ? 'Preparando...' : 'Editar venta'}
          </button>
          <button
            type="button"
            className="btn btn-danger-outline"
            disabled={!selectedSale || isPreparingEdit}
            onClick={() => {
              void handleDeleteSale();
            }}
          >
            Eliminar
          </button>
        </div>
      </aside>

      {isModalOpen ? (
        <div className="modal-overlay modal-overlay--visible" role="dialog" aria-modal="true">
          <div className="modal modal--large sales-create-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'edit' ? 'Editar venta' : 'Registrar nueva venta'}
              </h3>
              <button type="button" className="modal-close" onClick={handleCloseModal}>
                x
              </button>
            </div>

            <form onSubmit={handleSubmitSale}>
              <div className="modal-content">
                {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
                <fieldset className="form-section sales-search-section">
                  <div className="sales-search-header">
                    <span className="form-section-title sales-search-title">
                      Buscar productos activos
                    </span>
                    <div className="sales-payment-method" role="radiogroup" aria-label="Metodo de pago">
                      <label className="sales-payment-option">
                        <input
                          type="radio"
                          name="payment-method"
                          value="cash"
                          checked={paymentMethod === 'cash'}
                          onChange={() => setPaymentMethod('cash')}
                        />
                        <span>Efectivo</span>
                      </label>
                      <label className="sales-payment-option">
                        <input
                          type="radio"
                          name="payment-method"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                        />
                        <span>Tarjeta</span>
                      </label>
                    </div>
                  </div>
                  <div className="form-field sales-search-field">
                    <input
                      className="form-input"
                      placeholder="Buscar por nombre, marca o codigo"
                      value={modalSearch}
                      onFocus={() => setIsAutocompleteOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setIsAutocompleteOpen(false), 120);
                      }}
                      onChange={(event) => {
                        const value = event.target.value;
                        setModalSearch(value);
                        setIsAutocompleteOpen(true);
                      }}
                    />

                    {isAutocompleteOpen && modalSearch.trim().length >= MODAL_SEARCH_MIN_CHARS ? (
                      <div className="sales-search-dropdown">
                        {isLoadingModalProducts ? (
                          <div className="sales-search-dropdown__empty">Buscando productos...</div>
                        ) : modalProducts.length === 0 ? (
                          <div className="sales-search-dropdown__empty">
                            No hay productos que coincidan.
                          </div>
                        ) : (
                          modalProducts.map((product) => {
                            const available = getAvailableStock(product);
                            return (
                              <button
                                type="button"
                                key={`suggestion-${product.id}`}
                                className="sales-search-option"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                }}
                                onClick={() => {
                                  handleAddProductFromSearch(product);
                                }}
                                disabled={available <= 0}
                              >
                                <span className="sales-search-option__main">
                                  <span className="table-cell--code">{product.codebar}</span>
                                  <span>{product.name}</span>
                                  <span className="sales-search-option__brand">{product.brand}</span>
                                </span>
                                <span className="sales-search-option__meta">
                                  {formatCurrency(product.salePrice)} - Stock {available}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    ) : null}
                  </div>
                </fieldset>

                <fieldset className="form-section">
                  <legend className="form-section-title">Items de la venta</legend>
                  <div className="data-table-container sales-items-table">
                    <table className="data-table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-cell table-cell--header">Codigo</th>
                          <th className="table-cell table-cell--header">Producto</th>
                          <th className="table-cell table-cell--header">Marca</th>
                          <th className="table-cell table-cell--header table-cell--right">Precio</th>
                          <th className="table-cell table-cell--header table-cell--right">Cantidad</th>
                          <th className="table-cell table-cell--header table-cell--right">Subtotal</th>
                          <th className="table-cell table-cell--header table-cell--right">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="table-body">
                        {cartItems.length === 0 ? (
                          <tr className="table-row">
                            <td className="table-cell" colSpan={7}>
                              Todavia no agregas productos.
                            </td>
                          </tr>
                        ) : (
                          cartItems.map((item) => (
                            <tr className="table-row" key={item.product.id}>
                              <td className="table-cell table-cell--code">{item.product.codebar}</td>
                              <td className="table-cell">{item.product.name}</td>
                              <td className="table-cell">{item.product.brand}</td>
                              <td className="table-cell table-cell--right table-cell--number">
                                {formatCurrency(item.product.salePrice)}
                              </td>
                              <td className="table-cell table-cell--right">
                                <div className="sales-qty-controls">
                                  <button
                                    type="button"
                                    className="btn btn-ghost sales-qty-btn"
                                    onPointerDown={(event) => {
                                      event.preventDefault();
                                      startQuantityRepeat(item.product.id, -1);
                                    }}
                                    onPointerUp={stopQuantityRepeat}
                                    onPointerLeave={stopQuantityRepeat}
                                    onPointerCancel={stopQuantityRepeat}
                                    onBlur={stopQuantityRepeat}
                                    onClick={(event) => {
                                      if (event.detail === 0) {
                                        updateCartQuantity(item.product.id, -1);
                                      }
                                    }}
                                  >
                                    -
                                  </button>
                                  <span className="table-cell--number">{item.quantity}</span>
                                  <button
                                    type="button"
                                    className="btn btn-ghost sales-qty-btn"
                                    onPointerDown={(event) => {
                                      event.preventDefault();
                                      startQuantityRepeat(item.product.id, 1);
                                    }}
                                    onPointerUp={stopQuantityRepeat}
                                    onPointerLeave={stopQuantityRepeat}
                                    onPointerCancel={stopQuantityRepeat}
                                    onBlur={stopQuantityRepeat}
                                    onClick={(event) => {
                                      if (event.detail === 0) {
                                        updateCartQuantity(item.product.id, 1);
                                      }
                                    }}
                                    disabled={item.quantity >= item.product.stock}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="table-cell table-cell--right table-cell--number">
                                {formatCurrency(item.quantity * item.product.salePrice)}
                              </td>
                              <td className="table-cell table-cell--right">
                                <button
                                  type="button"
                                  className="btn btn-danger-outline sales-trash-btn"
                                  onClick={() => removeFromCart(item.product.id)}
                                  title="Quitar producto"
                                  aria-label="Quitar producto"
                                >
                                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                    <path
                                      fill="currentColor"
                                      d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm-1 12h12l1-12H5l1 12z"
                                    />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </fieldset>

                <div className="detail-stats">
                  <div className="stat-card">
                    <span className="stat-label">Items</span>
                    <span className="stat-value">{cartItemsCount}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Total</span>
                    <span className="stat-value stat-value--price">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingSale || cartItemsCount === 0}
                >
                  {isSubmittingSale
                    ? modalMode === 'edit'
                      ? 'Guardando...'
                      : 'Registrando...'
                    : modalMode === 'edit'
                      ? 'Guardar cambios'
                      : 'Registrar venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};
