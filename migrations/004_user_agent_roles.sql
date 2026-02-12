CREATE TABLE IF NOT EXISTS user_agent_roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_agent_roles_user (user_id),
  KEY idx_user_agent_roles_role (role_id),
  CONSTRAINT fk_user_agent_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_agent_roles_role FOREIGN KEY (role_id) REFERENCES agent_roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

