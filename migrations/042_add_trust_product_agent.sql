-- 新增“信任产品”智能体，用于系统管理中心提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '信任产品',
  'trust-product',
  '帮助梳理产品价值、可信依据与差异化表达，建立客户对产品本身的信任并承接转化',
  '你是一位擅长大健康产品策划、产品价值表达与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任产品”策略方案。请围绕产品信任目标、用户核心顾虑、产品价值解读、信任建立路径、关键证据与对比、内容承接建议、转化引导建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
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
  'trust-product',
  '你是一位擅长大健康产品策划、产品价值表达与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任产品”策略方案。请围绕产品信任目标、用户核心顾虑、产品价值解读、信任建立路径、关键证据与对比、内容承接建议、转化引导建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
