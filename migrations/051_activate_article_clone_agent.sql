UPDATE agents
SET
  name = '文章克隆',
  description = '帮助拆解原文风格并完成高相似风格迁移与重写，适用于文章仿写、风格克隆与内容再创作',
  is_active = 1,
  updated_at = NOW()
WHERE slug = 'article-clone';
