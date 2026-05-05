ALTER TABLE sales
ADD COLUMN IF NOT EXISTS payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash' AFTER sold_at;

CREATE TABLE IF NOT EXISTS cashbox_balances (
  id TINYINT NOT NULL,
  cash_balance INT NOT NULL DEFAULT 0,
  card_balance INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO cashbox_balances (id, cash_balance, card_balance)
SELECT
  1 AS id,
  COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_sale ELSE 0 END), 0) AS cash_balance,
  COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total_sale ELSE 0 END), 0) AS card_balance
FROM sales
ON DUPLICATE KEY UPDATE
  cash_balance = VALUES(cash_balance),
  card_balance = VALUES(card_balance),
  updated_at = CURRENT_TIMESTAMP;
