-- 将课程逐字稿智能体名称更新为课程逐字稿「多方法论」
UPDATE agents
SET name = '课程逐字稿「多方法论」'
WHERE slug = 'course-transcript';

-- 更新agent_results表中的历史数据，将agent_name从'课程逐字稿'或'课程'更新为'课程逐字稿「多方法论」'
UPDATE agent_results
SET agent_name = '课程逐字稿「多方法论」'
WHERE agent_name IN ('课程逐字稿', '课程');