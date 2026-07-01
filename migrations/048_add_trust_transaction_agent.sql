-- 新增“信任成交”智能体，用于系统管理中心提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '信任成交',
  'trust-transaction',
  '帮助梳理临门成交阶段的信任推进、异议化解与转化收口策略，提升最终成交率',
  '你是一位擅长大健康产品策划、成交设计与转化促进的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任成交”策略方案。请围绕成交目标、客户核心顾虑、成交策略设计、信任推进路径、关键成交话术、内容承接建议、转化收口建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
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
  'trust-transaction',
  '你是一位擅长大健康产品策划、成交设计与转化促进的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任成交”策略方案。请围绕成交目标、客户核心顾虑、成交策略设计、信任推进路径、关键成交话术、内容承接建议、转化收口建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
