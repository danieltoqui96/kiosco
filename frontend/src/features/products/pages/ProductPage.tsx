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

const DEFAULT_PAGE_SIZE = 5;

const defaultModalState: ProductModalState = {
  isOpen: false,
  mode: 'create',
  editingProductId: null,
};

export const ProductPage = () => {
  const [products, setProducts] = useState<ProductViewModel[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isBarcodeSearching, setIsBarcodeSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalState, setModalState] = useState<ProductModalState>(defaultModalState);

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
        error instanceof Error ? error.message : 'Failed to load products.';
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

  const editingProduct = useMemo(
    () =>
      products.find((product) => product.id === modalState.editingProductId) ?? null,
    [modalState.editingProductId, products],
  );

  const modalInitialValues: ProductFormValues | null = editingProduct
    ? {
        codebar: editingProduct.codebar,
        name: editingProduct.name,
        brand: editingProduct.brand,
        category: editingProduct.category,
        salePrice: editingProduct.salePrice,
        purchasePrice: editingProduct.purchasePrice,
        stock: editingProduct.stock,
        isActive: editingProduct.isActive,
      }
    : null;

  const handleBarcodeSearch = async (value: string) => {
    const normalizedValue = value.trim();
    setBarcodeQuery(normalizedValue);
    setErrorMessage(null);

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
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        setSelectedProductId(null);
        setSearchFilter(normalizedValue);
        setPage(1);
        setErrorMessage('Barcode not found. Showing search results.');
      } else {
        const message =
          error instanceof Error ? error.message : 'Barcode search failed.';
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
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProductId((currentId) => (currentId === productId ? null : productId));
    setIsDetailOpen(true);
  };

  const handleOpenCreate = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      editingProductId: null,
    });
  };

  const handleOpenEdit = (productId: number) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      editingProductId: productId,
    });
  };

  const handleDelete = (productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    window.alert(
      `Delete flow for "${product.name}" will be connected in Stage 3.`,
    );
  };

  const handleSubmitProduct = (values: ProductFormValues) => {
    void values;
    window.alert(
      modalState.mode === 'create'
        ? 'Create flow will be connected in Stage 3.'
        : 'Edit flow will be connected in Stage 3.',
    );
    setModalState(defaultModalState);
  };

  return (
    <>
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Product Management</h1>
            <span className="breadcrumb">Home / Products</span>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreate}
            >
              <span className="btn-icon">+</span>
              New Product
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

        <section className="filters-bar">
          <div className="filters-group">
            <div className="filter-item">
              <label className="filter-label" htmlFor="brand-filter">
                Brand
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
                <option value="">All</option>
                {(brandOptions.length > 0 ? brandOptions : fallbackBrandOptions).map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label" htmlFor="category-filter">
                Category
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
                <option value="">All</option>
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
                Status
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
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="filters-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClearFilters}
            >
              Clear filters
            </button>
            <span className="results-count">
              Showing {products.length} of {totalItems} products
            </span>
          </div>
        </section>

        <ProductTable
          products={products}
          selectedProductId={selectedProductId}
          onSelectProduct={handleSelectProduct}
          onViewProduct={(productId) => {
            setSelectedProductId(productId);
            setIsDetailOpen(true);
          }}
          onEditProduct={handleOpenEdit}
          onDeleteProduct={handleDelete}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={DEFAULT_PAGE_SIZE}
          isLoading={isLoading}
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
        onDelete={handleDelete}
      />

      <ProductFormModal
        key={`${modalState.mode}-${modalState.editingProductId ?? 'new'}-${String(modalState.isOpen)}`}
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialValues={modalInitialValues}
        onClose={() => setModalState(defaultModalState)}
        onSubmit={handleSubmitProduct}
      />
    </>
  );
};
