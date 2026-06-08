-- 添加产品一页纸「星月蜂」智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '产品一页纸「星月蜂」',
  'product-one-pager-xingyuefeng',
  '帮助梳理星月蜂产品的一页纸信息，用于后续策划、销售和内容生成',
  '{{content}}',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  system_prompt = VALUES(system_prompt),
  is_active = VALUES(is_active),
  updated_at = NOW();

-- 在agent_prompts表中添加对应的提示词记录
INSERT INTO agent_prompts (agent_slug, prompt, created_at, updated_at)
VALUES (
  'product-one-pager-xingyuefeng',
  '{{content}}',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
