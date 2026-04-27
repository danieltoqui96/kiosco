import { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/products.css';
import { brandsApi, categoriesApi } from '../api/catalog.api';
import { ApiClientError } from '../api/http';
import { productsApi } from '../api/products.api';
import { BarcodeSearch } from '../components/BarcodeSearch';
import { ProductDetails } from '../components/ProductDetails';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductTable } from '../components/ProductTable';
import { toProductViewModel } from '../presentation.utils';
import type { ProductFormValues, ProductModalState, ProductViewModel } from '../types';
import type { ProductRouteState } from '../../../components/layout/MainLayout';

const DEFAULT_PAGE_SIZE = 10;

const defaultModalState: ProductModalState = {
  isOpen: false,
  mode: 'create',
  editingProductId: null,
};

interface ProductPageProps {
  routeState: ProductRouteState;
  onRouteStateChange: (next: Partial<ProductRouteState>) => void;
}

function buildUpdatePayload(
  nextValues: ProductFormValues,
  currentValues: ProductFormValues,
): Partial<ProductFormValues> {
  const payload: Partial<ProductFormValues> = {};

  if (nextValues.codebar !== currentValues.codebar) payload.codebar = nextValues.codebar;
  if (nextValues.name !== currentValues.name) payload.name = nextValues.name;
  if (nextValues.brand !== currentValues.brand) payload.brand = nextValues.brand;
  if (nextValues.category !== currentValues.category) payload.category = nextValues.category;
  if (nextValues.salePrice !== currentValues.salePrice) payload.salePrice = nextValues.salePrice;
  if (nextValues.purchasePrice !== currentValues.purchasePrice) {
    payload.purchasePrice = nextValues.purchasePrice;
  }
  if (nextValues.stock !== currentValues.stock) payload.stock = nextValues.stock;
  if (nextValues.isActive !== currentValues.isActive) payload.isActive = nextValues.isActive;

  return payload;
}

export const ProductPage = ({ routeState, onRouteStateChange }: ProductPageProps) => {
  const [products, setProducts] = useState<ProductViewModel[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isBarcodeSearching, setIsBarcodeSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [barcodeQuery, setBarcodeQuery] = useState(routeState.codebar);
  const [searchFilter, setSearchFilter] = useState(routeState.search);
  const [brandFilter, setBrandFilter] = useState(routeState.brand);
  const [categoryFilter, setCategoryFilter] = useState(routeState.category);
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>(routeState.status);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [page, setPage] = useState(routeState.page);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalState, setModalState] = useState<ProductModalState>(defaultModalState);
  const [formInitialValues, setFormInitialValues] = useState<ProductFormValues | null>(
    null,
  );
  const hasActiveFilters =
    searchFilter.trim().length > 0 ||
    brandFilter.trim().length > 0 ||
    categoryFilter.trim().length > 0 ||
    statusFilter.trim().length > 0;

  const fallbackBrandOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand))).sort(),
    [products],
  );

  const fallbackCategoryOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await productsApi.getAll({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: searchFilter || undefined,
        brand: brandFilter || undefined,
        category: categoryFilter || undefined,
        isActive:
          statusFilter.length === 0
            ? undefined
            : statusFilter === 'true',
      });

      if (response.totalPages === 0 && page !== 1) {
        setPage(1);
        return;
      }

      if (response.totalPages > 0 && page > response.totalPages) {
        setPage(response.totalPages);
        return;
      }

      const viewModels = response.items.map(toProductViewModel);
      setProducts(viewModels);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron cargar los productos.';
      setErrorMessage(message);
      setProducts([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [brandFilter, categoryFilter, page, searchFilter, statusFilter]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (page !== routeState.page) setPage(routeState.page);
    if (searchFilter !== routeState.search) setSearchFilter(routeState.search);
    if (brandFilter !== routeState.brand) setBrandFilter(routeState.brand);
    if (categoryFilter !== routeState.category) setCategoryFilter(routeState.category);
    if (statusFilter !== routeState.status) setStatusFilter(routeState.status);
    if (barcodeQuery !== routeState.codebar) setBarcodeQuery(routeState.codebar);
  }, [
    barcodeQuery,
    brandFilter,
    categoryFilter,
    page,
    routeState.brand,
    routeState.category,
    routeState.codebar,
    routeState.page,
    routeState.search,
    routeState.status,
    searchFilter,
    statusFilter,
  ]);

  useEffect(() => {
    const isAlreadySyncedWithRoute =
      page === routeState.page &&
      searchFilter === routeState.search &&
      brandFilter === routeState.brand &&
      categoryFilter === routeState.category &&
      statusFilter === routeState.status &&
      barcodeQuery === routeState.codebar;

    if (isAlreadySyncedWithRoute) return;

    onRouteStateChange({
      page,
      search: searchFilter,
      brand: brandFilter,
      category: categoryFilter,
      status: statusFilter,
      codebar: barcodeQuery,
    });
  }, [
    barcodeQuery,
    brandFilter,
    categoryFilter,
    onRouteStateChange,
    page,
    routeState.brand,
    routeState.category,
    routeState.codebar,
    routeState.page,
    routeState.search,
    routeState.status,
    searchFilter,
    statusFilter,
  ]);

  const fetchCatalogs = useCallback(async () => {
    try {
      const [brandsResponse, categoriesResponse] = await Promise.all([
        brandsApi.getAll({ page: 1, limit: 100 }),
        categoriesApi.getAll({ page: 1, limit: 100 }),
      ]);

      setBrandOptions(brandsResponse.items.map((brand) => brand.name));
      setCategoryOptions(categoriesResponse.items.map((category) => category.name));
    } catch {
      // Keep fallback options derived from current products.
    }
  }, []);

  useEffect(() => {
    void fetchCatalogs();
  }, [fetchCatalogs]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const handleBarcodeSearch = async (value: string) => {
    const normalizedValue = value.trim();
    setBarcodeQuery(normalizedValue);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!normalizedValue) {
      setSearchFilter('');
      setPage(1);
      return;
    }

    setIsBarcodeSearching(true);
    try {
      const product = await productsApi.getByCodebar(normalizedValue);
      const viewModel = toProductViewModel(product);

      setProducts([viewModel]);
      setTotalItems(1);
      setTotalPages(1);
      setPage(1);
      setSelectedProductId(product.id);
      setIsDetailOpen(true);
      setSearchFilter(normalizedValue);
      setSuccessMessage('Producto encontrado por codigo de barras.');
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        setSelectedProductId(null);
        setSearchFilter(normalizedValue);
        setPage(1);
        setErrorMessage('No existe ese codigo de barras. Mostrando resultados de busqueda.');
      } else {
        const message =
          error instanceof Error ? error.message : 'Fallo la busqueda por codigo.';
        setErrorMessage(message);
      }
    } finally {
      setIsBarcodeSearching(false);
    }
  };

  const handleClearFilters = () => {
    setBarcodeQuery('');
    setSearchFilter('');
    setBrandFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
    setErrorMessage(null);
    setSuccessMessage('Filtros limpiados.');
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProductId(productId);
    setIsDetailOpen(true);
  };

  const handleOpenCreate = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setFormInitialValues(null);
    setModalState({
      isOpen: true,
      mode: 'create',
      editingProductId: null,
    });
  };

  const closeProductModal = () => {
    setFormInitialValues(null);
    setModalState(defaultModalState);
  };

  const handleOpenEdit = (productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      setErrorMessage('No se encontro el producto para editar.');
      return;
    }

    setFormInitialValues({
      codebar: product.codebar,
      name: product.name,
      brand: product.brand,
      category: product.category,
      salePrice: product.salePrice,
      purchasePrice: product.purchasePrice,
      stock: product.stock,
      isActive: product.isActive,
    });

    setErrorMessage(null);
    setSuccessMessage(null);
    setModalState({
      isOpen: true,
      mode: 'edit',
      editingProductId: productId,
    });
  };

  const handleDelete = async (productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const shouldDelete = window.confirm(
      `Deseas eliminar "${product.name}"?`,
    );
    if (!shouldDelete) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await productsApi.remove(productId);

      if (selectedProductId === productId) {
        setSelectedProductId(null);
      }

      await fetchProducts();
      setSuccessMessage(`Producto "${product.name}" eliminado.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo eliminar el producto.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProduct = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (modalState.mode === 'create') {
        const createdProduct = await productsApi.create(values);

        setSelectedProductId(createdProduct.id);
        setIsDetailOpen(true);
        closeProductModal();
        setBarcodeQuery('');
        setSearchFilter('');
        setBrandFilter('');
        setCategoryFilter('');
        setStatusFilter('');

        if (page !== 1) {
          setPage(1);
        } else {
          await fetchProducts();
        }

        void fetchCatalogs();
        setSuccessMessage(`Producto "${createdProduct.name}" creado.`);
        return;
      }

      if (!modalState.editingProductId) {
        setErrorMessage('No hay producto seleccionado para editar.');
        return;
      }

      if (!formInitialValues) {
        setErrorMessage('No se pudieron preparar los datos de edicion.');
        return;
      }

      const updatePayload = buildUpdatePayload(values, formInitialValues);

      if (Object.keys(updatePayload).length === 0) {
        closeProductModal();
        setSuccessMessage('No habia cambios para guardar.');
        return;
      }

      try {
        const updatedProduct = await productsApi.update(
          modalState.editingProductId,
          updatePayload,
        );
        setSelectedProductId(updatedProduct.id);
        setIsDetailOpen(true);
        closeProductModal();
        await fetchProducts();
        void fetchCatalogs();
        setSuccessMessage(`Producto "${updatedProduct.name}" actualizado.`);
      } catch (updateError) {
        if (updateError instanceof ApiClientError && updateError.statusCode === 404) {
          const existingProduct = await productsApi
            .getById(modalState.editingProductId)
            .catch(() => null);

          if (existingProduct) {
            setSelectedProductId(existingProduct.id);
            setIsDetailOpen(true);
            closeProductModal();
            await fetchProducts();
            setSuccessMessage('Cambios procesados correctamente.');
            return;
          }
        }
        throw updateError;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : modalState.mode === 'create'
            ? 'No se pudo crear el producto.'
            : 'No se pudo actualizar el producto.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Gestion de productos</h1>
            <span className="breadcrumb">Inicio / Productos</span>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreate}
            >
              <span className="btn-icon">+</span>
              Agregar producto
            </button>
          </div>
        </header>

        <BarcodeSearch
          value={barcodeQuery}
          onChange={setBarcodeQuery}
          onSearch={(value) => {
            void handleBarcodeSearch(value);
          }}
          isLoading={isLoading || isBarcodeSearching}
        />

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        {successMessage ? <p className="form-success">{successMessage}</p> : null}

        <section className="filters-bar">
          <div className="filters-group">
            <div className="filter-item">
              <label className="filter-label" htmlFor="brand-filter">
                Marca
              </label>
              <select
                id="brand-filter"
                className="filter-select"
                value={brandFilter}
                onChange={(event) => {
                  setBrandFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todas</option>
                {(brandOptions.length > 0 ? brandOptions : fallbackBrandOptions).map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label" htmlFor="category-filter">
                Categoria
              </label>
              <select
                id="category-filter"
                className="filter-select"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todas</option>
                {(categoryOptions.length > 0
                  ? categoryOptions
                  : fallbackCategoryOptions
                ).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label" htmlFor="status-filter">
                Estado
              </label>
              <select
                id="status-filter"
                className="filter-select"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as '' | 'true' | 'false');
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="filters-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClearFilters}
            >
              Limpiar filtros
            </button>
            <span className="results-count">
              Mostrando {products.length} de {totalItems} productos
            </span>
          </div>
        </section>

        <ProductTable
          products={products}
          selectedProductId={selectedProductId}
          onSelectProduct={handleSelectProduct}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={DEFAULT_PAGE_SIZE}
          isLoading={isLoading}
          emptyMessage={
            hasActiveFilters
              ? 'No hay productos que coincidan con los filtros.'
              : 'Aun no hay productos disponibles.'
          }
          onPrevPage={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          onNextPage={() =>
            setPage((currentPage) =>
              totalPages === 0 ? 1 : Math.min(totalPages, currentPage + 1),
            )
          }
          onGoToPage={(nextPage) => {
            if (nextPage < 1) return;
            if (totalPages !== 0 && nextPage > totalPages) return;
            setPage(nextPage);
          }}
        />
      </main>

      <ProductDetails
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleOpenEdit}
        onDelete={(productId) => {
          void handleDelete(productId);
        }}
      />

      <ProductFormModal
        key={`${modalState.mode}-${modalState.editingProductId ?? 'new'}-${String(modalState.isOpen)}`}
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialValues={formInitialValues}
        isSubmitting={isSubmitting}
        onClose={closeProductModal}
        onSubmit={(values) => {
          void handleSubmitProduct(values);
        }}
      />
    </>
  );
};
