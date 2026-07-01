-- 确保“信任人设”智能体存在，并可在系统管理中心进行提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '信任人设',
  'trust-blueprint',
  '帮助梳理讲师与产品信任建立路径、强化背书与成交转化所需的人设策略',
  '你是一位擅长大健康产品策划、课程设计与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任人设”策略方案。请围绕信任目标、核心受众疑虑、人设定位、信任建立路径、关键背书与证据、内容承接建议、成交转化建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = 1,
  system_prompt = CASE
    WHEN TRIM(COALESCE(system_prompt, '')) = '' THEN VALUES(system_prompt)
    ELSE system_prompt
  END,
  updated_at = NOW();

INSERT INTO agent_prompts (agent_slug, prompt, created_at, updated_at)
VALUES (
  'trust-blueprint',
  '你是一位擅长大健康产品策划、课程设计与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任人设”策略方案。请围绕信任目标、核心受众疑虑、人设定位、信任建立路径、关键背书与证据、内容承接建议、成交转化建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = CASE
    WHEN TRIM(COALESCE(prompt, '')) = '' THEN VALUES(prompt)
    ELSE prompt
  END,
  updated_at = NOW();
