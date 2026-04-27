import { useMemo, useState, type FormEvent } from 'react';
import type { ProductFormValues } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: ProductFormValues | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => void;
}

interface ProductFormErrors {
  codebar?: string;
  name?: string;
  brand?: string;
  category?: string;
  salePrice?: string;
  purchasePrice?: string;
  stock?: string;
}

const DEFAULT_VALUES: ProductFormValues = {
  codebar: '',
  name: '',
  brand: '',
  category: '',
  salePrice: 0,
  purchasePrice: 0,
  stock: 0,
  isActive: true,
};

function sanitizeValues(
  values: ProductFormValues | null | undefined,
): ProductFormValues {
  if (!values) return DEFAULT_VALUES;
  return {
    ...values,
    codebar: values.codebar.trim(),
    name: values.name.trim(),
    brand: values.brand.trim(),
    category: values.category.trim(),
  };
}

function getInitialFormValues(
  values: ProductFormValues | null | undefined,
): ProductFormValues {
  return sanitizeValues(values) ?? DEFAULT_VALUES;
}

function validate(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};
  if (!values.codebar.trim()) errors.codebar = 'Barcode is required.';
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!values.brand.trim()) errors.brand = 'Brand is required.';
  if (!values.category.trim()) errors.category = 'Category is required.';
  if (!Number.isFinite(values.salePrice) || values.salePrice < 0) {
    errors.salePrice = 'Sale price must be a positive number.';
  }
  if (!Number.isFinite(values.purchasePrice) || values.purchasePrice < 0) {
    errors.purchasePrice = 'Purchase price must be a positive number.';
  }
  if (!Number.isFinite(values.stock) || values.stock < 0) {
    errors.stock = 'Stock must be a positive integer.';
  }
  return errors;
}

export const ProductFormModal = ({
  isOpen,
  mode,
  initialValues,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ProductFormModalProps) => {
  const [values, setValues] = useState<ProductFormValues>(() =>
    getInitialFormValues(initialValues),
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});

  const title = useMemo(
    () => (mode === 'create' ? 'Create Product' : 'Edit Product'),
    [mode],
  );

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(sanitizeValues(values));
  };

  return (
    <div className="modal-overlay modal-overlay--visible" role="dialog" aria-modal="true">
      <div className="modal modal--large">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <fieldset className="form-section">
              <legend className="form-section-title">General Information</legend>
              <div className="form-grid form-grid--2col">
                <div className={`form-field${errors.codebar ? ' form-field--error' : ''}`}>
                  <label className="form-label form-label--required" htmlFor="product-codebar">
                    Barcode
                  </label>
                  <input
                    id="product-codebar"
                    className="form-input"
                    value={values.codebar}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, codebar: event.target.value }))
                    }
                  />
                  {errors.codebar ? <span className="form-error">{errors.codebar}</span> : null}
                </div>

                <div className={`form-field${errors.name ? ' form-field--error' : ''}`}>
                  <label className="form-label form-label--required" htmlFor="product-name">
                    Name
                  </label>
                  <input
                    id="product-name"
                    className="form-input"
                    value={values.name}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                  {errors.name ? <span className="form-error">{errors.name}</span> : null}
                </div>

                <div className={`form-field${errors.brand ? ' form-field--error' : ''}`}>
                  <label className="form-label form-label--required" htmlFor="product-brand">
                    Brand
                  </label>
                  <input
                    id="product-brand"
                    className="form-input"
                    value={values.brand}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, brand: event.target.value }))
                    }
                  />
                  {errors.brand ? <span className="form-error">{errors.brand}</span> : null}
                </div>

                <div className={`form-field${errors.category ? ' form-field--error' : ''}`}>
                  <label
                    className="form-label form-label--required"
                    htmlFor="product-category"
                  >
                    Category
                  </label>
                  <input
                    id="product-category"
                    className="form-input"
                    value={values.category}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, category: event.target.value }))
                    }
                  />
                  {errors.category ? (
                    <span className="form-error">{errors.category}</span>
                  ) : null}
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend className="form-section-title">Pricing and Stock</legend>
              <div className="form-grid form-grid--3col">
                <div className={`form-field${errors.salePrice ? ' form-field--error' : ''}`}>
                  <label
                    className="form-label form-label--required"
                    htmlFor="product-sale-price"
                  >
                    Sale Price
                  </label>
                  <input
                    id="product-sale-price"
                    className="form-input"
                    type="number"
                    min={0}
                    value={values.salePrice}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        salePrice: Number(event.target.value || 0),
                      }))
                    }
                  />
                  {errors.salePrice ? (
                    <span className="form-error">{errors.salePrice}</span>
                  ) : null}
                </div>

                <div
                  className={`form-field${errors.purchasePrice ? ' form-field--error' : ''}`}
                >
                  <label
                    className="form-label form-label--required"
                    htmlFor="product-purchase-price"
                  >
                    Purchase Price
                  </label>
                  <input
                    id="product-purchase-price"
                    className="form-input"
                    type="number"
                    min={0}
                    value={values.purchasePrice}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        purchasePrice: Number(event.target.value || 0),
                      }))
                    }
                  />
                  {errors.purchasePrice ? (
                    <span className="form-error">{errors.purchasePrice}</span>
                  ) : null}
                </div>

                <div className={`form-field${errors.stock ? ' form-field--error' : ''}`}>
                  <label className="form-label form-label--required" htmlFor="product-stock">
                    Stock
                  </label>
                  <input
                    id="product-stock"
                    className="form-input"
                    type="number"
                    min={0}
                    step={1}
                    value={values.stock}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        stock: Number(event.target.value || 0),
                      }))
                    }
                  />
                  {errors.stock ? <span className="form-error">{errors.stock}</span> : null}
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend className="form-section-title">Status</legend>
              <div className="form-field form-field--inline">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={values.isActive}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, isActive: event.target.checked }))
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">
                  {values.isActive ? 'Active product' : 'Inactive product'}
                </span>
              </div>
            </fieldset>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Product'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
