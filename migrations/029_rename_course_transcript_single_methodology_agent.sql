-- 将课程逐字稿「单方法论」重命名为课程逐字稿「产品系列」
UPDATE agents
SET
  name = '课程逐字稿「产品系列」',
  updated_at = NOW()
WHERE slug = 'course-transcript-single-methodology';

UPDATE agent_results
SET
  agent_name = '课程逐字稿「产品系列」',
  updated_at = CURRENT_TIMESTAMP
WHERE agent_name = '课程逐字稿「单方法论」';
