SET @has_payment_method := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'sales'
    AND column_name = 'payment_method'
);

SET @sql := IF(
  @has_payment_method = 0,
  "ALTER TABLE sales ADD COLUMN payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash'",
  "SELECT 'payment_method already exists' AS msg"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
