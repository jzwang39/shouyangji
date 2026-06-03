const mysql = require('mysql2/promise');

async function updatePrompt() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'ai_app_user',
    password: process.env.DB_PASSWORD || 'ai_pass123',
    database: process.env.DB_NAME || 'ai_chat_app'
  });

  try {
    console.log('正在更新实验设计助手提示词配置...');
    
    const newPrompt = `你是一位专业的实验设计助手，专门帮助用户设计大健康产品的门店演示实验。

## 交互流程：
1. 当用户输入"开始"、"你好"等开场语时，输出欢迎语和产品信息表
2. 当用户提供产品信息时，立即整理信息并输出信息确认卡，然后询问实验方向
3. 当用户提供实验方向时，确认实验方向并等待用户最终确认
4. 当用户确认后，生成完整的实验操作手册

## 产品信息识别规则：
- 如果用户输入中包含"产品名称"、"成分"、"功效"等关键词
- 如果用户输入格式类似示例格式（使用冒号、破折号、方括号等分隔）
- 如果用户输入长度超过30个字符且包含产品相关信息
满足以上任一条件，就视为已提供产品信息，立即进入第二步

## 信息确认卡格式：
---
✅ 好的！我已收到您的产品信息，整理如下：

| 字段 | 内容 |
|------|------|
| 产品名称 | [用户填写的名称] |
| 核心成分 | [提炼关键成分及比例] |
| 产品功效 | [用户填写的功效] |
| 理论基础 | [用户填写的理论基础，简洁提炼] |
| 实验要求 | [用户填写的要求，若无则填"未指定，按通用标准设计"] |
---

基于以上产品信息，**下一步请告诉我您的实验方向**：

**方式一（推荐）**：您直接告诉我您想做哪几个实验，越具体越好。

> 例如：「我想做三个实验：① 小分子穿透实验 ② 快速充能实验 ③ 免疫激活实验」

**方式二**：如果您暂时没有具体想法，可以回复「**帮我设计**」，我来根据您的产品特性，为您推荐最适合的实验方向。

## 重要指令：
1. 禁止重复索要已经提供的信息
2. 用户输入中出现的括号、方括号、顿号、分号、长句描述都属于有效产品信息格式
3. 如果产品名称、成分、功效三项齐全，直接输出信息确认卡
4. 如果三项中有缺失，只追问缺失项，不要重复输出整个产品信息表`;

    // 更新agent_prompts表
    const [updateResult] = await connection.execute(
      `UPDATE agent_prompts 
       SET prompt = ?, updated_at = NOW()
       WHERE agent_slug = 'experiment-design-assistant'`,
      [newPrompt]
    );

    console.log(`agent_prompts表更新结果: ${updateResult.affectedRows} 行受影响`);

    // 更新agents表
    const [agentUpdateResult] = await connection.execute(
      `UPDATE agents 
       SET system_prompt = ?, updated_at = NOW()
       WHERE slug = 'experiment-design-assistant'`,
      [newPrompt]
    );

    console.log(`agents表更新结果: ${agentUpdateResult.affectedRows} 行受影响`);

    // 验证更新结果
    const [rows] = await connection.execute(
      `SELECT LENGTH(prompt) as prompt_length, LEFT(prompt, 300) as prompt_preview 
       FROM agent_prompts 
       WHERE agent_slug = 'experiment-design-assistant'`
    );

    console.log('\n更新后的提示词信息:');
    console.log(`长度: ${rows[0].prompt_length} 字符`);
    console.log(`预览: ${rows[0].prompt_preview}...`);

    console.log('\n✅ 实验设计助手提示词配置更新完成！');

  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await connection.end();
  }
}

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

updatePrompt().catch(console.error);