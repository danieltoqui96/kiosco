import type { Product, UpdateProduct } from '../products/products.schema.js';
import type { ProductReadDB, ProductWriteDB } from '../products/products.types.js';

export function mapProductDBToProduct(product: ProductReadDB): Product {
  return {
    id: product.id,
    codebar: product.codebar,
    name: product.name,
    brand: product.brand,
    category: product.category,
    salePrice: product.sale_price,
    purchasePrice: product.purchase_price,
    stock: product.stock,
    isActive: product.is_active,
  };
}

export function mapProductToProductDB(
  product: UpdateProduct,
): Partial<Omit<ProductWriteDB, 'id'>> {
  return {
    codebar: product.codebar,
    name: product.name,
    sale_price: product.salePrice,
    purchase_price: product.purchasePrice,
    stock: product.stock,
    is_active: product.isActive,
  };
}
