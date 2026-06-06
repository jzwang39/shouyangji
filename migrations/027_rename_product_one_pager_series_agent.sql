-- 将产品一页纸（产品系列）重命名为产品一页纸「产品系列」
UPDATE agents
SET
  name = '产品一页纸「产品系列」',
  system_prompt = REPLACE(
    system_prompt,
    '产品一页纸（产品系列）',
    '产品一页纸「产品系列」'
  ),
  updated_at = NOW()
WHERE slug = 'product-one-pager-series';

UPDATE agent_prompts
SET
  prompt = REPLACE(
    prompt,
    '产品一页纸（产品系列）',
    '产品一页纸「产品系列」'
  ),
  updated_at = NOW()
WHERE agent_slug = 'product-one-pager-series';
