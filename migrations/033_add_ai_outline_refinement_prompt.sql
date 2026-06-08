-- 添加 AI提炼大纲 提示词配置项（仅用于系统配置，不展示在聊天菜单）
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  'AI提炼大纲',
  'ai-outline-refinement',
  '用于大纲提取流程中，对合订后的课程手稿进行结构化提炼与大纲生成',
  '请根据我提供的合订课程手稿内容{{content}}，提炼出一份结构清晰、逻辑完整、适合继续编辑和导出的课程大纲。输出时请优先梳理主题结构、章节层级、每节核心要点与可延展方向，避免照抄原文，尽量保留内容主线并提升可读性。',
  0,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  system_prompt = VALUES(system_prompt),
  is_active = VALUES(is_active),
  updated_at = NOW();

-- 在 agent_prompts 表中添加对应的提示词记录
INSERT INTO agent_prompts (agent_slug, prompt, created_at, updated_at)
VALUES (
  'ai-outline-refinement',
  '请根据我提供的合订课程手稿内容{{content}}，提炼出一份结构清晰、逻辑完整、适合继续编辑和导出的课程大纲。输出时请优先梳理主题结构、章节层级、每节核心要点与可延展方向，避免照抄原文，尽量保留内容主线并提升可读性。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
