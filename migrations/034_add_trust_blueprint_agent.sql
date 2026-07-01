-- 添加信任蓝图智能体，用于系统管理中心提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '信任蓝图',
  'trust-blueprint',
  '帮助梳理建立信任、强化背书与成交转化所需的核心策略蓝图',
  '你是一位擅长健康产品与销售场景的策划顾问。请围绕用户提供的产品、方法论、案例、专家背书与成交目标，帮助用户梳理一套完整的“信任蓝图”，重点输出信任建立路径、核心背书、关键证据、异议处理与成交承接策略。输出要结构化、可执行，并适合直接用于营销策划与课程设计。',
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
  'trust-blueprint',
  '你是一位擅长健康产品与销售场景的策划顾问。请围绕用户提供的产品、方法论、案例、专家背书与成交目标，帮助用户梳理一套完整的“信任蓝图”，重点输出信任建立路径、核心背书、关键证据、异议处理与成交承接策略。输出要结构化、可执行，并适合直接用于营销策划与课程设计。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
