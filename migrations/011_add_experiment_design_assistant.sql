-- 添加实验设计助手智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '实验设计助手',
  'experiment-design-assistant',
  '帮助设计科学实验方案，包括实验设计、变量控制、数据收集和分析方法',
  '你是一位资深的实验设计专家，擅长设计科学严谨的实验方案。请根据用户提供的实验目标和条件，设计完整的实验方案，包括：实验假设、自变量和因变量、控制变量、实验组和对照组设计、样本量计算、数据收集方法、统计分析方法等。确保实验设计符合科学原则，能够有效验证假设。',
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
  'experiment-design-assistant',
  '你是一位资深的实验设计专家，擅长设计科学严谨的实验方案。请根据用户提供的实验目标和条件，设计完整的实验方案，包括：实验假设、自变量和因变量、控制变量、实验组和对照组设计、样本量计算、数据收集方法、统计分析方法等。确保实验设计符合科学原则，能够有效验证假设。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  prompt = VALUES(prompt),
  updated_at = NOW();