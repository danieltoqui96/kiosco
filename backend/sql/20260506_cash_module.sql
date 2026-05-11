CREATE TABLE IF NOT EXISTS cash_daily_balances (
  day_date DATE NOT NULL,
  initial_cash INT NOT NULL DEFAULT 0,
  initial_card INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (day_date)
);

CREATE TABLE IF NOT EXISTS cash_withdrawals (
  id INT NOT NULL AUTO_INCREMENT,
  day_date DATE NOT NULL,
  movement_type ENUM('in', 'out') NOT NULL DEFAULT 'out',
  payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash',
  amount INT NOT NULL,
  reason ENUM('purchase', 'deposit', 'change', 'other') NOT NULL DEFAULT 'other',
  reference VARCHAR(100) NULL,
  note VARCHAR(255) NULL,
  voided_at DATETIME NULL,
  voided_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cash_withdrawals_day (day_date),
  KEY idx_cash_withdrawals_type (movement_type),
  KEY idx_cash_withdrawals_method (payment_method),
  KEY idx_cash_withdrawals_voided (voided_at)
);
