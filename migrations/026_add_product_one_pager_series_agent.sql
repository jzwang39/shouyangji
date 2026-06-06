-- 添加产品一页纸（产品系列）智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '产品一页纸（产品系列）',
  'product-one-pager-series',
  '帮助梳理产品系列的整体定位、结构、核心卖点和应用场景',
  '请根据我提供的产品系列相关信息{{content}}，输出一份结构清晰的“产品一页纸（产品系列）”内容。

要求：
1. 站在产品策划与市场表达的视角，提炼该产品系列的整体定位。
2. 说明该系列包含的核心产品方向、适用人群、典型场景与差异化价值。
3. 内容要适合直接用于内部策划、销售培训或后续智能体引用。
4. 表达清晰、结构完整、避免空泛描述。

建议输出结构：
一、产品系列名称
二、产品系列定位
三、目标用户
四、核心需求与痛点
五、系列核心卖点
六、产品矩阵或产品分层
七、典型使用场景
八、成交与传播关键词
九、总结

结果控制在3000字以内。',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  system_prompt = VALUES(system_prompt),
  is_active = VALUES(is_active),
  updated_at = NOW();

-- 在agent_prompts表中添加对应的提示词记录
INSERT INTO agent_prompts (agent_slug, prompt, created_at, updated_at)
VALUES (
  'product-one-pager-series',
  '请根据我提供的产品系列相关信息{{content}}，输出一份结构清晰的“产品一页纸（产品系列）”内容。

要求：
1. 站在产品策划与市场表达的视角，提炼该产品系列的整体定位。
2. 说明该系列包含的核心产品方向、适用人群、典型场景与差异化价值。
3. 内容要适合直接用于内部策划、销售培训或后续智能体引用。
4. 表达清晰、结构完整、避免空泛描述。

建议输出结构：
一、产品系列名称
二、产品系列定位
三、目标用户
四、核心需求与痛点
五、系列核心卖点
六、产品矩阵或产品分层
七、典型使用场景
八、成交与传播关键词
九、总结

结果控制在3000字以内。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  prompt = VALUES(prompt),
  updated_at = NOW();
