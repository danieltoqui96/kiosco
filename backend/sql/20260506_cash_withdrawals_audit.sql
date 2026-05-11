SET @has_reason := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'cash_withdrawals'
    AND column_name = 'reason'
);

SET @sql := IF(
  @has_reason = 0,
  "ALTER TABLE cash_withdrawals ADD COLUMN reason ENUM('purchase', 'deposit', 'change', 'other') NOT NULL DEFAULT 'other'",
  "SELECT 'reason already exists' AS msg"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_movement_type := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'cash_withdrawals'
    AND column_name = 'movement_type'
);

SET @sql := IF(
  @has_movement_type = 0,
  "ALTER TABLE cash_withdrawals ADD COLUMN movement_type ENUM('in', 'out') NOT NULL DEFAULT 'out'",
  "SELECT 'movement_type already exists' AS msg"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_reference := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'cash_withdrawals'
    AND column_name = 'reference'
);

SET @sql := IF(
  @has_reference = 0,
  "ALTER TABLE cash_withdrawals ADD COLUMN reference VARCHAR(100) NULL",
  "SELECT 'reference already exists' AS msg"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_voided_at := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'cash_withdrawals'
    AND column_name = 'voided_at'
);

SET @sql := IF(
  @has_voided_at = 0,
  "ALTER TABLE cash_withdrawals ADD COLUMN voided_at DATETIME NULL",
  "SELECT 'voided_at already exists' AS msg"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_voided_reason := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'cash_withdrawals'
    AND column_name = 'voided_reason'
);

SET @sql := IF(
  @has_voided_reason = 0,
  "ALTER TABLE cash_withdrawals ADD COLUMN voided_reason VARCHAR(255) NULL",
  "SELECT 'voided_reason already exists' AS msg"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
