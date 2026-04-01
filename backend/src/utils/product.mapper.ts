import type { Product, UpdateProduct } from '../products/products.schema.js';
import type { ProductDB } from '../products/products.types.js';

export function mapProductDBToProduct(product: ProductDB): Product {
  return {
    id: product.id,
    codebar: product.codebar,
    name: product.name,
    brand: product.brand,
    category: product.category,
    salePrice: product.sale_price,
    purchasePrice: product.purchase_price,
  };
}

export function mapProductToProductDB(
  product: UpdateProduct,
): Partial<Omit<ProductDB, 'id'>> {
  return {
    codebar: product.codebar,
    name: product.name,
    brand: product.brand,
    category: product.category,
    sale_price: product.salePrice,
    purchase_price: product.purchasePrice,
  };
}
