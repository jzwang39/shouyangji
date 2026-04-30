SET @course_rules_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'course_rules'
);

SET @has_name := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'course_rules'
    AND COLUMN_NAME = 'name'
);

SET @has_rule_name := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'course_rules'
    AND COLUMN_NAME = 'rule_name'
);

SET @sql := IF(
  @course_rules_exists = 1 AND @has_name = 1 AND @has_rule_name = 0,
  'ALTER TABLE course_rules CHANGE COLUMN `name` `rule_name` VARCHAR(255) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  @course_rules_exists = 1 AND @has_name = 1 AND @has_rule_name = 1,
  'UPDATE course_rules SET rule_name = CASE WHEN rule_name IS NULL OR rule_name = '''' THEN `name` ELSE rule_name END',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  @course_rules_exists = 1 AND @has_name = 1 AND @has_rule_name = 1,
  'ALTER TABLE course_rules DROP COLUMN `name`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
