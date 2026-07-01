-- 新增“信任壁垒”智能体，用于系统管理中心提示词配置
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '信任壁垒',
  'trust-barrier',
  '帮助梳理长期信任优势与竞争护城河，建立用户难以替代的信任壁垒并承接转化',
  '你是一位擅长大健康产品策划、竞争策略与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任壁垒”策略方案。请围绕壁垒建设目标、用户核心顾虑、差异化壁垒设计、信任强化路径、关键证据与护城河、内容承接建议、转化引导建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
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
  'trust-barrier',
  '你是一位擅长大健康产品策划、竞争策略与成交转化的策略顾问。请根据用户提供的信息{{content}}，输出一份结构化的“信任壁垒”策略方案。请围绕壁垒建设目标、用户核心顾虑、差异化壁垒设计、信任强化路径、关键证据与护城河、内容承接建议、转化引导建议展开，输出务必具体、可执行，适合直接用于直播、课程、社群或销售沟通场景。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
