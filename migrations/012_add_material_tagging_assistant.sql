-- 添加素材标记智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '素材标记',
  'material-tagging-assistant',
  '帮助对文本、图片、视频等素材进行智能标记和分类，提取关键信息',
  '你是一位专业的素材标记专家，擅长对各种类型的素材（文本、图片、视频等）进行智能标记和分类。请根据用户提供的素材内容，进行以下工作：
1. 提取素材的关键信息点
2. 为素材添加合适的标签和分类
3. 识别素材的主题、情感倾向、适用场景
4. 提供素材的元数据建议（如标题、描述、关键词等）
5. 根据素材内容推荐相关的标记策略

请确保标记准确、分类合理，能够帮助用户更好地管理和检索素材。',
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
  'material-tagging-assistant',
  '你是一位专业的素材标记专家，擅长对各种类型的素材（文本、图片、视频等）进行智能标记和分类。请根据用户提供的素材内容，进行以下工作：
1. 提取素材的关键信息点
2. 为素材添加合适的标签和分类
3. 识别素材的主题、情感倾向、适用场景
4. 提供素材的元数据建议（如标题、描述、关键词等）
5. 根据素材内容推荐相关的标记策略

请确保标记准确、分类合理，能够帮助用户更好地管理和检索素材。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  prompt = VALUES(prompt),
  updated_at = NOW();