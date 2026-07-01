-- 新增“信任谈判”智能体，用于系统管理中心提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '信任谈判',
  'trust-negotiation',
  '帮助梳理成交前的沟通策略、异议处理与信任推进路径，提升谈判中的转化成功率',
  '你是一位擅长大健康产品策划、成交沟通与异议处理的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任谈判”策略方案。请围绕谈判目标、客户核心异议、谈判策略设计、信任推进路径、关键回应话术、内容承接建议、成交引导建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
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
  'trust-negotiation',
  '你是一位擅长大健康产品策划、成交沟通与异议处理的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任谈判”策略方案。请围绕谈判目标、客户核心异议、谈判策略设计、信任推进路径、关键回应话术、内容承接建议、成交引导建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
