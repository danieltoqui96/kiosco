import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
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

interface ProductFormTextValues {
  salePrice: string;
  purchasePrice: string;
  stock: string;
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
  expirationDate: null,
};

function toNumericTextValues(values: ProductFormValues): ProductFormTextValues {
  return {
    salePrice: values.salePrice === 0 ? '' : formatNumberInput(values.salePrice),
    purchasePrice:
      values.purchasePrice === 0 ? '' : formatNumberInput(values.purchasePrice),
    stock: values.stock === 0 ? '' : formatNumberInput(values.stock),
  };
}

function parseNumberInput(value: string): number {
  const normalizedValue = value.replace(/\./g, '').trim();
  if (normalizedValue.length === 0) return 0;
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatNumberInput(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeNumberInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  return formatNumberInput(Number(digits));
}

function sanitizeValues(
  values: ProductFormValues | null | undefined,
): ProductFormValues {
  if (!values) return DEFAULT_VALUES;
  return {
    ...values,
    codebar: values.codebar.trim(),
    name: values.name.trim().toUpperCase(),
    brand: values.brand.trim().toUpperCase(),
    category: values.category.trim().toUpperCase(),
    expirationDate: values.expirationDate || null,
  };
}

function getInitialFormValues(
  values: ProductFormValues | null | undefined,
): ProductFormValues {
  return sanitizeValues(values) ?? DEFAULT_VALUES;
}

function validate(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};
  if (!values.codebar.trim()) errors.codebar = 'El codigo de barras es obligatorio.';
  if (!values.name.trim()) errors.name = 'El nombre es obligatorio.';
  if (!values.brand.trim()) errors.brand = 'La marca es obligatoria.';
  if (!values.category.trim()) errors.category = 'La categoria es obligatoria.';
  if (!Number.isFinite(values.salePrice) || values.salePrice < 0) {
    errors.salePrice = 'El precio de venta debe ser un numero positivo.';
  }
  if (!Number.isFinite(values.purchasePrice) || values.purchasePrice < 0) {
    errors.purchasePrice = 'El precio de compra debe ser un numero positivo.';
  }
  if (!Number.isFinite(values.stock) || values.stock < 0) {
    errors.stock = 'El stock debe ser un entero positivo.';
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
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ProductFormValues>(() =>
    getInitialFormValues(initialValues),
  );
  const [numericTexts, setNumericTexts] = useState<ProductFormTextValues>(() =>
    toNumericTextValues(getInitialFormValues(initialValues)),
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    const nextValues = getInitialFormValues(initialValues);
    setValues(nextValues);
    setNumericTexts(toNumericTextValues(nextValues));
    setErrors({});
  }, [initialValues, isOpen]);

  const title = useMemo(
    () => (mode === 'create' ? 'Agregar producto' : 'Editar producto'),
    [mode],
  );

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValues = {
      ...values,
      salePrice: parseNumberInput(numericTexts.salePrice),
      purchasePrice: parseNumberInput(numericTexts.purchasePrice),
      stock: parseNumberInput(numericTexts.stock),
    };
    const nextErrors = validate(nextValues);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(sanitizeValues(nextValues));
  };

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter') return;
    if (!(event.target instanceof HTMLInputElement)) return;

    event.preventDefault();

    if (event.target.id === 'product-codebar') {
      nameInputRef.current?.focus();
    }
  };

  return (
    <div className="modal-overlay modal-overlay--visible" role="dialog" aria-modal="true">
      <div className="modal modal--large">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
          <div className="modal-content">
            <fieldset className="form-section">
              <legend className="form-section-title">Informacion general</legend>
              <div className="form-grid form-grid--2col">
                <div className={`form-field${errors.codebar ? ' form-field--error' : ''}`}>
                  <label className="form-label form-label--required" htmlFor="product-codebar">
                    Codigo de barras
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
                    Nombre
                  </label>
                  <input
                    id="product-name"
                    ref={nameInputRef}
                    className="form-input"
                    value={values.name}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        name: event.target.value.toUpperCase(),
                      }))
                    }
                  />
                  {errors.name ? <span className="form-error">{errors.name}</span> : null}
                </div>

                <div className={`form-field${errors.brand ? ' form-field--error' : ''}`}>
                  <label className="form-label form-label--required" htmlFor="product-brand">
                    Marca
                  </label>
                  <input
                    id="product-brand"
                    className="form-input"
                    value={values.brand}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        brand: event.target.value.toUpperCase(),
                      }))
                    }
                  />
                  {errors.brand ? <span className="form-error">{errors.brand}</span> : null}
                </div>

                <div className={`form-field${errors.category ? ' form-field--error' : ''}`}>
                  <label
                    className="form-label form-label--required"
                    htmlFor="product-category"
                  >
                    Categoria
                  </label>
                  <input
                    id="product-category"
                    className="form-input"
                    value={values.category}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        category: event.target.value.toUpperCase(),
                      }))
                    }
                  />
                  {errors.category ? (
                    <span className="form-error">{errors.category}</span>
                  ) : null}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="product-expiration-date">
                    Fecha de vencimiento
                  </label>
                  <input
                    id="product-expiration-date"
                    type="date"
                    className="form-input"
                    value={values.expirationDate ?? ''}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        expirationDate: event.target.value || null,
                      }))
                    }
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend className="form-section-title">Precios y stock</legend>
              <div className="form-grid form-grid--3col">
                <div className={`form-field${errors.salePrice ? ' form-field--error' : ''}`}>
                  <label
                    className="form-label form-label--required"
                    htmlFor="product-sale-price"
                  >
                    Precio venta
                  </label>
                  <input
                    id="product-sale-price"
                    type="text"
                    className="form-input"
                    inputMode="numeric"
                    value={numericTexts.salePrice}
                    onChange={(event) => {
                      const nextValue = normalizeNumberInput(event.target.value);
                      setNumericTexts((prev) => ({ ...prev, salePrice: nextValue }));
                      setValues((prev) => ({
                        ...prev,
                        salePrice: parseNumberInput(nextValue),
                      }));
                    }}
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
                    Precio compra
                  </label>
                  <input
                    id="product-purchase-price"
                    type="text"
                    className="form-input"
                    inputMode="numeric"
                    value={numericTexts.purchasePrice}
                    onChange={(event) => {
                      const nextValue = normalizeNumberInput(event.target.value);
                      setNumericTexts((prev) => ({ ...prev, purchasePrice: nextValue }));
                      setValues((prev) => ({
                        ...prev,
                        purchasePrice: parseNumberInput(nextValue),
                      }));
                    }}
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
                    type="text"
                    className="form-input"
                    inputMode="numeric"
                    value={numericTexts.stock}
                    onChange={(event) => {
                      const nextValue = normalizeNumberInput(event.target.value);
                      setNumericTexts((prev) => ({ ...prev, stock: nextValue }));
                      setValues((prev) => ({
                        ...prev,
                        stock: parseNumberInput(nextValue),
                      }));
                    }}
                  />
                  {errors.stock ? <span className="form-error">{errors.stock}</span> : null}
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend className="form-section-title">Estado</legend>
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
                  {values.isActive ? 'Producto activo' : 'Producto inactivo'}
                </span>
              </div>
            </fieldset>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Agregar producto'
                  : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
