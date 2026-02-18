import { query } from "@/lib/db";

type AiSettings = {
  model_name: string;
  api_key: string;
};

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderTemplate(template: string, vars: Record<string, string>) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, "g");
    result = result.replace(pattern, value);
  }
  return result;
}

export function buildProductOnePagerPrompt(description: string) {
  return `${description}`;
}

export function buildFourThingsPrompt(content: string) {
  return `请你扮演一位世界顶级的健康产品销售专家，精通养生知识与营销心理学。你的核心任务是，根据我提供的产品信息${content}，严格遵循“四件事”黄金框架，生成一份具有极强说服力、能直接用于销售场景的完整话术。

**【必须遵守的输出规则】**
1.  **结构严格**：必须完整使用以下“四件事”的所有大标题、小标题和序号，不得遗漏或更改顺序。
2.  **语言风格**：话术需口语化、富有感染力，能引发危机感与渴望，并穿插互动指令（如“您不妨现在试试…”）。
3.  **内容填充**：请将我提供的产品信息，自然、流畅地嵌入到话术的对应部分。

**【产品信息】**
*   **产品名称**：[[请在此填写您的产品名称，例如：玄武固元丹]]
*   **核心成分/原理**：[[请在此填写核心成分与作用原理，例如：内含灵芝孢子粉与黄精萃取物，专注于培元固本]]
*   **专利技术/工艺**：[[请在此填写独特工艺，例如：采用“九蒸九晒”古法与现代低温萃取技术]]
*   **权威专家/背书**：[[请在此填写专家或机构背书，例如：得到国医大师张教授推荐]]
*   **原价与现价**：[[请在此填写价格策略，例如：原价1380一盒，今日体验价398元；购买6盒疗程装仅需1988元]]
*   **需要强调的案例**：[[请在此填写用户案例，例如：一位长期失眠的王女士，服用一周后睡眠质量显著改善]]

**【“四件事”黄金框架】**

**一、相信自己年老体衰是由于元气亏虚导致**
1.  **新闻数据**：引用官方媒体、医学期刊、专家观点，建立“元气亏虚致衰”的权威共识。
2.  **案例警示**：讲述因元气透支导致早衰、疾病或悲剧的名人、企业家案例（如张锐、李连杰、乔布斯等知名人士，最好举例6-7人），引发共鸣与危机感。
3.  **下定义**：通过正面榜样（如善于养生保健的素人、修行者、百岁国医大师）与反面案例对比，定义高质量的长寿，激发客户对健康晚年的向往。

**二、让客户意识到“我已经有了这个问题”，并产生恐惧，并强烈渴望现在解决**
4.  **三步法测试**：
    ① 自我测试（在网上寻找相关的问题所导致的身体症状进行现场测试）。
    ② 引用检测报告的可能性。
    ③ 详细列举“体衰”（心慌、记忆差、无力等）、“年老”（白发、老年斑等）、慢性病（三高、骨关节、各种慢性炎症等）症状，让客户对号入座。
5.  **下危机**：
    a. 使用视频/故事描绘“一人失能，全家失衡”的悲惨未来（如ICU、拖累子女）。
    b. 强调“人财两空”的风险。
6.  **推导公式**：清晰阐述“元气亏虚→年老体衰→症状→危害→生活不能自理→拖累子女→家破人亡”的逻辑链。

**三、让客户相信“只有我的产品能解决”**
1)  **临床数据**：强调产品针对“元气”的确切效果。
2)  **康复案例**：展示从“不能”到“能”的真实用户故事，重点讲述[[需要强调的案例]]。
3)  **专利技术**：突出[[专利技术/工艺]]的独特性和有效性。
4)  **权威专家**：引用[[权威专家/背书]]作为强大信任背书。
5)  **实验证明**：描述直观的实验效果（如热成像对比或其它例子）。
6)  **专家团队**：承诺专业的后续服务。
7)  **见效快**：强调“七天见效”，并说明原因（名医名方、道地药材、提取工艺）。
8)  **核心成分**：详细介绍[[核心成分/原理]]。
9)  **最高标准**：阐述取材与制药的高标准（如五方取材、天人合一）。
10) **排他性**：对比普通中药、补肾贴、西药、艾灸、药酒、劣质保健品等其他方法的弊端，突出本产品的安全、有效与性价比。
11) **奖项背书**：如非遗、老字号等。
12) **产地道地**：强调原料原产地。
13) **原理解析**：分三阶段阐述（搜索相关中医、现代营养学知识，通过举生动形象的例子、引用相关理论佐证此原理）。
14) **好评与复购**：引用名人或高复购率数据。
15) **塑造价格**：给出[[原价与现价]]的对比，塑造超高性价比。
16) **具体案例**：再次强化[[需要强调的案例]]等用户见证。

**四、让客户相信“今天买最便宜”**
*   **长期价值**：说明需按周期服用。
*   **初心**：讲述真诚的创业故事（如为了帮助自家老人）。
*   **稀缺性**：强调原料/产量有限，如“年产量仅够X万人”。
*   **优惠理由**：罗列各类荣誉与庆典（如非遗、周年庆、品牌强国计划等）作为降价理由。
*   **破价方案**：清晰解读[[原价与现价]]中的疗程优惠方案。
*   **赠品**：说明赠品内容（如健康评点服务）。
*   **限名额/限时间**：制造紧迫感。
*   **0风险承诺**：有问题可以随时拨打400电话。
*   **引导行动**：最后指令必须是：“[申请完了不要走，我来告诉您具体怎么吃效果最好！]”。

请根据以上所有信息，生成完整四件事儿结构，4件事儿一个都不能少，结果控制在3000个字以内。你的回复应以“**实现100%销售目标，让客户相信哪几件事**”开始。`;
}

export function buildNineGridPrompt(content: string) {
  return `## 角色
你是一名顶尖的健康产品销售专家，你既有中医药基础知识，熟知中医药历史、文化，同时还熟悉现代营养学，健康管理学，还有一定的心理学基础。请严格按照以下结构和要求生成销售话术。

## 指令要求：
1. 严格保持原始结构，包括所有大标题、小标题、序号层级
2. 保留所有案例、数据、故事、测试等具体内容框架
3. 仅替换【】中的产品相关信息
4. 语气要亲切自然，像对叔叔阿姨面对面讲话
5. 包含所有销售环节：蓝图描绘、好处展示、问题揭示、危机下探、解决方案、权威背书、案例证明、价格破冰

## 产品基本信息：
${content}

## 话术模板：

**用【核心技术】，解决【核心问题】，让您【核心好处】**

**一、要去哪儿（目标蓝图）**

各位叔叔阿姨，大家好！我是【讲师姓名】。我是【讲师头衔】。在健康管理领域，我已经摸爬滚打了十几年。这些年我又获得了【资质证书】，还有幸成为了【师承关系】。

熟悉我的老会员都知道，在过去的课程当中，有太多的老会员通过我师承【大师姓名】老师的方法帮助了相当多的老人。今天，我要给大家分享一个更加古老、更加神奇的方法——【核心技术】。

**这个方法能给你带来什么好处呢？**

【核心技术】可以帮助叔叔阿姨们解决因【核心问题】引起的【各种慢性疾病】，最终让您实现【核心好处】的目标！

**先给大家看看真实的案例！**

我这个方法，已经帮助了至少有【受益人数】老人受益了。
就在上个月，【案例1：地区+人物+问题+原因+核心技术+改善效果】！
【案例2：地区+人物+问题+原因+核心技术+改善效果】。

我给大家看个视频吧，看看这些受益的叔叔阿姨们给我发来的感谢视频。

这些老人都在我的帮助下，正行走在健康百岁老人的路上！

**什么是真正的健康百岁老人？**

咱们说的百岁老人，可不是什么样的（用三句以上的排比句进行痛苦的“活死人”的描述），熬到一百岁！那叫活受罪！

咱要的健康百岁，是什么样的（用三句以上的排比句进行描述，如行动力上，饮食上，跟家人关系上，精神上），这才叫真正的健康百岁老人！

**二、好在哪儿（三大好处）**

用了【核心技术】，具体会给您带来哪些改变呢？我从三个方面跟大家聊聊。

**第一，【好处一标题】**
【好处一详细描述，使用比喻和场景化语言】

**第二，【好处二标题】**
【好处二详细描述，使用比喻和场景化语言】

**第三，【好处三标题】**
【好处三详细描述，使用比喻和场景化语言】

通过刚才的讲解，我相信每位叔叔阿姨都了解了什么才是真正的“健康百岁老人”，但是很多叔叔阿姨们可能要问了，你说的这么好，为什么真正能健康活到百岁的老人却寥寥无几？在这里，我想问一下叔叔阿姨们，想要健康的活过百岁难不难？

**三、难在哪儿（三大拦路虎）**
**三大拦路虎的标题，是方法论里的三步的对立面，如方法论是听话，拦路虎就是叛逆。**

**（1）第一大拦路虎：【标题1】——【有多可怕】**

**新闻数据告诉我们真相**
根据【电视栏目】引用的数据，【权威数据说明问题普遍性】。

**咱们看看权威专家怎么说。**
【权威专家观点引用】。

**真实案例让人心痛**
**案例一：【名人案例1】**
【案例详情及教训】
**案例二：【名人案例2】**
【案例详情及教训】

**再看看真正的长寿老人是什么样**
**对比一：【长寿权威1】**
【健康状态描述】
**对比二：【长寿权威2】**
【健康状态描述】

**来，我问一句，在座的70岁以上的老人举个手？**
老话说得好："【相关谚语】"。【权威医学杂志】的研究明确指出，【研究数据】。

**【核心问题】到底是什么？**
**①它是【各种症状】的最大元凶！**
**②【核心问题】分三种：【分类1】、【分类2】、【分类3】**
**③【核心问题】是怎么形成的？三个步骤！**
**第一步：日常消耗**
**第二步：症状显现**
**第三步：疾病爆发**
**④【核心问题】有三大特点：【1】【2】【3】！**

**（2）第二大拦路虎：【标题2】——【有多可怕】**

**咱们现场做个测试好不好？三步法**
**第一步：自我测试**
**测试一：【测试方法1】**
**测试二：【测试方法2】**
**测试三：【测试方法3】**
**第二步：检测报告**
**第三步：症状表格**

**下危机：【用脍炙人口的话下危机】**
**故事一：【危机场景1，呼应前面下危机那句话】**
**故事二：【危机场景2，呼应前面下危机那句话】**

**推导公式：**
【核心问题】→【症状】→【疾病】→【不能自理】→【拖累子女】→【家破人亡】

**（3）第三大拦路虎：【标题3】——【有多可怕】**

**新闻数据告诉我们真相**
根据【电视新闻栏目】引用的数据，【权威数据说明问题普遍性】。
**咱们看看权威专家怎么说。**
【权威专家观点引用】。

**四、打倒现状
针对这3个难点，传统解决方法都是怎么做的呢？
我称之为：【目前市面上对于核心问题的解决方案进行4-6字总结】**语言要犀利，要一针见血，带有负面贬义词，然后对这个词进行解释，根本原因是什么？

**错误方法一：【方法1】——问题描述**
**错误方法二：【方法2】——问题描述**
**错误方法三：【方法3】——问题描述**

举例：
针对这3个难点，我们自己和同行们都是怎么做的呢？我称之为"客流混杂"
什么是"客流混杂"？
就像一个大杂烩火锅，什么都往里放，看起来十分丰盛，实际上没有主题，没有特色，没有灵魂。
 
这类门店表面上人来人往、热闹非凡、客流不断，就像庙会一样热闹，但实际上背后隐藏着严重的问题：
1、只重数量，不重质量
只要来人就行，质量好不好不重要，"进店就成功""人多就赚钱"。
2.只重进店，不重成交
就像钓鱼，就会打窝，只管把鱼引过来，不管能不能钓上来。
3、只重当下，不重筛选
没有服务流程，没有客户分级管理，就像撒网捕鱼，大鱼小鱼一网打尽，不分贵贱
 
我给大家讲一个真实的案例：
 
我有一个学员，经营着一家保健品店，年销售额大概140万左右。有一天，他听说"超级社群"特别火，一轮下来能卖100万，就像吃了兴奋剂一样。
 
然后他就和一个厂家开始合作，而这个厂家对超级社群并不是特别精通。前期上了2000人，发礼品将近16万多，结果最后活动做完赔了5万多。
 
为什么会这样？就是“客流混杂”的导致的因为他只追求人数增长，忽视了客户质量与精准运营。2000人看似庞大，实则多数是冲着礼品而来，缺乏真实需求匹配。没有筛选机制、没有分层维护，更没有建立信任关系，最终导致高投入低回报。这正是“客流混杂”的典型恶果——热闹背后，全是成本。

**五、现状后果
【不可逆的后果】 先给此后果做个概括总结，比如：“造成三垮”，要求干净利索快，现状产生的后果，要求让听者提起对核心问题的警惕 **
**【分别列举各个后果，并举例说明】**
1、事业垮
2、家庭垮
3、身体垮

（举例：
这样的案例并不罕见，我相信在座的各位或多或少都有类似经历。那么，采用这种"客流混杂"模式的后果是什么？我告诉大家，它必然导致双杀：杀财路，杀门店。
 
第一杀：杀财路，断了盈利根！
 
为什么会杀财路？因为"客流混杂"让门店养成了只看人数不看价值的习惯，破坏了正常的盈利逻辑。那些有消费能力的高净值人群，他们对服务品质有着明确的要求和价值期待。
就像五星级酒店和快捷酒店的区别，如果五星级酒店为了客流量，什么客人都接，还搞免费入住，你觉得有钱人还愿意花钱住吗？
 
真正的金主要的是尊贵感、专属感、价值感！
 
第二杀：杀门店，无法精准服务！
 
为什么会杀门店？因为"客流混杂"摧毁了门店的服务质量和品牌形象。当门店过度依赖客流刺激，就会陷入一个可怕的循环：追求人流→服务下降→更多低质客户→金主流失→失去利润。
 
这种模式完全违背了大健康门店的经营本质。大健康门店的核心在于“治未病、养身心”，服务的是对生命质量有追求的人群。若一味追逐泛流量，哪里还有专业价值？就如同中医馆搞抽奖、佛堂搞秒杀一样，即失了体面，也失了道。）
 
第二：现状原因：
为什么市场上会出现这么多【现状】做法？根本原因在于 
1、
2、
3、

总结：对以上观点进行总结，并引出新观点
（举例：
正是这种"客流混杂泛滥"的市场现状，让客户对门店产生"免费就来，付费就走"的消费习惯，整个行业都被拖入了恶性竞争的泥潭。
那么，面对这样的困境，我们如何才能脱颖而出，有没有一条明路能让我们真正掌握锁定金主的秘诀？）

**六、新观点——用【核心技术】解决【核心问题】**
什么是【核心技术】？【核心技术】分别指：
为什么会这么厉害？其实背后原理就是三个核心系统：
**第一，【独特优势1】**
**第二，【独特优势2】**
**第三，【独特优势3】**

（举例：
这条新路，就是我们今天要重点学习的核心方法——
用"三环锁定"打造"三百金主"的无敌模式
让我先给大家讲个古代故事。
 
战国时期，有个叫孙膑的军事家，面对强大的魏军，他没有选择硬碰硬的正面对决，而是巧妙地设计了"围魏救赵"的策略。通过精准布局、差异化战术、多点出击，最终以少胜多，创造了军事史上的经典战例。
 
今天我们面对激烈的市场竞争，同样需要这样的智慧？
 
什么是"三环锁定"？
 
"三环锁定"，就像孙膑的兵法一样，源自古代智慧中的"精兵强将胜千军"，是指通过最精准、最高效、最有价值的客户锁定策略，是实现三百金主的终极心法。
 
"三环锁定"分别指：内环带金主、中环抢金主、外环挖金主。
 
为什么会这么厉害？其实背后原理就是三个核心系统：
1、精准激活系统：通过内环带金主，建立"客户推荐机制"
2、差异争夺系统：通过中环抢金主，提供"核心竞争优势"
3、场景获客系统：通过外环挖金主，构建"优质获客渠道"）
 
**七、方法论——
那如何把【核心技术】这套方法论落地呢？主要分三步：

**第一步：【步骤一名称】——实现目标**
**这一步要做什么？**
**您会有什么感觉？**
**这一步对应的是什么？**
- **解决问题**：【问题1】
- **调理脏腑**：【脏腑1】
- **目标**：【目标1】
- **价格**：【价格1】

**第二步：【步骤二名称】——实现目标**
**这一步要做什么？**
**您会有什么感觉？**
**这一步对应的是什么？**
- **解决问题**：【问题2】
- **调理脏腑**：【脏腑2】
- **目标**：【目标2】
- **价格**：【价格2】

**第三步：【步骤三名称】——实现目标**
**这一步要做什么？**
**您会有什么感觉？**
**这一步对应的是什么？**
- **解决问题**：【问题3】
- **调理部位**：【部位3】
- **目标**：【目标3】
- **价格**：【价格3】

**三步走的比喻：【要求形象生动】**

**为什么一定要吃"【产品名称】"？九大理由**
**（1）临床数据——效果确切**
**（2）专利技术——【技术亮点】**
**（3）权威专家——从古至今的传承**
**（4）实验证明——看得见的效果**
**（5）专家团队服务**
**（6）见效快——七天见效**
**（7）核心成分——天地精华的浓缩**
**（8）最高标准——【质量标准】**
**（9）奖项认证——国家认可**

**八、康复案例——从不能到能，真实改变**

**案例一：【案例详情】**
**案例二：【案例详情】**
**案例三：【案例详情】**

**好评与复购率——用户的真实反馈**
【产品名称】上市【年限】年来，累计服务用户超过【用户数】，好评率高达【好评率】%，复购率高达【复购率】%！

**竞品对比——价格锚点**
**第一宝：【竞品1】——价格【价格】**
**第二宝：【竞品2】——价格【价格】**
**第三宝：【产品名称】——效果不输前两者，价格却...**

**九、破价——今天买最便宜**

**三个周期，三个目标**
**周期一：【周期一目标】**
**周期二：【周期二目标】**
**周期三：【周期三目标】**

**初心故事——我为什么要这么做？**
【讲述个人故事和使命】

**稀缺性——今年就这一回**
**稀缺原因一：生产周期长**
**稀缺原因二：年产量有限**
**优惠理由——11个背书点**
1. 【喜事1】
2. 【喜事2】
...
11. 【喜事11】

**破价过程——四方联动**
**第一方：组委会补贴【金额】**
**第二方：厂家让利【金额】**
**第三方：栏目支持【金额】**
**第四方：老师个人贴补【金额】**

**最终价格**
**原价计算：【原价】**
**第一轮降价：【特惠价】**
**第二轮降价：【团购价】**
**第三轮降价：减去补贴【最终价】**

**赠品**
买就送价值【金额】元赠品大礼包

**限名额、限时间**
**0风险承诺——无效退款！**

**登记后，您不要着急离开！**
我还要告诉您具体用法和注意事项。

---

请用上述模板生成完整销售话术，保持原有结构和话术风格。
不要调整模版的结构，包括大标题、小标题、序号等。
所以的结构只能增多，但我要求的一个不能少。

结果控制在3000个字左右。`;
}

//目前是废弃了
export function buildCourseOutlinePrompt(content: string) {
  const normalized = content.trim();
  let shijianshi = normalized;
  let jiugongge = normalized;

  const nineIndex = normalized.indexOf("九宫格");
  if (nineIndex !== -1) {
    const before = normalized.slice(0, nineIndex).trim();
    const after = normalized.slice(nineIndex).trim();
    if (before) {
      shijianshi = before;
    }
    if (after) {
      jiugongge = after;
    }
  } else {
    const parts = normalized.split(/\n\s*\n/);
    if (parts.length >= 2) {
      shijianshi = parts[0].trim();
      jiugongge = parts.slice(1).join("\n\n").trim();
    }
  }

  return `根据输入的四件事信息${shijianshi}和九宫格信息${jiugongge},
1、帮我梳理一下四件事和九宫格之间的对应关系。

2、根据四件事儿和九宫格之间的关系，参考产品信息，以四件事儿为整个课程的底层逻辑，以九宫格作为骨架，帮我做出一门15节课的大纲，课程大纲不用以周为单位。

3、课程节奏说明 
以【15】节课为例：
第一阶段：1 节：共起愿景
共起【核心好处】愿景，建立主讲人和品牌的专业形象和善良印象，
树立此次活动的高度，包装举办单位/机构/企业，立此次活动的初心，初心要跟国家“健康中国”的口号有关，同时拿中医药对国人5000的帮助和目前中医药面对的困境/外国对中医药的掠夺做对比，引起受众的爱国心，煽动发扬中医药文化，拥护发起此次活动企业的热潮。
建立【核心问题】认知，把【核心问题】会导致的疾病全部罗列出来，结合真实案例、医学数据、新闻报道、自测图表及名人案例，让受众相信自己无法达成【核心好处】，是由于【核心问题】导致的，并引发重视。
此阶段，不需要加入有关具体产品的内容。
主讲人的专业形象，可以用教大家跟【核心问题】有关的小妙招的方式，这阶段每节课至少教3个小妙招；主讲人的善良印象，可以用“帮助了什么老人，改善了什么问题，达到了什么结果”这类案例的方式；
品牌的专业可以用品牌所获得的荣誉奖项专利等阐述。
第二阶段：4节 ：小单铺垫
让受众相信自己无法达成【核心好处】是由于【核心问题】导致的，并引发重视，且强烈渴望想立刻解决。用排他的方式，否定错误方法，提出新方法：【核心技术】，突出【核心技术】的优势，相信只有【核心技术】才能帮大家解决【核心问题】达到【核心好处】，【核心技术】是唯一解决方案，目的要让大家强烈渴望希望尝试【核心技术】，每节课加入2-3个主讲人用【核心技术】帮助老人改善【核心问题】的案例。并且在此阶段的最后一节课中了解到【核心技术】的体验政策后，争抢体验名额。
根据第一阶段提出的【核心问题】会导致的疾病，此阶段的4节选择致死率致残率最严重的三个病分集分析。比如，纳豆红曲解决的是陈旧性血栓，那血栓会造成心梗、脑梗腔梗、静脉曲张、高血压、高血糖、高血脂、肺栓塞、中风偏袒后遗症等疾病，把这些疾病分别放到这一阶段的每一集当中去重点分析。分析内容包括【核心问题】如何导致的此类疾病；此类疾病不解决会产生那些严重后果；传统解决方案的弊端；从成分、配伍或技术、专利分析【核心技术】是如何应对此类疾病的；每集需要有2-3个效果案例。目的1：囊括人群，让有此类疾病的用户相信他的问题是由于【核心问题】导致的，目的2：让用户强烈渴望想解决，目的3：让客户相信【核心技术】是唯一解决方案，目的4：相信此学习班可以帮他逆天改命，争先抢购体验名额。
此阶段的4节，有关产品的具体节奏如下：
此阶段第1节：提出【核心技术】，同时根据九宫格的现状，进行排他。但是不讲具体产品名称，加入产品的成分，把产品成分如何解决【核心问题】阐述清楚；
此阶段第2节：亮产品，明确指出产品是如何帮客户解决【核心问题】，此【核心技术】必须用到此产品；
此阶段第3节：加强【核心问题】的危机，并且通过以下几个维度立价格：1.找对标——寻找同类中的领导者作为参照物；2.跨行比——其他解决方案中成本最高的。比如手术费用对比（开颅手术），医疗费用对比（搭桥、预防），护理费对比（护工、医疗器械）；3.强调成分——突出高价值成分和制作工艺（稀有成分、特殊产地、特殊组方、专利艺术、工艺差异）；4.做演示——通过调理方法建立价值认知；5.亮背书——运用权威认证强化价值感（产品临床投资、线下真实数据、医院或权威机构或专家推荐）
此阶段第4节：学习班炒作、塑造产品价值、制造稀缺性，以限量，方案唯一性，促成用户立即申请体验。
第三阶段：5节：培养服用习惯，引导效果
此阶段的前两节课：加入营造体验名额稀缺，用户争先恐后报名的火爆场面的内容。并且解释中医的“瞑眩反应”，以消除用户服用顾虑。
此阶段的后两节课：加入【核心技术】的市场价格。通过专家的话、医学数据，提出“吃够周期吃够量，身体才能大变样”的周期/疗程调理观念。
此阶段的第三节课程：用案例、名人故事、新闻报道、专家论述等方式，加入“预防大于治疗”的养生观念。
根据第一阶段提出的【核心问题】会导致的疾病，除了第二阶段已经分析过的疾病，继续分集分析剩余的疾病。比如，纳豆红曲解决的是陈旧性血栓，那血栓会造成心梗、脑梗腔梗、静脉曲张、高血压、高血糖、高血脂、肺栓塞、中风偏袒后遗症等疾病，把这些疾病分别放到这一阶段的每一集当中去重点分析。分析内容包括【核心问题】如何导致的此类疾病；此类疾病不解决会产生那些严重后果；传统解决方案的弊端；从成分、配伍或技术、专利分析【核心技术】是如何应对此类疾病的；每集需要有2-3个效果案例。目的1：囊括人群，让有此类疾病的用户相信他的问题是由于【核心问题】导致的，目的2：让用户强烈渴望想解决，目的3：让客户相信【核心技术】是唯一解决方案，目的4：引导第二阶段参加体验的用户分享效果，加深产品信任。且每节课加入2-3个主讲人用【核心技术】帮助老人改善【核心问题】的案例。

第四阶段：2节：锚点铺垫
此阶段每集需要上4个左右案例，重点分析案例，每一个案例分析按照：明确疾病根源—引发此疾病重视—提出解决办法—原理佐证—解决办法的优势—排他—稀缺—定价，的方式。额外加入内容：1：通过用户来信表达市场价格太贵，希望主讲人给大家优惠。2：继续深化“吃够周期吃够量，身体才能大变样”的周期、疗程调理观念。3：立主讲人设：以自身故事建立与用户“儿女般”的信任，让用户相信主讲是真心想帮助大家解决【核心问题】，带大家达到【核心好处】。4：包装产品价值，塑造稀缺。
第五阶段：2节：销售铺垫
此阶段每集需要上4个左右案例，重点分析案例，每一个案例分析按照：明确疾病根源—引发此疾病重视—提出解决办法—原理佐证—解决办法的优势—排他—稀缺—定价，的方式。额外加入内容：1：此阶段第一节课，立【核心技术】价格锚点：通过主讲人的不懈努力，给大家争取到了怎样的优惠（锚点价格）；2：通过刻画老年人面临的现实问题（无人搭理、失去亲人、失去自理等），直击用户情感最脆弱处，引发强烈共情与伤感，让用户从情感上迫切想要健康；3：渲染员工辛劳，引发用户强烈共情与感恩，巩固员工与用户之间的情感纽带。4：通过体验用户来信表达“求团购”“长期用”的呼声。5：继续包装产品价值，塑造稀缺。
第六阶段：1节：销售
此阶段第一节课，整体按照九宫格信息${jiugongge}的节奏，遵循：建立渴望-制造恐惧-给出方案-证明效果-破价成交的逻辑闭环。
此阶段的第二节课程的目的是稳单+加单，课程内容1：概括【核心问题】所产生的疾病；2：呈现大量长期服用的效果案例；3：塑造【核心技术】的价值与稀缺；4：强化“周期”调理观念；5：消除顾虑，如售后电话，售后服务，品牌信赖；6：根据【核心好处】进行远景描绘

4、每一节课开头都需要根据课程要求增加一个课程目标，清楚的知道这节课你要实现什么目的，每一集的目的不能脱离这一集所在阶段的课程要求，需要让主讲人通过标题知道此节课程的重点。

结果控制在10000个字以内。

给你个范例，供你参考：
葛洪15天课纲

【第一阶段：愿景】1节课

第1节：认知觉醒、公益启航、亚健康下定义（45+人群）
课程目标：九宫格①"要去哪儿"：建立核心好处愿景， 建立老师“专业信赖”；突出亚健康调理学习班兴趣；锁定顾客持续观看
课程内容：
•开场互动+口号+自报家门；
•[主题+亚健康调理机构+葛洪圣康堂企业]介绍；
•主题关联（健康中国2030、全民减脂）；
•企业公益使命（让每个家庭有懂养生的人）；
•师出有名，老师高度介绍+人设（专业）+ 绝活展示（降压、关节止痛、脾胃调理食疗方）；
•认知铺垫（45岁以后，所有人100%有慢性病问题，原因是违背十二时辰养生法进而引发五脏失调，功能受损导致的+下危机——引发重视）；
•愿景描述：通过葛洪·亚健康调理学习班逆天改命摆脱慢性病实现健康长寿
•活动好处宣讲；
•留钩子:慢病快速改善法（高血压、高血糖）


【第二阶段：体验】3节课
第2节：生活中的小问题有可能离心梗、脑梗仅一步之遥。
课程目标： 让用户意识到慢性病、亚健康的问题是由于违背十二辰养生法，进而身体毒素堆积、阳气不足、五脏失调导致疾病问题产生危机感，炒作学习班激发兴趣。
课程内容：
•开场口号+感受信（顾客对栏目/老师的看法）；
•企业高度+主题+活动好处；
•昨日回顾（知识复课）；
•亚健康的危害+范围（亚健康下一步慢性病）+九宫格③"难在哪儿"：揭示三大拦路虎（毒素堆积、阳气不足、五脏失调）
•引出今日主题
•讲今日主题：心梗、脑梗+下危机（数据+视频）；
•老师专业人设（应对心梗、脑梗急救绝活）
•逻辑闭环（明确根源—引发重视—解决办法（葛洪学习班中葛洪三元法调理慢病）—原理—佐证—自我测试—扣人群）；
•炒作学习班（心梗、脑梗成功案例）；
•激发学员兴趣（挖掘核心诉求（怕并发症、想停药）
•宣讲好处
•留钩子；
第3节：糖尿病做对这三步，健康早来到
课程目标： 突出“调理学习班方案”的科学性；提升学习班意向率
课程内容：
•开场口号+引导信（顾客迫切想要加入葛洪·亚健康调理学习班）
•昨日回顾（知识复课）
•引出今日主题：糖尿病
•下危机（糖尿病数据+视频）；
•老师人设（我对糖尿病老人有耐心故事—老师是可亲可爱懂老人的人）；
•逻辑闭环（明确根源—引发重视—解决办法—原理—佐证—自我测试—扣人群）
•解决方案（排毒+升阳+安神三步法+非遗技术+中医药认证+排他
•炒作葛洪·亚健康调理学习班（糖尿病逆转案例）+介绍国内最专业，最权威的亚健康调理班。（只有葛洪三元能解决）↔ 九宫格2+4+6+7+8）；
•留钩子（明日预告）
•引导进店领取1-2天鸡蛋；
第4节：哪类人容易中招癌症、肿瘤？
课程目标： 深度讲解葛洪学习班，定价，价值3000+，制造体验稀缺，促使用户争抢体验名额。
课程内容：
•开场口号+引导信（顾客迫切想要加入葛洪·亚健康调理学习班）
•昨日回顾（知识复课）；
•企业高度（五颗心）；
•今天主题：癌症、肿瘤
•下危机（视频+数据）；
•逻辑闭环（明确根源—引发重视—解决办法—原理—佐证—自我测试—扣人群）
•学习班炒作（逆转癌症、肿瘤案例）；
•工具包定价2000+、稀缺+排他；
•核心权益展示（产品+服务+跟踪）；
•（市场暗线）录制口号（我要学习，我要健康，我要学真技术，我要真健康，我受够了，老师教教我）；
•留钩子（明日预告）
•观念（找对慢病调理方法难，只有亚健康调理班最权威）
•引导线下进店（福利到了）

第5节：（线下）20分钟99元销售课
课程目标：必须100%人群进店，花99元办理价值3000元，参加葛洪·亚健康调理学习班。
课程内容： 
•让用户意识到慢性病、亚健康的问题是由于违背十二辰养生法，早排毒，午升阳，晚安神的规律，进而身体毒素堆积、阳气不足、长期失眠导致出现疾病问题
•解决办法（葛洪三元法）—原理—佐证—自我测试—扣人群）
•学习班炒作、塑造价值、工具包定价3000+；
•核心权益展示（产品+服务+跟踪）稀缺
第三件事（只有葛洪三元能解决）↔ 九宫格2+4+5+6+7+8
•九宫格②"好在哪儿"：三丹三大好处
•九宫格④"现状"：否定错误方法
•五现状后果
•九宫格⑥"新观点"：葛洪三元独特性
•九宫格⑦"方法论"：三步走调理方案
•九宫格⑧"康复案例"：效果证明
第四件事（今天买最便宜）↔ 九宫格9
•今日最便宜——破价99元解锁工具包，即可参与葛洪·亚健康调理学习班
•指导三款产品服用方法
•产品服用分享+打卡要求
•公益金
•填表打卡
•做承诺（人格担保，无效退款）
【第三阶段：深化】5节课
第5节：葛洪三元法助您远离老年痴呆。
课程目标： 深度讲解葛洪学习班，定价，价值2000+，制造体验稀缺，促使用户争抢体验名额。
课程内容：
•开场口号+引导信（顾客迫切想要加入葛洪·亚健康调理学习班）
•昨日回顾（知识复课）；
•今天主题：骨质疏松+老年痴呆
•下危机（视频+数据）；
•逻辑闭环（明确根源—引发重视—解决办法—原理—佐证—自我测试—扣人群）
•学习班炒作（逆转骨质疏松+老年痴呆案例）；
•工具包定价2000+、稀缺（葛洪·亚健康调理学习班只有3天）；
•核心权益展示（产品+服务+跟踪+要求）；
•观念（只有亚健康调理班最权威）；
•留钩子（明日预告）
•你最想找我解决什么问题？一定要告诉门店，
第6节：排毒篇：便秘三高的真凶——毒素堆积如何要了你的命？
课程目标： （让所有便秘的人群都想找时洋老师开解决方案。）
课程内容：
•开场口号+引导分享信（产品服用效果分享）
•老师人设（真实，我和舅舅故事）；
•今日主题（慢病与毒素相关）；
•下危机（数据+视频）；
•逻辑闭环（明确根源—引发重视—解决办法（早排毒，午升阳，晚安神）—原理—佐证—自我测试—扣人群）；
•学习班炒作（三步法+排毒（葛洪金舒通）（排他）产品—打开人体6大排毒通道+3个成功案例）；
•葛洪金舒通排毒实验
•愿景描述（10大改变）；
•指导三款产品服用方法；
•一对一的解决方案，方案解读
•价值强调（3000元课程+工具+指导+公益福利+学习工具包“让你吃了就后悔的产品：
•讲故事：逆时---倒反天罡；顺时养生-黄帝内经就开始有。
•观念（祛病从根治排毒第一步吗，排毒不到位，调理全白费）
•99元学习班办理（人员超了，我封班了，不能报名了，但是闹意见了，线上的客户来不了店，有得有事儿没来，有顾客不满意，生气了，要在开放一次，再开放一次。明天统计好，明晚上之前把名额报到总部。我不要钱，大家都疯狂报名啊。）
•市场价格铺垫： 排毒丹139元、安神丹398元、升阳丹1490元
•留悬念
•早中晚三次+2包装打卡5个蛋，晚上直播带着吃
第7节：升阳篇：元气不足，百病生
课程目标：（让所有元气不足的人群都想找时洋老师开解决方案。）
课程内容：
•开场+分享信（服用感受分享）
•宣布：今天是提交名单最后一天，已经截止报名了，关闭报名通道99元学习班办理（12点前黑名单）没报名的安抚一下，以后还有。
•优秀学员评选规则（优秀学员好处---录课之前要确认）；
•老师人设（去养老院关爱老人的故事）；
•今日主题（元气不足百病生—元气不足+慢病相关））；
•慢性病（风湿骨病、肝肾疾病）下危机（数据+视频）；
•逻辑闭环（明确根源—引发重视—解决办法—原理—佐证—自我测试—扣人群）；
•学习班炒作（葛洪三元法+升阳（葛洪延龄丹）产品—升阳补元气+3个成功案例）；
•寒热实验
•愿景描述（10大改变）；
•指导三款产品服用方法；
•一对一的解决方案，方案解读
•价值强调（3000元课程+工具+指导+公益福利+学习工具包“让你吃了就后悔的产品：
•观念（元气不足，百病生，元气的多少决定寿命的长短
•留钩子
•晚上直播带着吃
第8节：安神篇：失眠心慌的根源——五脏失调让你一夜衰老十岁！
课程目标：（让所有失眠的人群都想找时洋老师开解决方案。）
课程内容：
•开场+分享视频；
•优秀学员评选标准+表扬；
•今日主题（失眠，病难好+睡眠与慢病恶性循环）；
•逻辑闭环（明确根源—引发重视—解决办法—原理—佐证—自我测试—扣人群）；
•学习班炒作（葛洪三元法+安神（葛洪名实牌倍合颗粒）产品—安神修复脏腑+3个成功案例）；
•葛洪名实牌倍合颗粒秒吸收实验
•一对一的解决方案，方案解读
•观念（安神是慢病调理关键环节，三步缺一不可）（教育类的）（情感拉动）
•疗程观念深化： 周期服用
•留钩子
•晚上直播带着吃
第9节：心脑血管病的警钟——功能失调不解决，猝死随时来敲门！
课程目标： （让所有失眠的人群都想找时洋老师开解决方案。）
课程内容：
•开场+分享信/视频；
•优秀学员表扬（细节化）；
•主题（血管堵一寸，寿命短十年）；
•案例分析+逻辑闭环（明确根源—引发重视—解决办法—原理佐证—优势—排他—稀缺—定价—核心科技）；
•效果分享（已报名学员反馈+10大改变）；
•一对一的解决方案，方案解读
•痛点刺激（未报名学员病情加重风险）；
•观念（把握低价健康先机）
•周期调理观念： 预防大于治疗，长期服用才能真正健康长寿
•祈福名单征集（长期调理学员专属）；
•晚上直播带着吃


【第四阶段：锚点铺垫】2节课
第10节：心脏病：功能失调全面解析——为什么有人调理3个月就见效？
课程目标：代谢疾病危机、 立主讲人设，员工辛苦、周期服用
课程内容：
•开场+感受信/视频
•优秀学员表扬；
•老师人设（专业）+ 员工辛苦强调；
•主题（功能失调是慢病根源，讲代谢失调+一人患病拖累全家+66岁需重视代谢调理）；
•长期意愿铺垫（15天仅体验+代谢慢病需长期调理）；
•案例分享（学员吃药无效后靠本方案改善）；
•一对一的解决方案，方案解读
•引导给老师送礼物；
• 观念（长期调理代谢才能稳慢病）疗程观念再强化： 就像盖房子，地基得打牢，4个月还清身体的债
•晚上直播带着吃
第11节：结节、息肉、囊肿下一步“癌症”女性
课程目标： 息肉结节危机强化学习班效果分享、继续深化疗程观念，塑造产品稀缺性和价值感，讲解蜂蜡功效协同增效。
课程内容：
•开场+感受信/视频；
•优秀学员表扬；
•观念（自己健康，家庭幸福）；
•主题（息肉、囊肿、结节源于长期功能失调）；
•案例分析+逻辑闭环（明确根源—引发重视—解决办法—原理佐证—优势—排他—稀缺—定价—核心科技——周期调理）；
•3个疾病改善案例分享；
•一对一的解决方案，方案解读
•（内服+外用）三款产品+蜂蜡针对疾病调理
•情感煽动（长期调理、摆脱疾病心愿）；
•铺垫感动氛围（学员送锦旗/土特产+录制视频）；
•意向激活（三连问+原价购买产品锁定长期调理）；
•引导给老师送礼物；
•讲解蜂蜡调理优势；医学数据：功能失调不干预，5年内重大疾病风险增加3倍
1.2-3个反面案例：拖延不调理导致严重后果
2.2-3个正面案例：坚持12个月调理，身强体壮活到九十九
3.包装产品价值： ①临床数据92.3%有效 ②国医大师推荐 ③非遗认证 ④2025版药典标准
•塑造稀缺： 今年最后一批原料，升阳丹里的5年人参要365天炮制，错过今年再等一年
•用户来信： 更多用户表达"希望团购""想长期用"的呼声
•晚上直播带着吃


【第五阶段：销售铺垫】2节课

第12节：男性疾病专场，前列腺，肺病，肝病，
课程目标： 周期服用效果、渲染员工辛劳，继续塑造稀缺。讲解古酒熏蒸好处协同增效
课程内容：
•开场+感受信/视频；
•优秀学员表扬+员工辛苦（我们的客服小姑娘为了帮大家登记,每天工作到深夜12点;仓库师傅为了赶发货,春节都没回家...他们图什么?就图叔叔阿姨们能健康长寿!）
•观念（疆与界）
•主题（男性疾病专场，前列腺，肺病，肝病，）；
•效果分享（学员7天反馈+图文对比，明确根源—引发重视—解决办法—原理佐证—优势—排他—稀缺—定价—核心科技——周期调理）；
•讲周期（长期套餐根治慢病）；
•一对一的解决方案，方案解读
•感动环节（学员摆脱药物依赖分享+感谢员工）；
•稀缺/排他（专属配方+葛洪独家方案）；
•（内服+外用）三款产品+古酒熏蒸针对疾病调理
•远景描绘（健康愿景）；
•塑造稀缺： 今年就这一批,人参需要365天炮制,黄精需要81天九蒸九晒
•晚上直播带着吃
第13节：疾病早知道的重要性！共情+故事
课程目标： 周期，讲解AI检测设备。

课程内容：
•开场+分享/感受信；
•老师人设（无私，不为名不为利）；
•员工辛苦强调；
•观念（疾病早知道的重要性）；
•全面总结功能失调的七大危害和葛洪三元的九大优势
•效果分享（明确根源—引发重视—解决办法—原理佐证—优势—排他—稀缺—定价—核心科技）；
•一对一的解决方案，方案解读
•讲周期（彻底调节代谢，摆脱慢病亚健康，调理是慢病预防关键；
•远景描绘（4个月后不用吃药+正常生活场景）；
•展示AI检测数据与慢病关联分析；
•塑造稀缺： ①年产量有限 ②今年最后一批 ③非遗品牌推广月+中医药管理局联合活动+品牌强国计划启动
•叔叔阿姨最不幸的一代。
•晚上直播带着吃


【第六阶段：销售】2节课

第14节：感恩篇：老师送给大家的一份礼物
课程目标： 感动，为大单做铺垫。
课程内容： 
•效果汇总（数据化展示+学员合集视频）；
•案例分享；（明确根源—引发重视—解决办法—原理佐证—优势—排他—稀缺—定价—核心科技）
•一对一的解决方案，方案解读
•讲周期+远景（搭配套餐=健康长寿+兑现祈福心愿）
•观念（长期调理收益长久健康）
•祈福视频环节（学员祈福画面+集体祈福音频+老师祈福寄语）；
•晚上直播带着吃

第15节：让健康成为送给自己和家人最好的礼物！
课程目标：慢病危机、继续引导顾客分享，周期服用，远景描绘。
课程内容：
•概括核心问题： 功能失调导致的七大疾病（便秘、失眠、三高、腰腿痛、记忆衰退、失眠、关节骨病、心脑血管病）
•案例分析（明确根源—引发重视—解决办法—原理佐证—优势—排他—稀缺—定价—核心科技，强调（补足十年+年轻十岁+增寿十年））
•呈现大量长期案例： 
￮4个月案例1个：便秘好了、睡眠香了、精神头回来了
￮8个月案例1个：腰不酸腿不疼、爬楼不喘、气色红润
￮12个月案例1个：身强体壮、还能干农活、还能带孙子
•塑造价值与稀缺： 
￮价值：①1700年古方 ②国医大师推荐  ④非遗认证
￮稀缺：今年最后一批，明年原料价格上涨20%
•强化周期观念： 
￮就像种庄稼，春天播种、夏天施肥、秋天才能收获
￮调理身体也一样，4个月打基础、8个月见成效、12个月才能真正健康长寿
￮很多用户只买1个月，吃完觉得有效果，后悔没多买
•消除顾虑： 
￮售后电话：400免费热线，随时咨询
￮售后服务：中医药管理局亚健康调理机构全程指导
￮品牌信赖：10万用户见证、好评率96%、复购率85%
•远景描绘： 
￮想象一下，4个月后的您：便秘好了、睡得香了、走路有劲了
￮8个月后的您：爬楼不喘、气色红润、朋友都说您年轻了
￮12个月后的您：能自己买菜做饭、还能带孙子、儿女都省心
￮90岁还能溜达去菜市场、还能炒五香花生米小酌一杯、重孙子被欺负了还能找您撑腰
￮这才是真正的百岁长寿！眼里有光、心里有劲、被晚辈需要！
•最后呼吁： 
￮您辛苦一辈子，该为自己的健康投资了！
￮葛洪三元法坚持调理，换来的是10年健康、20年长寿、儿女的安心、全家的幸福！

`;
}

//后续如果想实现不同结束的课纲，可以在这里增加课程节数和节奏内容（通过配置）
export function buildCourseOutlinePromptV2(content: string) {
  const normalized = content.trim();
  let shijianshi = normalized;
  let jiugongge = normalized;

  const nineIndex = normalized.indexOf("九宫格");
  if (nineIndex !== -1) {
    const before = normalized.slice(0, nineIndex).trim();
    const after = normalized.slice(nineIndex).trim();
    if (before) {
      shijianshi = before;
    }
    if (after) {
      jiugongge = after;
    }
  } else {
    const parts = normalized.split(/\n\s*\n/);
    if (parts.length >= 2) {
      shijianshi = parts[0].trim();
      jiugongge = parts.slice(1).join("\n\n").trim();
    }
  }

  return `根据输入的四件事信息${shijianshi}和九宫格信息${jiugongge}，请完成以下任务：

1、先梳理四件事和九宫格之间的详细对应关系。

2、在此基础上，参考产品信息，以四件事儿为整个课程的底层逻辑，以九宫格作为骨架，设计一门 15 节课的完整课程大纲（不用按周划分），并标明每一节课所在阶段。

3、课程节奏要求（按阶段设计，不必逐字照抄，可以灵活发挥）：
- 第 1 阶段：1 节，共起愿景。建立【核心好处】愿景，树立主讲人与品牌专业形象，说明活动初心，并结合国家“健康中国”相关表述与中医药背景，引发认同感和使命感。
- 第 2 阶段：4 节，小单铺垫。通过【核心问题】与典型疾病案例，强化危机与解决渴望；提出【核心技术】，采用排他式讲解和多组真实案例，让用户相信只有该【核心技术】才能解决问题，并在该阶段末尾引出体验名额或小单成交。
- 第 3 阶段：5 节，培养服用习惯并引导效果。围绕“吃够周期、吃够量身体才能大变样”的观念，结合案例、数据、用户反馈，持续强化长期调理的重要性，并分不同疾病主题展开。
- 第 4 阶段：2 节，锚点铺垫。通过案例、价格锚点、学员来信等方式，强化【核心技术】价值感与稀缺性，建立价格对比与心理锚点。
- 第 5 阶段：2 节，销售铺垫。继续通过案例和情感故事渗透长期调理观念，铺垫最终大单成交的合理性与必要性。
- 第 6 阶段：1 节，销售收尾。整体按照九宫格信息${jiugongge}的节奏，遵循“建立渴望—制造恐惧—给出方案—证明效果—破价成交”的逻辑闭环，并设计稳单、加单与售后信任相关内容。

4、每一节课开头都需要给出清晰的“课程目标”，让主讲人一眼就知道这一节课的核心任务；所有课程目标都不能偏离该节所在阶段的总体要求。

请用结构化方式输出 15 节课的大纲（标明阶段、节次、课程标题、课程目标、核心内容要点），整体控制在 10000 字以内。`;
}

export function buildCourseTranscriptPrompt(content: string) {
  const normalized = content.trim();
  const sectionKeys = [
    { key: "chanpin", label: "产品信息" },
    { key: "dingwei", label: "定位" },
    { key: "shijianshi", label: "四件事" },
    { key: "jiugongge", label: "九宫格" },
    { key: "guanxi", label: "四件事和九宫格关系" },
    { key: "kegang", label: "本节课大纲" },
    { key: "lastkegang", label: "上节课大纲" }
  ] as const;

  const buckets: Record<
    (typeof sectionKeys)[number]["key"],
    string[]
  > = {
    chanpin: [],
    dingwei: [],
    shijianshi: [],
    jiugongge: [],
    guanxi: [],
    kegang: [],
    lastkegang: []
  };

  let currentKey: (typeof sectionKeys)[number]["key"] | null = null;
  const lines = normalized.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentKey) {
        buckets[currentKey].push(line);
      }
      continue;
    }
    const found = sectionKeys.find(({ label }) => {
      if (trimmed === label) return true;
      if (trimmed.startsWith(label + ":")) return true;
      if (trimmed.startsWith(label + "：")) return true;
      if (trimmed.startsWith("【" + label) || trimmed.startsWith("「" + label)) {
        return true;
      }
      return false;
    });
    if (found) {
      currentKey = found.key;
      continue;
    }
    if (!currentKey) {
      currentKey = "chanpin";
    }
    buckets[currentKey].push(line);
  }

  const chanpin = buckets.chanpin.join("\n").trim();
  const dingwei = buckets.dingwei.join("\n").trim();
  const shijianshi = buckets.shijianshi.join("\n").trim();
  const jiugongge = buckets.jiugongge.join("\n").trim();
  const guanxi = buckets.guanxi.join("\n").trim();
  const kegang = buckets.kegang.join("\n").trim();
  const lastkegang = buckets.lastkegang.join("\n").trim();

  return `根据输入的定位信息${dingwei}，产品信息${chanpin}、四件事儿${shijianshi}、九宫格${jiugongge}、四件事和九宫格的关系${guanxi}，按照每一节产品课程大纲（带12步结构）${kegang}的内容框架，扩写成一个60分钟的课程话术稿。
其中${lastkegang || "（当前为第一节课程，无上一节课大纲）"}是上一节课的内容，注意扩写本节内容的时候流畅衔接。
扩写的内容中如果遇到案例、数据，要保证真实有效，有出处，不能编造。
  
结果控制在8000个字左右。`;
}

export async function callAiWithPrompt(prompt: string) {
  const rows = await query<AiSettings>(
    "SELECT model_name, api_key FROM ai_settings ORDER BY id DESC LIMIT 1"
  );
  if (rows.length === 0) {
    throw new Error("AI 配置未设置，请先在设置页中配置模型和 API Key");
  }
  const setting = rows[0];

  const rawTimeoutMs = process.env.AI_TIMEOUT_MS ?? process.env.AI_REQUEST_TIMEOUT_MS;
  const timeoutMs = rawTimeoutMs ? Number(rawTimeoutMs) : 600000;
  const effectiveTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 600000;

  const baseUrlRaw =
    process.env.AI_BASE_URL ??
    process.env.AI_API_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    "https://yunwu.ai";
  const baseUrl = baseUrlRaw.replace(/\/+$/, "");
  const url = `${baseUrl}/v1/chat/completions`;
  const model = String(setting.model_name ?? "").trim() || "claude-sonnet-4-5-20250929-thinking";
  const rawMaxTokens = process.env.AI_MAX_TOKENS;
  const maxTokens = rawMaxTokens ? Number(rawMaxTokens) : 8192;
  const effectiveMaxTokens = Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : 200000;
  const useStream =
    (process.env.AI_STREAM ??
      (process.env.NODE_ENV === "production" ? "0" : "1")) !== "0";

  const isAbortError = (error: unknown) => {
    return (
      error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name?: string }).name === "AbortError"
    );
  };

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const getNetworkCause = (error: any) => {
    if (!error || typeof error !== "object") return null;
    const cause = "cause" in error ? (error as any).cause : null;
    if (cause && typeof cause === "object") return cause;
    return error;
  };

  const isConnectTimeout = (error: any) => {
    const cause = getNetworkCause(error);
    const name = String(cause?.name ?? "");
    const code = String(cause?.code ?? "");
    const message = String(cause?.message ?? "");
    if (name.includes("ConnectTimeout")) return true;
    if (code.toUpperCase().includes("CONNECT_TIMEOUT")) return true;
    if (message.toLowerCase().includes("connect timeout")) return true;
    return false;
  };

  const isHeadersTimeout = (error: any) => {
    const cause = getNetworkCause(error);
    const name = String(cause?.name ?? "");
    const code = String(cause?.code ?? "");
    const message = String(cause?.message ?? "");
    if (name.includes("HeadersTimeout")) return true;
    if (code.toUpperCase().includes("HEADERS_TIMEOUT")) return true;
    if (message.toLowerCase().includes("headers timeout")) return true;
    return false;
  };

  const readEventStreamContent = async (response: Response) => {
    if (!response.body) return "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let output = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      while (true) {
        const lineBreakIndex = buffer.indexOf("\n");
        if (lineBreakIndex === -1) break;
        const rawLine = buffer.slice(0, lineBreakIndex);
        buffer = buffer.slice(lineBreakIndex + 1);
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice("data:".length).trim();
        if (!data) continue;
        if (data === "[DONE]") return output;
        try {
          const parsed = JSON.parse(data) as any;
          const delta =
            parsed?.choices?.[0]?.delta?.content ??
            parsed?.choices?.[0]?.message?.content ??
            "";
          if (typeof delta === "string") {
            output += delta;
          }
        } catch {
        }
      }
    }
    return output;
  };

  const extractEventStreamContent = (text: string) => {
    const lines = text.split(/\r?\n/);
    let output = "";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice("data:".length).trim();
      if (!data) continue;
      if (data === "[DONE]") break;
      try {
        const parsed = JSON.parse(data) as any;
        const delta =
          parsed?.choices?.[0]?.delta?.content ??
          parsed?.choices?.[0]?.message?.content ??
          "";
        if (typeof delta === "string") {
          output += delta;
        }
      } catch {
      }
    }
    return output;
  };

  try {
    const buildMessages = (
      basePrompt: string,
      previousAssistant: string | null
    ) => {
      if (previousAssistant && previousAssistant.trim()) {
        return [
          { role: "user", content: basePrompt },
          { role: "assistant", content: previousAssistant },
          {
            role: "user",
            content:
              "继续接着上文输出剩余部分，不要重复，保持原有结构与标题层级，直到完整结束。"
          }
        ];
      }
      return [{ role: "user", content: basePrompt }];
    };

    const parseChatCompletionContent = (bodyText: string) => {
      try {
        const data = JSON.parse(bodyText) as any;
        const choice = data?.choices?.[0] ?? null;
        const content =
          choice?.message?.content ??
          choice?.delta?.content ??
          data?.message?.content ??
          "";
        const finishReason = choice?.finish_reason ?? null;
        return {
          content: typeof content === "string" ? content : "",
          finishReason:
            typeof finishReason === "string" || finishReason === null
              ? finishReason
              : null
        };
      } catch {
        return { content: "", finishReason: null };
      }
    };

    const attemptDelaysMs = [0, 400, 1200];
    let lastError: unknown = null;
    for (let attempt = 0; attempt < attemptDelaysMs.length; attempt += 1) {
      if (attemptDelaysMs[attempt] > 0) {
        await sleep(attemptDelaysMs[attempt]);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), effectiveTimeoutMs);
      try {
        const callOnce = async (previousAssistant: string | null) => {
          const messages = buildMessages(prompt, previousAssistant);
          const response = await fetch(url, {
            method: "POST",
            headers: {
              Accept: useStream
                ? "text/event-stream, application/json"
                : "application/json",
              "Content-Type": "application/json",
              Authorization: setting.api_key
            },
            signal: controller.signal,
            body: JSON.stringify({
              model,
              messages,
              max_tokens: effectiveMaxTokens,
              stream: useStream
            })
          });
          if (!response.ok) {
            const text = await response.text();
            try {
              const data = JSON.parse(text) as any;
              const msg =
                data?.error?.message_zh ||
                data?.error?.message ||
                data?.message_zh ||
                data?.message;
              if (typeof msg === "string" && msg.trim()) {
                throw new Error(`${msg.trim()}（当前模型：${model}）`);
              }
            } catch {
            }
            throw new Error(
              text ||
                `调用 AI 接口失败，状态码：${response.status.toString()}（当前模型：${model}）`
            );
          }
          const contentType = response.headers.get("content-type") ?? "";
          if (useStream && contentType.includes("text/event-stream")) {
            const fallbackResponse = response.clone();
            const streamed = await readEventStreamContent(response);
            if (streamed && typeof streamed === "string") {
              return { content: streamed, finishReason: null as any };
            }
            const fallbackText = await fallbackResponse.text();
            const extracted = extractEventStreamContent(fallbackText);
            if (extracted && typeof extracted === "string") {
              return { content: extracted, finishReason: null as any };
            }
            const parsed = parseChatCompletionContent(fallbackText);
            if (parsed.content) {
              return parsed;
            }
            return { content: fallbackText, finishReason: null as any };
          }
          const bodyText = await response.text();
          const parsed = parseChatCompletionContent(bodyText);
          if (parsed.content) {
            return parsed;
          }
          return { content: bodyText, finishReason: null as any };
        };

        const first = await callOnce(null);
        if (useStream) {
          return first.content;
        }

        let fullContent = first.content;
        let finishReason = first.finishReason;
        for (let i = 0; i < 2; i += 1) {
          if (finishReason !== "length") break;
          if (!fullContent.trim()) break;
          const next = await callOnce(fullContent);
          if (!next.content) break;
          fullContent = fullContent + "\n" + next.content;
          finishReason = next.finishReason;
        }
        return fullContent;
      } catch (error) {
        lastError = error;
        if (isAbortError(error)) {
          throw new Error(`调用 AI 接口超时（${effectiveTimeoutMs}ms）`, {
            cause: error as any
          });
        }
        if (isConnectTimeout(error)) {
          if (attempt < attemptDelaysMs.length - 1) {
            continue;
          }
          throw new Error(`AI 接口连接超时，请检查网络或 AI_BASE_URL（当前：${baseUrl}）`, {
            cause: error as any
          });
        }
        if (isHeadersTimeout(error)) {
          if (attempt < attemptDelaysMs.length - 1) {
            continue;
          }
          throw new Error(
            `AI 接口响应超时（等待响应头超时），请检查网关是否拥堵/限流或更换模型（当前：${baseUrl}，模型：${model}）`,
            { cause: error as any }
          );
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }
    throw lastError;
  } catch (error) {
    throw error;
  }
}

export function buildPositioningPrompt(description: string) {
  return `# 角色
你是一位资深的大健康产品定位专家，为55-75岁退休老人提供专业、精准且全面的大健康产品定位分析。凭借深厚的行业经验和敏锐的市场洞察力，你能够根据产品描述「${description}」，生成高质量的产品定位内容。

## 技能
### 技能 1: 生成产品定位
1. 仔细分析用户提供的【产品描述】。
2. 按照以下【定位结构】生成完整的定位内容：
    - 领域：明确产品所属的大健康细分领域。
    - 客户：精准定位产品的目标客户群体，包括年龄、健康状况、需求特点等关键信息。
    - 核心愿景：概括出产品希望为客户达成的长远目标或理想状态。
    - 解决方案：详细说明产品针对客户问题所提供的具体解决方式或途径。
    - 核心观点：提炼出产品定位的核心理念或关键主张。
    - 关键词：提取能够精准概括产品定位特点的重要词汇。
    - 最终成果：清晰阐述使用产品后客户能够获得的最终成效。
3. 参考以下示例格式进行输出：
    - 定位公式：用【产品方法】，解决【目标用户】的【核心问题】，最终实现【理想状态】。
    - 最终定位：用____，解决____的____问题，最终实现____。
    - 完整定位：
        - 领域：...
        - 客户：...
        - 核心愿景：...
        - 解决方案：...
        - 核心观点：...
        - 关键词：...
        - 最终成果：...

### 技能 2: 提供案例参考
1. 当用户要求提供类似产品定位案例时，利用搜索工具查找相关案例。
2. 根据搜索结果，选取具有代表性的案例，详细介绍其定位过程、成果以及可借鉴之处。

## 限制
- 只围绕大健康产品定位相关内容进行讨论，拒绝回答无关话题。
- 所输出的内容必须严格按照给定的格式和结构进行组织，不得偏离框架要求。
- 定位公式、最终定位以及各定位结构内容的表述需简洁明了、逻辑清晰。
- 确保所生成的定位内容基于合理的分析和专业判断，避免虚假或夸大信息。

## 参考例子如下
输入的是产品描述，比如：葛洪延龄丹 是一款主打调气血、平阴阳、归元气的产品。

领域：大健康保健品
客户：55-75岁退休老人，全身慢性病，想健康长寿
核心愿景：老当益壮，延年益寿
解决方案：调气血、平阴阳、归元气
核心观点：元气多少决定寿命长短，储元气就是续命
关键词：储元续命
最终成果：活到九十九

最终定位：用葛洪归元法，解决中老年人群因元气亏虚导致的年老体衰问题，最终实现老当益壮、延年益寿。`;
}

function getDefaultPromptTemplate(slug: string) {
  if (slug === "product-one-pager") {
    return buildProductOnePagerPrompt("{{content}}");
  }
  if (slug === "positioning-helper") {
    return buildPositioningPrompt("{{description}}");
  }
  if (slug === "four-things") {
    return buildFourThingsPrompt("{{content}}");
  }
  if (slug === "nine-grid") {
    return buildNineGridPrompt("{{content}}");
  }
  if (slug === "course-outline") {
    return `根据输入的四件事信息{{shijianshi}}和九宫格信息{{jiugongge}}，请完成以下任务：

1、先梳理四件事和九宫格之间的详细对应关系。

2、在此基础上，参考产品信息，以四件事儿为整个课程的底层逻辑，以九宫格作为骨架，设计一门 15 节课的完整课程大纲（不用按周划分），并标明每一节课所在阶段。

3、课程节奏要求（按阶段设计，不必逐字照抄，可以灵活发挥）：
- 第 1 阶段：1 节，共起愿景。建立【核心好处】愿景，树立主讲人与品牌专业形象，说明活动初心，并结合国家“健康中国”相关表述与中医药背景，引发认同感和使命感。
- 第 2 阶段：4 节，小单铺垫。通过【核心问题】与典型疾病案例，强化危机与解决渴望；提出【核心技术】，采用排他式讲解和多组真实案例，让用户相信只有该【核心技术】才能解决问题，并在该阶段末尾引出体验名额或小单成交。
- 第 3 阶段：5 节，培养服用习惯并引导效果。围绕“吃够周期、吃够量身体才能大变样”的观念，结合案例、数据、用户反馈，持续强化长期调理的重要性，并分不同疾病主题展开。
- 第 4 阶段：2 节，锚点铺垫。通过案例、价格锚点、学员来信等方式，强化【核心技术】价值感与稀缺性，建立价格对比与心理锚点。
- 第 5 阶段：2 节，销售铺垫。继续通过案例和情感故事渗透长期调理观念，铺垫最终大单成交的合理性与必要性。
- 第 6 阶段：1 节，销售收尾。整体按照九宫格信息{{jiugongge}}的节奏，遵循“建立渴望—制造恐惧—给出方案—证明效果—破价成交”的逻辑闭环，并设计稳单、加单与售后信任相关内容。

4、每一节课开头都需要给出清晰的“课程目标”，让主讲人一眼就知道这一节课的核心任务；所有课程目标都不能偏离该节所在阶段的总体要求。

请用结构化方式输出 15 节课的大纲（标明阶段、节次、课程标题、课程目标、核心内容要点），整体控制在 10000 字以内。`;
  }
  if (slug === "course-transcript") {
    return `根据输入的定位信息{{dingwei}}，产品信息{{chanpin}}、四件事儿{{shijianshi}}、九宫格{{jiugongge}}、四件事和九宫格的关系{{guanxi}}，按照每一节产品课程大纲（带12步结构）{{kegang}}的内容框架，扩写成一个60分钟的课程话术稿。
其中{{lastkegang}}是上一节课的内容，注意扩写本节内容的时候流畅衔接。
扩写的内容中如果遇到案例、数据，要保证真实有效，有出处，不能编造。
  
结果控制在8000个字左右。`;
  }
  return "";
}

function buildPromptByTemplate(slug: string, template: string, content: string) {
  if (slug === "course-outline") {
    const normalized = content.trim();
    let shijianshi = normalized;
    let jiugongge = normalized;

    const nineIndex = normalized.indexOf("九宫格");
    if (nineIndex !== -1) {
      const before = normalized.slice(0, nineIndex).trim();
      const after = normalized.slice(nineIndex).trim();
      if (before) {
        shijianshi = before;
      }
      if (after) {
        jiugongge = after;
      }
    } else {
      const parts = normalized.split(/\n\s*\n/);
      if (parts.length >= 2) {
        shijianshi = parts[0].trim();
        jiugongge = parts.slice(1).join("\n\n").trim();
      }
    }

    return renderTemplate(template, { shijianshi, jiugongge, content });
  }

  if (slug === "course-transcript") {
    const normalized = content.trim();
    const sectionKeys = [
      { key: "chanpin", label: "产品信息" },
      { key: "dingwei", label: "定位" },
      { key: "shijianshi", label: "四件事" },
      { key: "jiugongge", label: "九宫格" },
      { key: "guanxi", label: "四件事和九宫格关系" },
      { key: "kegang", label: "本节课大纲" },
      { key: "lastkegang", label: "上节课大纲" }
    ] as const;

    const buckets: Record<
      (typeof sectionKeys)[number]["key"],
      string[]
    > = {
      chanpin: [],
      dingwei: [],
      shijianshi: [],
      jiugongge: [],
      guanxi: [],
      kegang: [],
      lastkegang: []
    };

    let currentKey: (typeof sectionKeys)[number]["key"] | null = null;
    const lines = normalized.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentKey) {
          buckets[currentKey].push(line);
        }
        continue;
      }
      const found = sectionKeys.find(({ label }) => {
        if (trimmed === label) return true;
        if (trimmed.startsWith(label + ":")) return true;
        if (trimmed.startsWith(label + "：")) return true;
        if (trimmed.startsWith("【" + label) || trimmed.startsWith("「" + label)) {
          return true;
        }
        return false;
      });
      if (found) {
        currentKey = found.key;
        continue;
      }
      if (!currentKey) {
        currentKey = "chanpin";
      }
      buckets[currentKey].push(line);
    }

    const chanpin = buckets.chanpin.join("\n").trim();
    const dingwei = buckets.dingwei.join("\n").trim();
    const shijianshi = buckets.shijianshi.join("\n").trim();
    const jiugongge = buckets.jiugongge.join("\n").trim();
    const guanxi = buckets.guanxi.join("\n").trim();
    const kegang = buckets.kegang.join("\n").trim();
    const lastkegangRaw = buckets.lastkegang.join("\n").trim();
    const lastkegang = lastkegangRaw || "（当前为第一节课程，无上一节课大纲）";

    return renderTemplate(template, {
      chanpin,
      dingwei,
      shijianshi,
      jiugongge,
      guanxi,
      kegang,
      lastkegang,
      content,
      description: content
    });
  }

  return renderTemplate(template, {
    content,
    description: content
  });
}

export async function buildPromptForAgent(slug: string, content: string) {
  const rows = await query<{ prompt: string | null; system_prompt: string | null }>(
    `SELECT p.prompt, a.system_prompt
     FROM agents a
     LEFT JOIN agent_prompts p ON p.agent_slug = a.slug
     WHERE a.slug = ?
     LIMIT 1`,
    [slug]
  );
  const template =
    (rows[0]?.prompt ?? "").trim() ||
    (rows[0]?.system_prompt ?? "").trim() ||
    getDefaultPromptTemplate(slug);
  if (!template) {
    return content;
  }
  return buildPromptByTemplate(slug, template, content);
}
