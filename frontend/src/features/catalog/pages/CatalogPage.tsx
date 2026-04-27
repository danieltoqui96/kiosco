import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../products/styles/products.css';
import { brandsApi, categoriesApi } from '../../products/api/catalog.api';
import { productsApi } from '../../products/api/products.api';
import type {
  Brand,
  Category,
  Product,
  ProductQueryParams,
} from '../../products/types';
import type { CatalogRouteState } from '../../../components/layout/MainLayout';

type CatalogMode = 'brands' | 'categories';

type CatalogEntity = Brand | Category;

interface CatalogItem {
  id: number;
  name: string;
  productsCount: number;
}

interface DetailProduct {
  id: number;
  codebar: string;
  name: string;
}

interface CatalogPageProps {
  mode: CatalogMode;
  routeState: CatalogRouteState;
  onRouteStateChange: (next: Partial<CatalogRouteState>) => void;
}

const LIST_PAGE_SIZE = 10;
const DETAIL_PRODUCTS_PAGE_SIZE = 100;

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

function mapDetailProduct(product: Product): DetailProduct {
  return {
    id: product.id,
    codebar: product.codebar,
    name: product.name,
  };
}

export const CatalogPage = ({ mode, routeState, onRouteStateChange }: CatalogPageProps) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [detailProducts, setDetailProducts] = useState<DetailProduct[]>([]);
  const [searchInput, setSearchInput] = useState(routeState.q);
  const [searchQuery, setSearchQuery] = useState(routeState.q);
  const [page, setPage] = useState(routeState.page);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formName, setFormName] = useState('');
  const selectedItemRef = useRef<CatalogItem | null>(null);

  const singularLabel = mode === 'brands' ? 'Marca' : 'Categoria';
  const pluralLabel = mode === 'brands' ? 'Marcas' : 'Categorias';
  const singularLabelLower = singularLabel.toLowerCase();
  const canDeleteSelected = selectedItem !== null && selectedItem.productsCount === 0;

  const syncCatalogRoute = useCallback(
    (next: Partial<CatalogRouteState>) => {
      onRouteStateChange({
        page: next.page ?? page,
        q: next.q ?? searchQuery,
      });
    },
    [onRouteStateChange, page, searchQuery],
  );

  const getProductsFilter = useCallback(
    (name: string): ProductQueryParams =>
      mode === 'brands' ? { brand: name } : { category: name },
    [mode],
  );

  const fetchProductsCountByName = useCallback(
    async (name: string): Promise<number> => {
      const response = await productsApi.getAll({
        page: 1,
        limit: 1,
        ...getProductsFilter(name),
      });

      return response.total;
    },
    [getProductsFilter],
  );

  const fetchCatalogItems = useCallback(async () => {
    setIsListLoading(true);
    setListError(null);

    try {
      const response =
        mode === 'brands'
          ? await brandsApi.getAll({
              page,
              limit: LIST_PAGE_SIZE,
              search: searchQuery || undefined,
            })
          : await categoriesApi.getAll({
              page,
              limit: LIST_PAGE_SIZE,
              search: searchQuery || undefined,
            });

      if (response.totalPages === 0 && page !== 1) {
        setPage(1);
        syncCatalogRoute({ page: 1 });
        return;
      }

      if (response.totalPages > 0 && page > response.totalPages) {
        setPage(response.totalPages);
        syncCatalogRoute({ page: response.totalPages });
        return;
      }

      const entities = response.items as CatalogEntity[];
      const withCounts = await Promise.all(
        entities.map(async (item) => ({
          id: item.id,
          name: item.name,
          productsCount: await fetchProductsCountByName(item.name).catch(() => 0),
        })),
      );

      setItems(withCounts);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);

      const currentSelected = selectedItemRef.current;
      if (currentSelected) {
        const refreshedSelected = withCounts.find((item) => item.id === currentSelected.id);

        if (!refreshedSelected) {
          setSelectedItem(null);
          setDetailProducts([]);
        } else if (
          currentSelected.name !== refreshedSelected.name ||
          currentSelected.productsCount !== refreshedSelected.productsCount
        ) {
          setSelectedItem(refreshedSelected);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `No se pudo cargar ${pluralLabel.toLowerCase()}.`;
      setListError(message);
      setItems([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsListLoading(false);
    }
  }, [
    fetchProductsCountByName,
    mode,
    page,
    pluralLabel,
    searchQuery,
    syncCatalogRoute,
  ]);

  const openCreateModal = () => {
    setActionError(null);
    setActionSuccess(null);
    setFormMode('create');
    setFormName('');
    setIsFormOpen(true);
  };

  const openEditModal = () => {
    if (!selectedItem) {
      setActionError(`Selecciona una ${singularLabelLower} para editar.`);
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setFormMode('edit');
    setFormName(selectedItem.name);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setFormName('');
  };

  const handleSubmitForm = async () => {
    const normalizedName = formName.trim();
    if (normalizedName.length === 0) {
      setActionError(`El nombre de ${singularLabelLower} es obligatorio.`);
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (formMode === 'create') {
        if (mode === 'brands') {
          await brandsApi.create({ name: normalizedName });
        } else {
          await categoriesApi.create({ name: normalizedName });
        }

        closeFormModal();
        setSearchInput('');
        setSearchQuery('');
        syncCatalogRoute({ page: 1, q: '' });
        if (page !== 1) {
          setPage(1);
        } else {
          await fetchCatalogItems();
        }
        setActionSuccess(`${singularLabel} creada correctamente.`);
        return;
      }

      if (!selectedItem) {
        setActionError(`Selecciona una ${singularLabelLower} para editar.`);
        return;
      }

      if (mode === 'brands') {
        await brandsApi.update(selectedItem.id, { name: normalizedName });
      } else {
        await categoriesApi.update(selectedItem.id, { name: normalizedName });
      }

      const refreshedItem: CatalogItem = { ...selectedItem, name: normalizedName };
      setSelectedItem(refreshedItem);
      closeFormModal();
      await fetchCatalogItems();
      await fetchDetailProducts(refreshedItem);
      setActionSuccess(`${singularLabel} actualizada correctamente.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `No se pudo guardar ${singularLabelLower}.`;
      setActionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedItem) {
      setActionError(`Selecciona una ${singularLabelLower} para eliminar.`);
      return;
    }

    if (selectedItem.productsCount > 0) {
      setActionError(
        `No se puede eliminar: ${singularLabelLower} tiene productos asociados.`,
      );
      return;
    }

    const shouldDelete = window.confirm(
      `Deseas eliminar ${singularLabelLower} "${selectedItem.name}"?`,
    );
    if (!shouldDelete) return;

    setIsDeleting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (mode === 'brands') {
        await brandsApi.remove(selectedItem.id);
      } else {
        await categoriesApi.remove(selectedItem.id);
      }

      const deletedName = selectedItem.name;
      setSelectedItem(null);
      setDetailProducts([]);
      await fetchCatalogItems();
      setActionSuccess(`${singularLabel} "${deletedName}" eliminada correctamente.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `No se pudo eliminar ${singularLabelLower}.`;
      setActionError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchDetailProducts = useCallback(
    async (item: CatalogItem) => {
      setIsDetailLoading(true);
      setDetailError(null);

      try {
        let currentPage = 1;
        let pages = 1;
        const products: DetailProduct[] = [];

        do {
          const response = await productsApi.getAll({
            page: currentPage,
            limit: DETAIL_PRODUCTS_PAGE_SIZE,
            ...getProductsFilter(item.name),
          });

          products.push(...response.items.map(mapDetailProduct));

          pages = response.totalPages === 0 ? 1 : response.totalPages;
          currentPage += 1;
        } while (currentPage <= pages);

        setDetailProducts(products);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `No se pudieron cargar productos de ${singularLabel.toLowerCase()}.`;
        setDetailError(message);
        setDetailProducts([]);
      } finally {
        setIsDetailLoading(false);
      }
    },
    [getProductsFilter, singularLabel],
  );

  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);

  useEffect(() => {
    setPage((current) => (current === routeState.page ? current : routeState.page));
    setSearchQuery((current) => (current === routeState.q ? current : routeState.q));
    setSearchInput((current) => (current === routeState.q ? current : routeState.q));
  }, [routeState.page, routeState.q]);

  useEffect(() => {
    setSelectedItem(null);
    setDetailProducts([]);
    setActionError(null);
    setActionSuccess(null);
    setIsFormOpen(false);
    setFormName('');
  }, [mode]);

  useEffect(() => {
    void fetchCatalogItems();
  }, [fetchCatalogItems]);

  const visiblePages = useMemo(() => buildVisiblePages(page, totalPages), [page, totalPages]);
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * LIST_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * LIST_PAGE_SIZE, totalItems);

  return (
    <>
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Gestion de {pluralLabel.toLowerCase()}</h1>
            <span className="breadcrumb">Inicio / {pluralLabel}</span>
          </div>
          <div className="header-actions">
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <span className="btn-icon">+</span>
              Agregar {singularLabel.toLowerCase()}
            </button>
          </div>
        </header>

        <section className="filters-bar">
          <div className="filters-group">
            <div className="filter-item">
              <label className="filter-label" htmlFor="catalog-search">
                Buscar {singularLabel.toLowerCase()}
              </label>
              <input
                id="catalog-search"
                className="form-input"
                placeholder={`Nombre de ${singularLabel.toLowerCase()}...`}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const nextQuery = searchInput.trim();
                    setSearchQuery(nextQuery);
                    setPage(1);
                    syncCatalogRoute({
                      q: nextQuery,
                      page: 1,
                    });
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
                syncCatalogRoute({
                  q: nextQuery,
                  page: 1,
                });
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
                syncCatalogRoute({
                  q: '',
                  page: 1,
                });
              }}
            >
              Limpiar
            </button>
            <span className="results-count">
              Mostrando {items.length} de {totalItems} {pluralLabel.toLowerCase()}
            </span>
          </div>
        </section>

        {listError ? <p className="form-error">{listError}</p> : null}
        {actionError ? <p className="form-error">{actionError}</p> : null}
        {actionSuccess ? <p className="form-success">{actionSuccess}</p> : null}

        <section className="data-table-container">
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th className="table-cell table-cell--header">ID</th>
                <th className="table-cell table-cell--header">Nombre</th>
                <th className="table-cell table-cell--header table-cell--right">
                  Cantidad productos
                </th>
                <th className="table-cell table-cell--header">Estado</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isListLoading ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={4}>
                    Cargando {pluralLabel.toLowerCase()}...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={4}>
                    No hay {pluralLabel.toLowerCase()} para mostrar.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={`table-row table-row--clickable${isSelected ? ' table-row--selected' : ''}`}
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDetailOpen(true);
                        void fetchDetailProducts(item);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedItem(item);
                          setIsDetailOpen(true);
                          void fetchDetailProducts(item);
                        }
                      }}
                      tabIndex={0}
                    >
                      <td className="table-cell table-cell--number">{item.id}</td>
                      <td className="table-cell">{item.name}</td>
                      <td className="table-cell table-cell--right table-cell--number">
                        {item.productsCount}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`status-badge ${
                            item.productsCount > 0
                              ? 'status-badge--active'
                              : 'status-badge--inactive'
                          }`}
                        >
                          {item.productsCount > 0 ? 'Con productos' : 'Sin productos'}
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
                className={`pagination-btn${page <= 1 ? ' pagination-btn--disabled' : ''}`}
                onClick={() => {
                  const nextPage = Math.max(1, page - 1);
                  setPage(nextPage);
                  syncCatalogRoute({ page: nextPage });
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
                          syncCatalogRoute({ page: visiblePage });
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
                  syncCatalogRoute({ page: nextPage });
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
          <h2 className="panel-title">Detalle de {singularLabel.toLowerCase()}</h2>
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
          {!selectedItem ? (
            <div className="detail-section">
              <h4 className="section-title">Sin seleccion</h4>
              <p className="detail-description">
                Selecciona una fila para ver el detalle de {singularLabel.toLowerCase()}.
              </p>
            </div>
          ) : (
            <>
              <div className="detail-hero">
                <div className="detail-header-info">
                  <h3 className="detail-title">{selectedItem.name}</h3>
                  <p className="detail-sku">ID: {selectedItem.id}</p>
                </div>
              </div>

              <div className="detail-stats">
                <div className="stat-card">
                  <span className="stat-label">Cantidad productos</span>
                  <span className="stat-value">{selectedItem.productsCount}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Productos asociados</h4>
                {detailError ? <p className="form-error">{detailError}</p> : null}

                <div className="data-table-container">
                  <table className="data-table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell table-cell--header">ID</th>
                        <th className="table-cell table-cell--header">Codigo</th>
                        <th className="table-cell table-cell--header">Nombre</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {isDetailLoading ? (
                        <tr className="table-row">
                          <td className="table-cell" colSpan={3}>
                            Cargando productos...
                          </td>
                        </tr>
                      ) : detailProducts.length === 0 ? (
                        <tr className="table-row">
                          <td className="table-cell" colSpan={3}>
                            No hay productos asociados.
                          </td>
                        </tr>
                      ) : (
                        detailProducts.map((product) => (
                          <tr key={product.id} className="table-row">
                            <td className="table-cell table-cell--number">{product.id}</td>
                            <td className="table-cell table-cell--code">{product.codebar}</td>
                            <td className="table-cell">{product.name}</td>
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

        <div className="panel-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openEditModal}
            disabled={!selectedItem || isSubmitting}
          >
            Editar {singularLabel.toLowerCase()}
          </button>
          {canDeleteSelected ? (
            <button
              type="button"
              className="btn btn-danger-outline"
              onClick={() => {
                void handleDeleteSelected();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : `Eliminar ${singularLabel.toLowerCase()}`}
            </button>
          ) : null}
        </div>
      </aside>

      {isFormOpen ? (
        <div className="modal-overlay modal-overlay--visible" role="dialog" aria-modal="true">
          <div className="modal modal--small">
            <div className="modal-header">
              <h3 className="modal-title">
                {formMode === 'create'
                  ? `Agregar ${singularLabel.toLowerCase()}`
                  : `Editar ${singularLabel.toLowerCase()}`}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={closeFormModal}
                aria-label="Cerrar"
              >
                x
              </button>
            </div>

            <div className="modal-content">
              <div className="form-field">
                <label className="form-label form-label--required" htmlFor="catalog-name">
                  Nombre
                </label>
                <input
                  id="catalog-name"
                  className="form-input"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleSubmitForm();
                    }
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeFormModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  void handleSubmitForm();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
