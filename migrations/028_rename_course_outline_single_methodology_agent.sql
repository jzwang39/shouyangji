-- 将课纲助手「单方法论」重命名为课纲助手「产品系列」
UPDATE agents
SET
  name = '课纲助手「产品系列」',
  updated_at = NOW()
WHERE slug = 'course-outline-single-methodology';

UPDATE agent_results
SET
  agent_name = '课纲助手「产品系列」',
  updated_at = CURRENT_TIMESTAMP
WHERE agent_name = '课纲助手「单方法论」';
