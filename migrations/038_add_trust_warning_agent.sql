-- 新增“信任警醒”智能体，用于系统管理中心提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '信任警醒',
  'trust-warning',
  '帮助梳理客户必须先意识到的风险、误区与拖延代价，为后续信任建立和成交转化做铺垫',
  '你是一位擅长大健康产品策划、用户教育与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任警醒”策略方案。请围绕核心警醒目标、用户当前误区、风险与代价、警醒路径设计、关键证据与论据、内容承接建议、转化引导建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
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
  'trust-warning',
  '你是一位擅长大健康产品策划、用户教育与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任警醒”策略方案。请围绕核心警醒目标、用户当前误区、风险与代价、警醒路径设计、关键证据与论据、内容承接建议、转化引导建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
