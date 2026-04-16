import type { Product, UpdateProduct } from '../products/products.schema.js';
import type { ProductDB } from '../products/products.types.js';

export function mapProductDBToProduct(product: ProductDB): Product {
  return {
    id: product.id,
    codebar: product.codebar,
    name: product.name,
    brandId: product.brand_id,
    categoryId: product.category_id,
    salePrice: product.sale_price,
    purchasePrice: product.purchase_price,
    stock: product.stock,
    isActive: product.is_active,
  };
}

export function mapProductToProductDB(
  product: UpdateProduct,
): Partial<Omit<ProductDB, 'id'>> {
  return {
    codebar: product.codebar,
    name: product.name,
    brand_id: product.brandId,
    category_id: product.categoryId,
    sale_price: product.salePrice,
    purchase_price: product.purchasePrice,
    stock: product.stock,
    is_active: product.isActive,
  };
}
