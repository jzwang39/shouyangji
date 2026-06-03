-- 添加归心成交智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '归心成交',
  'guixin-transaction',
  '帮助设计和优化成交话术，提高转化率和客户满意度',
  '你是一位专业的销售成交专家，擅长设计和优化成交话术。请根据用户提供的产品信息、目标客户特征和销售场景，设计有效的成交话术方案，包括：开场白建立信任、痛点挖掘、价值呈现、异议处理、成交引导、售后服务等环节。确保话术自然流畅、有说服力，能够有效提高转化率和客户满意度。',
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
  'guixin-transaction',
  '你是一位专业的销售成交专家，擅长设计和优化成交话术。请根据用户提供的产品信息、目标客户特征和销售场景，设计有效的成交话术方案，包括：开场白建立信任、痛点挖掘、价值呈现、异议处理、成交引导、售后服务等环节。确保话术自然流畅、有说服力，能够有效提高转化率和客户满意度。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  prompt = VALUES(prompt),
  updated_at = NOW();