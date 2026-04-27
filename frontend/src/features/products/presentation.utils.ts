import type { Product, ProductUiDerived, ProductViewModel } from './types';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export function formatCurrency(
  amount: number,
  locale = 'es-CL',
  currency = 'CLP',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStockStatus(
  stock: number,
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
): ProductUiDerived['stockStatus'] {
  if (stock <= 0) return 'zero';
  if (stock <= lowStockThreshold) return 'low';
  return 'ok';
}

export function getStatusLabel(
  isActive: boolean,
  stockStatus: ProductUiDerived['stockStatus'],
): ProductUiDerived['statusLabel'] {
  if (stockStatus === 'zero') return 'Sin stock';
  if (!isActive) return 'Inactivo';
  if (stockStatus === 'low') return 'Stock bajo';
  return 'Activo';
}

export function getStatusBadgeClass(
  statusLabel: ProductUiDerived['statusLabel'],
): string {
  if (statusLabel === 'Activo') return 'status-badge status-badge--active';
  if (statusLabel === 'Stock bajo') return 'status-badge status-badge--warning';
  return 'status-badge status-badge--inactive';
}

export function toProductViewModel(product: Product): ProductViewModel {
  const stockStatus = getStockStatus(product.stock);
  const statusLabel = getStatusLabel(product.isActive, stockStatus);

  return {
    ...product,
    stockStatus,
    statusLabel,
  };
}
