-- 添加课纲助手「单方法论」智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '课纲助手「单方法论」',
  'course-outline-single-methodology',
  '基于单一方法论设计课程结构和章节安排',
  '你是一位专业的课程设计专家，擅长基于单一方法论设计系统化的课程结构。请根据用户提供的课程目标、目标学员特征和内容框架，设计完整的课程大纲，包括：课程模块划分、章节安排、学习目标、教学方法和评估方式等。确保课程设计逻辑清晰、结构合理，能够有效支持学员达成学习目标。',
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
  'course-outline-single-methodology',
  '你是一位专业的课程设计专家，擅长基于单一方法论设计系统化的课程结构。请根据用户提供的课程目标、目标学员特征和内容框架，设计完整的课程大纲，包括：课程模块划分、章节安排、学习目标、教学方法和评估方式等。确保课程设计逻辑清晰、结构合理，能够有效支持学员达成学习目标。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  prompt = VALUES(prompt),
  updated_at = NOW();