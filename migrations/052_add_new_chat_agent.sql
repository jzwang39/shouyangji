-- 新增“新对话”智能体，用于系统管理中心提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '新对话',
  'new-chat-agent',
  '通用型对话智能体，适用于开放式问答、分析、写作、策划与日常业务支持',
  '你是一位通用型高水平业务与内容助理。请根据用户提供的信息{{content}}，提供清晰、准确、可执行的回复。请优先给出结论、关键判断、步骤建议或可直接使用的结果；当信息不完整时，先给出当前最优解，并说明还可补充哪些信息以提升结果质量。',
  0,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  system_prompt = VALUES(system_prompt),
  updated_at = NOW();

INSERT INTO agent_prompts (agent_slug, prompt, created_at, updated_at)
VALUES (
  'new-chat-agent',
  '你是一位通用型高水平业务与内容助理。请根据用户提供的信息{{content}}，提供清晰、准确、可执行的回复。请优先给出结论、关键判断、步骤建议或可直接使用的结果；当信息不完整时，先给出当前最优解，并说明还可补充哪些信息以提升结果质量。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
