UPDATE agents
SET
  name = '信任产品',
  description = '帮助梳理产品价值、可信依据与差异化表达，建立客户对产品本身的信任并承接转化',
  is_active = 1,
  updated_at = NOW()
WHERE slug = 'trust-product';
