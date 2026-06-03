-- 将定位助手智能体名称更新为定位助手「单一产品」
UPDATE agents
SET name = '定位助手「单一产品」'
WHERE slug = 'positioning-helper';

-- 更新agent_results表中的历史数据，将agent_name从'定位助手'或'定位'更新为'定位助手「单一产品」'
UPDATE agent_results
SET agent_name = '定位助手「单一产品」'
WHERE agent_name IN ('定位助手', '定位');