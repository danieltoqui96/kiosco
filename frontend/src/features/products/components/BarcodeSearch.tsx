import type { FormEvent } from 'react';

interface BarcodeSearchProps {
  value: string;
  placeholder?: string;
  isLoading?: boolean;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
}

export const BarcodeSearch = ({
  value,
  placeholder = 'Escanear codigo de barras o buscar producto...',
  isLoading = false,
  onChange,
  onSearch,
}: BarcodeSearchProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(value.trim());
  };

  return (
    <section className="barcode-scanner">
      <form className="scanner-container" onSubmit={handleSubmit}>
        <div className="scanner-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
            <line x1="7" y1="12" x2="17" y2="12"></line>
          </svg>
        </div>

        <input
          type="text"
          className="scanner-input"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Barcode or product search"
        />

        <button type="submit" className="scanner-btn" disabled={isLoading}>
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className="scanner-hint">
        Presiona Enter para buscar o escanea el codigo de barras del producto.
      </div>
    </section>
  );
};
