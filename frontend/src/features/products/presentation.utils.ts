import type { Product, ProductUiDerived, ProductViewModel } from './types';

const DEFAULT_LOW_STOCK_THRESHOLD = 10;
const DEFAULT_EXPIRATION_WARNING_DAYS = 7;

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
): ProductUiDerived['statusLabel'] {
  return isActive ? 'Activo' : 'Inactivo';
}

export function getStatusBadgeClass(
  statusLabel: ProductUiDerived['statusLabel'],
): string {
  if (statusLabel === 'Activo') return 'status-badge status-badge--active';
  return 'status-badge status-badge--inactive';
}

export function getStockAlertLabel(
  stockStatus: ProductUiDerived['stockStatus'],
): ProductUiDerived['stockAlertLabel'] {
  if (stockStatus === 'zero') return 'Sin stock';
  if (stockStatus === 'low') return 'Stock bajo';
  return null;
}

function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getDaysUntilExpiration(expirationDate: string | null): number | null {
  if (!expirationDate) return null;
  const [year, month, day] = expirationDate.split('-').map(Number);
  const expiration = new Date(year, month - 1, day);
  if (Number.isNaN(expiration.getTime())) return null;
  const diffMs = expiration.getTime() - getTodayStart().getTime();
  return Math.ceil(diffMs / 86_400_000);
}

function getExpirationStatus(
  expirationDate: string | null,
): ProductUiDerived['expirationStatus'] {
  const days = getDaysUntilExpiration(expirationDate);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= DEFAULT_EXPIRATION_WARNING_DAYS) return 'soon';
  return 'ok';
}

function getExpirationLabel(expirationDate: string | null): string {
  const days = getDaysUntilExpiration(expirationDate);
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)} d venc.`;
  if (days === 0) return 'Hoy';
  return `${days} d`;
}

function getExpirationAlertLabel(
  status: ProductUiDerived['expirationStatus'],
): ProductUiDerived['expirationAlertLabel'] {
  if (status === 'expired') return 'Vencido';
  if (status === 'soon') return 'Por vencer';
  return null;
}

export function formatDate(value: string | null): string {
  if (!value) return 'Sin vencimiento';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date);
}

export function toProductViewModel(product: Product): ProductViewModel {
  const stockStatus = getStockStatus(product.stock);
  const statusLabel = getStatusLabel(product.isActive);
  const stockAlertLabel = getStockAlertLabel(stockStatus);
  const expirationStatus = getExpirationStatus(product.expirationDate);
  const expirationLabel = getExpirationLabel(product.expirationDate);
  const expirationAlertLabel = getExpirationAlertLabel(expirationStatus);

  return {
    ...product,
    stockStatus,
    statusLabel,
    stockAlertLabel,
    expirationStatus,
    expirationLabel,
    expirationAlertLabel,
  };
}
