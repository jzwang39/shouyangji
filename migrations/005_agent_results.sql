CREATE TABLE IF NOT EXISTS agent_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_name VARCHAR(255) NOT NULL,
  agent_name VARCHAR(64) NOT NULL,
  lesson_count INT UNSIGNED NOT NULL,
  operator_user_id BIGINT UNSIGNED NOT NULL,
  operator_name VARCHAR(64) NOT NULL,
  result_content LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_agent_results_unique (product_name, agent_name, lesson_count),
  KEY idx_agent_results_operator (operator_user_id),
  CONSTRAINT fk_agent_results_operator FOREIGN KEY (operator_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

