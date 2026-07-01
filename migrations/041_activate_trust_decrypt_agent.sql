UPDATE agents
SET
  name = '信任解密',
  description = '帮助拆解客户信任形成与流失的心理机制，梳理影响成交转化的关键触发点与表达策略',
  is_active = 1,
  updated_at = NOW()
WHERE slug = 'trust-decrypt';
