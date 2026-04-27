import { useEffect, useMemo, useState } from 'react';
import '../styles/products.css';
import { BarcodeSearch } from '../components/BarcodeSearch';
import { ProductDetails } from '../components/ProductDetails';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductTable } from '../components/ProductTable';
import { productsMockData } from '../mockData';
import { toProductViewModel } from '../presentation.utils';
import type { ProductFormValues, ProductModalState, ProductViewModel } from '../types';

const DEFAULT_PAGE_SIZE = 5;

const defaultModalState: ProductModalState = {
  isOpen: false,
  mode: 'create',
  editingProductId: null,
};

export const ProductPage = () => {
  const [products, setProducts] = useState<ProductViewModel[]>(productsMockData);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    productsMockData[0]?.id ?? null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ProductModalState>(defaultModalState);

  const brandOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand))).sort(),
    [products],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchFilter.trim().length === 0 ||
        product.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        product.codebar.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesBrand = brandFilter.length === 0 || product.brand === brandFilter;
      const matchesCategory =
        categoryFilter.length === 0 || product.category === categoryFilter;
      const matchesStatus =
        statusFilter.length === 0 || String(product.isActive) === statusFilter;

      return matchesSearch && matchesBrand && matchesCategory && matchesStatus;
    });
  }, [products, searchFilter, brandFilter, categoryFilter, statusFilter]);

  const totalItems = filteredProducts.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

  useEffect(() => {
    if (totalPages === 0) {
      if (page !== 1) setPage(1);
      return;
    }

    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * DEFAULT_PAGE_SIZE;
    const end = start + DEFAULT_PAGE_SIZE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page]);

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

  const handleSearch = (value: string) => {
    setSearchFilter(value);
    setPage(1);
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

    const shouldDelete = window.confirm(
      `Do you want to delete "${product.name}"?`,
    );
    if (!shouldDelete) return;

    setProducts((currentProducts) =>
      currentProducts.filter((item) => item.id !== productId),
    );

    if (selectedProductId === productId) {
      setSelectedProductId(null);
    }
  };

  const handleSubmitProduct = (values: ProductFormValues) => {
    if (modalState.mode === 'create') {
      const nextId =
        products.reduce((maxId, product) => Math.max(maxId, product.id), 0) + 1;
      const newProduct = toProductViewModel({ id: nextId, ...values });

      setProducts((currentProducts) => [newProduct, ...currentProducts]);
      setSelectedProductId(newProduct.id);
      setIsDetailOpen(true);
      setModalState(defaultModalState);
      setPage(1);
      return;
    }

    if (!modalState.editingProductId) {
      setModalState(defaultModalState);
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        if (product.id !== modalState.editingProductId) return product;

        return {
          ...product,
          ...toProductViewModel({ id: product.id, ...values }),
        };
      }),
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
          onSearch={handleSearch}
        />

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
                {brandOptions.map((brand) => (
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
                {categoryOptions.map((category) => (
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
              Showing {paginatedProducts.length} of {totalItems} products
            </span>
          </div>
        </section>

        <ProductTable
          products={paginatedProducts}
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
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialValues={modalInitialValues}
        onClose={() => setModalState(defaultModalState)}
        onSubmit={handleSubmitProduct}
      />
    </>
  );
};
