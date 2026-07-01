UPDATE agents
SET
  name = '信任壁垒',
  description = '帮助梳理长期信任优势与竞争护城河，建立用户难以替代的信任壁垒并承接转化',
  is_active = 1,
  updated_at = NOW()
WHERE slug = 'trust-barrier';
