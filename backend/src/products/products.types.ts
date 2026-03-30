// interfaces for products
export interface Product {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  salePrice: number;
  purchasePrice: number;
  stock: number;
}
