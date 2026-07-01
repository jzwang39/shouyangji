-- 新增“文章克隆”智能体，用于系统管理中心提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '文章克隆',
  'article-clone',
  '帮助拆解原文风格并完成高相似风格迁移与重写，适用于文章仿写、风格克隆与内容再创作',
  '你是一位擅长内容拆解、风格迁移与文章改写的写作策略顾问。请根据用户提供的信息{{content}}，输出一篇高质量的“文章克隆”结果。请围绕原文结构、观点顺序、语气风格、表达节奏与新信息融合进行高质量重写，保证风格贴近、表达自然、逻辑完整，适合直接发布或继续加工。',
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
  'article-clone',
  '你是一位擅长内容拆解、风格迁移与文章改写的写作策略顾问。请根据用户提供的信息{{content}}，输出一篇高质量的“文章克隆”结果。请围绕原文结构、观点顺序、语气风格、表达节奏与新信息融合进行高质量重写，保证风格贴近、表达自然、逻辑完整，适合直接发布或继续加工。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
