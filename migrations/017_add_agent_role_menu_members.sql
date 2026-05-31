CREATE TABLE IF NOT EXISTS agent_role_menu_members (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id INT UNSIGNED NOT NULL,
  menu_key VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_agent_role_menu_members_role_menu (role_id, menu_key),
  KEY idx_agent_role_menu_members_role (role_id),
  CONSTRAINT fk_agent_role_menu_members_role FOREIGN KEY (role_id) REFERENCES agent_roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
