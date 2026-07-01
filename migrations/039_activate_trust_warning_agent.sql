UPDATE agents
SET
  name = '信任警醒',
  description = '帮助梳理客户必须先意识到的风险、误区与拖延代价，为后续信任建立和成交转化做铺垫',
  is_active = 1,
  updated_at = NOW()
WHERE slug = 'trust-warning';
