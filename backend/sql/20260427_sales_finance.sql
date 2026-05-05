CREATE TABLE IF NOT EXISTS sales (
  id INT NOT NULL AUTO_INCREMENT,
  sold_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash',
  items_count INT NOT NULL,
  total_sale INT NOT NULL,
  total_cost INT NOT NULL,
  profit INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sales_sold_at (sold_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sale_items (
  id INT NOT NULL AUTO_INCREMENT,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  product_codebar VARCHAR(50) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  unit_sale_price INT NOT NULL,
  unit_purchase_price INT NOT NULL,
  line_sale_total INT NOT NULL,
  line_cost_total INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sale_items_sale_id (sale_id),
  KEY idx_sale_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cashbox_balances (
  id TINYINT NOT NULL,
  cash_balance INT NOT NULL DEFAULT 0,
  card_balance INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO cashbox_balances (id, cash_balance, card_balance)
VALUES (1, 0, 0)
ON DUPLICATE KEY UPDATE id = id;
