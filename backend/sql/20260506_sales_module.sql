CREATE TABLE IF NOT EXISTS sales (
  id INT NOT NULL AUTO_INCREMENT,
  sold_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash',
  items_count INT NOT NULL,
  total_sale INT NOT NULL,
  total_cost INT NOT NULL,
  profit INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sales_sold_at (sold_at)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INT NOT NULL AUTO_INCREMENT,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  product_codebar VARCHAR(50) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  brand_name VARCHAR(100) NOT NULL DEFAULT '',
  quantity INT NOT NULL,
  unit_price INT NOT NULL DEFAULT 0,
  unit_sale_price INT NOT NULL,
  unit_purchase_price INT NOT NULL,
  line_sale_total INT NOT NULL,
  line_cost_total INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sale_items_sale_id (sale_id),
  KEY idx_sale_items_product_id (product_id),
  CONSTRAINT fk_sale_items_sale
    FOREIGN KEY (sale_id)
    REFERENCES sales (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product
    FOREIGN KEY (product_id)
    REFERENCES products (id)
    ON DELETE RESTRICT
);
