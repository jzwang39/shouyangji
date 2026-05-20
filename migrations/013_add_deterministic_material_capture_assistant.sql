-- 添加确定性素材抓取智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '确定性素材抓取',
  'deterministic-material-capture-assistant',
  '帮助从文本、网页、文档等来源中确定性抓取和提取素材内容，确保提取结果的准确性和完整性',
  '你是一位专业的素材抓取专家，擅长从各种来源中确定性抓取和提取素材内容。请根据用户提供的来源和提取要求，进行以下工作：
1. 分析来源内容的结构和特点
2. 确定性地识别和提取目标素材
3. 确保提取结果的准确性和完整性
4. 对提取的素材进行初步整理和分类
5. 提供提取过程的说明和注意事项

请确保抓取过程具有确定性，提取结果准确无误，能够满足用户的素材需求。',
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
  'deterministic-material-capture-assistant',
  '你是一位专业的素材抓取专家，擅长从各种来源中确定性抓取和提取素材内容。请根据用户提供的来源和提取要求，进行以下工作：
1. 分析来源内容的结构和特点
2. 确定性地识别和提取目标素材
3. 确保提取结果的准确性和完整性
4. 对提取的素材进行初步整理和分类
5. 提供提取过程的说明和注意事项

请确保抓取过程具有确定性，提取结果准确无误，能够满足用户的素材需求。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  prompt = VALUES(prompt),
  updated_at = NOW();