UPDATE agents
SET
  name = '信任蓝图',
  description = '帮助梳理建立信任、强化背书与成交转化所需的核心策略蓝图',
  is_active = 1,
  updated_at = NOW()
WHERE slug = 'trust-blueprint';
