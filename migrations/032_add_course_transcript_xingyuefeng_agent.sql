-- 添加课程逐字稿「星月蜂」智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '课程逐字稿「星月蜂」',
  'course-transcript-xingyuefeng',
  '帮助将星月蜂相关课程大纲扩写为完整逐字稿，用于授课和销售表达',
  '请根据我提供的星月蜂产品信息、课程大纲、课程目标和授课场景，将对应课程内容扩写成结构清晰、表达自然、适合实际授课的逐字稿。输出时注意逻辑衔接、重点突出，并兼顾口语化表达与成交引导。',
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
  'course-transcript-xingyuefeng',
  '请根据我提供的星月蜂产品信息、课程大纲、课程目标和授课场景，将对应课程内容扩写成结构清晰、表达自然、适合实际授课的逐字稿。输出时注意逻辑衔接、重点突出，并兼顾口语化表达与成交引导。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
