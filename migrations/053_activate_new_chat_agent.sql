UPDATE agents
SET
  name = '新对话',
  description = '通用型对话智能体，适用于开放式问答、分析、写作、策划与日常业务支持',
  is_active = 1,
  updated_at = NOW()
WHERE slug = 'new-chat-agent';
