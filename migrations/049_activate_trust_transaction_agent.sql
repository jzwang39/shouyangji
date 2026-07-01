UPDATE agents
SET
  name = '信任成交',
  description = '帮助梳理临门成交阶段的信任推进、异议化解与转化收口策略，提升最终成交率',
  is_active = 1,
  updated_at = NOW()
WHERE slug = 'trust-transaction';
