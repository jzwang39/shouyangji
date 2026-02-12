ALTER TABLE agent_results
  DROP INDEX uk_agent_results_unique,
  ADD UNIQUE KEY uk_agent_results_unique (product_name, agent_name, lesson_count, operator_user_id);

