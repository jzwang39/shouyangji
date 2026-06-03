-- 添加课程逐字稿「单方法论」智能体
INSERT INTO agents (name, slug, description, system_prompt, is_active, created_at, updated_at)
VALUES (
  '课程逐字稿「单方法论」',
  'course-transcript-single-methodology',
  '基于单一方法论将课程大纲扩展为逐字稿内容',
  '根据输入的定位信息{{dingwei}}，产品信息{{chanpin}}、四件事儿{{shijianshi}}、九宫格{{jiugongge}}、四件事和九宫格的关系{{guanxi}}，按照每一节产品课程大纲（带12步结构）{{kegang}}的内容框架，基于单一方法论扩写成一个60分钟的课程话术稿。
其中{{lastkegang}}是上一节课的内容，注意扩写本节内容的时候流畅衔接。
扩写的内容中如果遇到案例、数据，要保证真实有效，有出处，不能编造。
  
结果控制在8000个字左右。',
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
  'course-transcript-single-methodology',
  '根据输入的定位信息{{dingwei}}，产品信息{{chanpin}}、四件事儿{{shijianshi}}、九宫格{{jiugongge}}、四件事和九宫格的关系{{guanxi}}，按照每一节产品课程大纲（带12步结构）{{kegang}}的内容框架，基于单一方法论扩写成一个60分钟的课程话术稿。
其中{{lastkegang}}是上一节课的内容，注意扩写本节内容的时候流畅衔接。
扩写的内容中如果遇到案例、数据，要保证真实有效，有出处，不能编造。
  
结果控制在8000个字左右。',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  prompt = VALUES(prompt),
  updated_at = NOW();