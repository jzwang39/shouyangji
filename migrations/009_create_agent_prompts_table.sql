CREATE TABLE IF NOT EXISTS agent_prompts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  agent_slug VARCHAR(64) NOT NULL,
  prompt LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_agent_prompts_slug (agent_slug),
  CONSTRAINT fk_agent_prompts_agent_slug FOREIGN KEY (agent_slug) REFERENCES agents (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO agent_prompts (agent_slug, prompt)
SELECT slug, system_prompt
FROM agents
WHERE system_prompt IS NOT NULL AND system_prompt <> ''
ON DUPLICATE KEY UPDATE prompt = VALUES(prompt);
