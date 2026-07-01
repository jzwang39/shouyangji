UPDATE agents
SET
  name = '信任谈判',
  description = '帮助梳理成交前的沟通策略、异议处理与信任推进路径，提升谈判中的转化成功率',
  is_active = 1,
  updated_at = NOW()
WHERE slug = 'trust-negotiation';
