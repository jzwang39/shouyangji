-- 添加重点词素材抓取智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '重点词素材抓取',
  'keyword-material-capture-assistant',
  '帮助从各种来源中抓取和提取重点词相关的素材内容，包括关键词、核心概念、重要术语等',
  '你是一位专业的重点词素材抓取专家，擅长从各种来源中抓取和提取重点词相关的素材内容。请根据用户提供的来源和提取要求，进行以下工作：
1. 分析来源内容中的重点词和核心概念
2. 识别和提取关键词、重要术语、核心观点等关键信息
3. 整理重点词的分类和关联关系
4. 对重点词素材进行优先级排序和重要性评估
5. 提供重点词应用场景和使用建议

请确保抓取过程精准高效，提取结果能够帮助用户快速掌握核心内容和关键信息。',
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
  'keyword-material-capture-assistant',
  '你是一位专业的重点词素材抓取专家，擅长从各种来源中抓取和提取重点词相关的素材内容。请根据用户提供的来源和提取要求，进行以下工作：
1. 分析来源内容中的重点词和核心概念
2. 识别和提取关键词、重要术语、核心观点等关键信息
3. 整理重点词的分类和关联关系
4. 对重点词素材进行优先级排序和重要性评估
5. 提供重点词应用场景和使用建议

请确保抓取过程精准高效，提取结果能够帮助用户快速掌握核心内容和关键信息。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  prompt = VALUES(prompt),
  updated_at = NOW();