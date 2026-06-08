-- 添加课纲助手「星月蜂」智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '课纲助手「星月蜂」',
  'course-outline-xingyuefeng',
  '帮助设计星月蜂产品相关课程的结构、章节安排和课纲内容',
  '请根据我提供的星月蜂产品信息、课程目标、学员画像和内容方向，设计一份结构清晰、逻辑完整的课程大纲。输出时请包含课程阶段、节次安排、每节课的目标和核心内容要点，确保整体节奏合理，适合后续逐字稿扩写与销售场景使用。',
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
  'course-outline-xingyuefeng',
  '请根据我提供的星月蜂产品信息、课程目标、学员画像和内容方向，设计一份结构清晰、逻辑完整的课程大纲。输出时请包含课程阶段、节次安排、每节课的目标和核心内容要点，确保整体节奏合理，适合后续逐字稿扩写与销售场景使用。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
