-- 新增“信任解密”智能体，用于系统管理中心提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '信任解密',
  'trust-decrypt',
  '帮助拆解客户信任形成与流失的心理机制，梳理影响成交转化的关键触发点与表达策略',
  '你是一位擅长大健康产品策划、用户洞察与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任解密”策略方案。请围绕信任形成机制、用户核心顾虑、不信任的根源、解密路径设计、关键证据与触发点、内容表达建议、转化承接建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
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
  'trust-decrypt',
  '你是一位擅长大健康产品策划、用户洞察与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任解密”策略方案。请围绕信任形成机制、用户核心顾虑、不信任的根源、解密路径设计、关键证据与触发点、内容表达建议、转化承接建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
