/* ============================================================================
   Yuki Agent Engine v0.2
   ----------------------------------------------------------------------------
   职责：
     · 定义 Planner / Executor / Reviewer 三个 Agent 的 System Prompt 与运行时
     · 多 LLM 供应商适配（Anthropic / OpenAI / DeepSeek / Demo / Claude Builtin）
     · Shared Memory 序列化 / 反序列化 / 快照
     · LLM 响应宽松 JSON 解析（容错 markdown 包裹与中文标点）
     · Demo State 种子数据生成
     · LLM-as-Judge 自动评分骨架（评估集 50 场景共用）
     · Bad Case 库写入 hook

   通过 `window.YukiEngine` 暴露给 components.jsx / pages.jsx / main.jsx 使用。
   ============================================================================ */

(function (global) {
  'use strict';

  // -----------------------------------------------------------------------
  // 0. 常量
  // -----------------------------------------------------------------------
  const STORAGE_KEYS = {
    STATE: 'yuki-state-v1',
    SETTINGS: 'yuki-settings-v1',
    THEME: 'yuki-theme',
    BAD_CASES: 'yuki-bad-cases-v1',
    EVAL_RUNS: 'yuki-eval-runs-v1',
  };

  const DEFAULT_SETTINGS = {
    username: '林梓桐',
    provider: 'demo',           // demo | claude-builtin | anthropic | openai | deepseek
    apiKey: '',
    model: '',
    notifyDaily: true,
    theme: 'light',
  };

  const PROVIDER_DEFAULTS = {
    anthropic: { model: 'claude-haiku-4-5', endpoint: 'https://api.anthropic.com/v1/messages' },
    openai:    { model: 'gpt-4o-mini',      endpoint: 'https://api.openai.com/v1/chat/completions' },
    deepseek:  { model: 'deepseek-chat',    endpoint: 'https://api.deepseek.com/v1/chat/completions' },
  };

  // -----------------------------------------------------------------------
  // 1. 工具函数
  // -----------------------------------------------------------------------
  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().slice(0, 8);
    }
    return (Math.random().toString(36).slice(2, 6) +
            Math.random().toString(36).slice(2, 6));
  }

  function nowTs() {
    const d = new Date();
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function safeJSON(str, fallback = null) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  // 宽松 JSON 解析：兼容 ```json ... ``` 包裹、前后说明文字、中文标点
  function looseJSON(text) {
    if (!text) return null;
    if (typeof text === 'object') return text;
    let s = String(text).trim();

    // 去除 markdown 代码块包裹
    const fence = /^```(?:json|JSON)?\s*([\s\S]*?)```$/m;
    const m = s.match(fence);
    if (m) s = m[1].trim();

    // 把全角标点替换回半角（LLM 偶尔会输出全角逗号 / 引号）
    s = s
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/，/g, ',')
      .replace(/：/g, ':');

    // 提取最外层 { ... } 或 [ ... ]
    const firstObj = s.indexOf('{');
    const firstArr = s.indexOf('[');
    let start = -1, opener = '{', closer = '}';
    if (firstObj >= 0 && (firstArr < 0 || firstObj < firstArr)) {
      start = firstObj;
    } else if (firstArr >= 0) {
      start = firstArr; opener = '['; closer = ']';
    }
    if (start >= 0) {
      let depth = 0, end = -1;
      for (let i = start; i < s.length; i++) {
        if (s[i] === opener) depth++;
        else if (s[i] === closer) {
          depth--;
          if (depth === 0) { end = i; break; }
        }
      }
      if (end > start) s = s.slice(start, end + 1);
    }

    return safeJSON(s);
  }

  // -----------------------------------------------------------------------
  // 2. 持久化 (localStorage)
  // -----------------------------------------------------------------------
  function loadSettings() {
    const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = raw ? safeJSON(raw, {}) : {};
    return Object.assign({}, DEFAULT_SETTINGS, parsed || {});
  }

  function saveSettings(s) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
    }
  }

  function loadState() {
    const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(STORAGE_KEYS.STATE);
    if (!raw) return seedDemoState();
    const parsed = safeJSON(raw, null);
    if (!parsed || !parsed.goals) return seedDemoState();
    // 兼容旧版本：补充缺失字段
    parsed.agentStates = parsed.agentStates || { planner: 'idle', executor: 'idle', reviewer: 'idle' };
    parsed.agentLast   = parsed.agentLast   || { planner: '', executor: '', reviewer: '' };
    parsed.activity    = parsed.activity    || [];
    parsed.day         = parsed.day         || 1;
    return parsed;
  }

  function saveState(s) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(s));
    }
  }

  // -----------------------------------------------------------------------
  // 3. Demo State Seed（首次打开时塞入示例数据）
  //    场景：林梓桐 · 大三 · 考研复习目标，已经推进到第 5 天
  // -----------------------------------------------------------------------
  function seedDemoState() {
    const goalId = 'goal-' + uuid();
    const baseTasks = [
      { title: '高数 · 第 1 章函数与极限', day: 1, est: 90 },
      { title: '英语 · 阅读 2 篇 + 长难句精读', day: 1, est: 60 },
      { title: '政治 · 马原 第 1 节 视频课', day: 2, est: 45 },
      { title: '高数 · 第 1 章习题 1-30', day: 2, est: 90 },
      { title: '英语 · 真题词汇本前 200 词', day: 3, est: 60 },
      { title: '高数 · 第 2 章导数与微分 概念', day: 3, est: 90 },
      { title: '政治 · 史纲 第 1 章 时间线整理', day: 4, est: 50 },
      { title: '英语 · 阅读 2 篇 + 写作模板背诵', day: 4, est: 60 },
      { title: '高数 · 第 2 章习题精选', day: 5, est: 90 },
      { title: '错题本 · 把本周错题分类整理', day: 5, est: 45 },
      { title: '专业课 · 第 1 章导论 通读', day: 5, est: 60 },
      { title: '高数 · 第 3 章中值定理 概念', day: 6, est: 80 },
      { title: '英语 · 阅读 + 翻译练习', day: 6, est: 60 },
      { title: '周复盘 · 总结本周高低产时段', day: 7, est: 30 },
    ];
    const tasks = baseTasks.map((t, i) => ({
      id: 't-' + uuid(),
      title: t.title,
      goalId,
      day: t.day,
      est: t.est,
      agent: 'planner',
      done: t.day < 5,  // 前 4 天的任务大部分已完成
    }));
    // 第 5 天故意留 1 项未完成，演示"今日"页面
    tasks.forEach((t, i) => {
      if (t.day === 5 && i % 2 === 0) t.done = true;
    });

    const goal = {
      id: goalId,
      title: '21 天完成考研数学一轮第一阶段',
      description: '林梓桐 · 大三 · 目标分数 380+ · 重点突破高数前 3 章',
      deadline: '2025-12-21',
      priority: 'high',
      createdAt: Date.now() - 5 * 86400000,
      progress: 0,
      tasks,
    };
    goal.progress = goal.tasks.filter(t => t.done).length / goal.tasks.length;

    return {
      goals: [goal],
      activeGoalId: goalId,
      day: 5,
      activity: [
        { ts: '07:12:08', agent: 'executor', action: 'push', summary: '推送今日 3 项任务 · 建议优先做高数习题' },
        { ts: '08:30:24', agent: 'user',     action: 'check', summary: '完成「高数 · 第 2 章习题精选」' },
        { ts: '10:05:11', agent: 'user',     action: 'check', summary: '完成「错题本 · 把本周错题分类整理」' },
        { ts: '14:22:45', agent: 'executor', action: 'insight', summary: '检测到「专业课导论」连续 2 天未推进 · 建议拆为 25 分钟单元' },
      ],
      agentStates: { planner: 'idle', executor: 'idle', reviewer: 'idle' },
      agentLast: {
        planner: '已为「考研数学」生成 14 项任务',
        executor: '今日 2/3 完成 · 节奏良好',
        reviewer: '等待周日 22:00 自动触发',
      },
    };
  }

  // -----------------------------------------------------------------------
  // 4. Memory 快照（供右下角 Memory Inspector 展示）
  // -----------------------------------------------------------------------
  function memorySnapshot(state) {
    const activeGoal = state.goals.find(g => g.id === state.activeGoalId);
    return {
      meta: {
        version: 'yuki-memory/v1',
        day: state.day,
        snapshot_at: new Date().toISOString(),
      },
      active_goal: activeGoal ? {
        id: activeGoal.id,
        title: activeGoal.title,
        progress: Number((activeGoal.progress || 0).toFixed(2)),
        tasks_total: activeGoal.tasks.length,
        tasks_done: activeGoal.tasks.filter(t => t.done).length,
        deadline: activeGoal.deadline,
      } : null,
      agent_states: state.agentStates,
      recent_activity: (state.activity || []).slice(-8),
    };
  }

  // -----------------------------------------------------------------------
  // 5. Agent System Prompts（基于简历"明确各 Agent 的 Prompt 范式与工具调用边界"）
  // -----------------------------------------------------------------------
  const PROMPTS = {
    planner: `你是 Yuki 的「规划师 Agent」。
身份：战略家 · 简洁 · 结构化。
任务：把用户给定的成长目标拆解成可在 7-21 天内逐日推进的任务树。

规则：
1. 输出**严格 JSON**：{"tasks":[{"title":"...","day":1,"est":60,"priority":"high|medium|low"}]}
2. 任务数量 7-21 项；单任务估时 30-90 分钟。
3. 优先安排"高认知负荷"任务在用户高产时段（默认上午）。
4. 不要任何额外解释、不要 markdown、不要中文标点。
5. 若用户目标信息不足，先按最常见路径拆解，不向用户回问。`,

    executor: `你是 Yuki 的「执行官 Agent」。
身份：教练 · 鼓励 · 具体 · 不奉承。
输入：Shared Memory 全量快照（goals / tasks / activity / day）。
任务：读取当前进度，输出今日推进建议 + 1 句洞察 + 可选卡点。

规则：
1. 输出**严格 JSON**：{"today":["任务1","任务2"], "insight":"一句话洞察 ≤30 字", "blocker":"可选 · 卡点描述 ≤40 字"}
2. 仅在确实检测到"分配 day < 当前 day - 2 且未完成"时才输出 blocker，否则该字段为空字符串。
3. 不出现"加油"、"你真棒"等情绪奖励词。
4. 风格示例："今天剩 2 项，先做硬的"。`,

    reviewer: `你是 Yuki 的「复盘师 Agent」。
身份：顾问 · 中性 · 洞察。
输入：整周 Shared Memory 与 activity 事件流。
任务：生成本周复盘报告。

规则：
1. 输出**严格 JSON**：{"summary":"整体一段话 ≤80 字","insights":["洞察1","洞察2","洞察3"],"next_week":["建议1","建议2","建议3"]}
2. insights 必须基于具体数据，不能是套话（"要继续努力" 是套话）。
3. 至少 1 条 insight 指出"低产时段 / 高产时段 / 异常事件"。
4. next_week 每条都要能直接转化为下周排期动作。
5. 不出现 emoji、不出现 markdown。`,
  };

  // -----------------------------------------------------------------------
  // 6. LLM Adapter（统一接口）
  // -----------------------------------------------------------------------
  async function callLLM(messages, settings, opts) {
    opts = opts || {};
    const provider = (settings && settings.provider) || 'demo';

    if (provider === 'demo')          return demoLLM(messages, opts);
    if (provider === 'claude-builtin')return claudeBuiltinLLM(messages, opts);
    if (provider === 'anthropic')     return anthropicLLM(messages, settings, opts);
    if (provider === 'openai')        return openaiLLM(messages, settings, opts);
    if (provider === 'deepseek')      return deepseekLLM(messages, settings, opts);

    throw new Error('未知 provider: ' + provider);
  }

  // 6.1 Anthropic
  async function anthropicLLM(messages, settings, opts) {
    if (!settings.apiKey) throw new Error('Anthropic 需要 API Key');
    const sysMsg = messages.find(m => m.role === 'system');
    const userMsgs = messages.filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
    const body = {
      model: settings.model || PROVIDER_DEFAULTS.anthropic.model,
      max_tokens: opts.maxTokens || 1024,
      system: sysMsg ? sysMsg.content : undefined,
      messages: userMsgs,
    };
    const r = await fetch(PROVIDER_DEFAULTS.anthropic.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error('Anthropic HTTP ' + r.status + ': ' + await r.text());
    const j = await r.json();
    return j.content && j.content[0] && j.content[0].text || '';
  }

  // 6.2 OpenAI / DeepSeek（共用 OpenAI Chat Completions 协议）
  async function chatCompletionsLLM(messages, settings, opts, profile) {
    if (!settings.apiKey) throw new Error(profile.name + ' 需要 API Key');
    const body = {
      model: settings.model || profile.defaultModel,
      messages,
      max_tokens: opts.maxTokens || 1024,
      temperature: opts.temperature ?? 0.5,
    };
    const r = await fetch(profile.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + settings.apiKey,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(profile.name + ' HTTP ' + r.status + ': ' + await r.text());
    const j = await r.json();
    return j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '';
  }
  function openaiLLM(messages, settings, opts) {
    return chatCompletionsLLM(messages, settings, opts, {
      name: 'OpenAI',
      defaultModel: PROVIDER_DEFAULTS.openai.model,
      endpoint: PROVIDER_DEFAULTS.openai.endpoint,
    });
  }
  function deepseekLLM(messages, settings, opts) {
    return chatCompletionsLLM(messages, settings, opts, {
      name: 'DeepSeek',
      defaultModel: PROVIDER_DEFAULTS.deepseek.model,
      endpoint: PROVIDER_DEFAULTS.deepseek.endpoint,
    });
  }

  // 6.3 Claude Builtin（部署在 Claude 平台时可用）
  async function claudeBuiltinLLM(messages, opts) {
    if (typeof window === 'undefined' || !window.claude || !window.claude.complete) {
      // 平台不可用时优雅降级到 Demo
      return demoLLM(messages, opts);
    }
    const sys = messages.find(m => m.role === 'system');
    const user = messages.filter(m => m.role !== 'system')
      .map(m => m.content).join('\n\n');
    const prompt = (sys ? sys.content + '\n\n---\n\n' : '') + user;
    return await window.claude.complete(prompt);
  }

  // 6.4 Demo LLM（关键：保证首次打开就能完整跑通三 Agent 闭环）
  async function demoLLM(messages, opts) {
    await sleep(400 + Math.random() * 600);
    const sys = (messages.find(m => m.role === 'system') || {}).content || '';
    const user = (messages.filter(m => m.role !== 'system').pop() || {}).content || '';

    // 根据 system prompt 关键词识别是哪个 Agent
    if (sys.includes('规划师')) return demoPlanner(user);
    if (sys.includes('执行官')) return demoExecutor(user);
    if (sys.includes('复盘师')) return demoReviewer(user);

    return JSON.stringify({ message: 'Demo 模式：未识别 Agent 类型' });
  }

  function demoPlanner(userInput) {
    const lower = String(userInput || '').toLowerCase();
    let template;

    if (/考研|考试|复习|备考/.test(userInput)) {
      template = [
        ['梳理考试大纲与分值结构',          1, 60, 'high'],
        ['整理参考书清单与学习路径',        1, 45, 'medium'],
        ['第 1 章 通读 + 摘要',             2, 90, 'high'],
        ['第 1 章 课后习题',                3, 90, 'high'],
        ['第 2 章 通读 + 笔记',             4, 90, 'high'],
        ['真题词汇 / 公式 第 1 批',         4, 60, 'medium'],
        ['第 2 章 习题精选',                5, 90, 'high'],
        ['错题本 · 第 1 周分类整理',        5, 45, 'medium'],
        ['第 3 章 通读',                    6, 90, 'high'],
        ['模拟测验 · 第 1-2 章范围',        7, 90, 'high'],
        ['周复盘 · 调整下周节奏',           7, 30, 'medium'],
      ];
    } else if (/读完|读书|阅读|书|本/.test(userInput)) {
      template = [
        ['通读目录与序言 · 建立全书框架',   1, 45, 'high'],
        ['第 1 章 阅读 + 摘要',             2, 60, 'high'],
        ['第 2 章 阅读 + 摘要',             3, 60, 'high'],
        ['第 3 章 阅读 + 摘要',             4, 60, 'high'],
        ['整理本周笔记 · 输出 1 篇短文',    5, 60, 'medium'],
        ['第 4 章 阅读 + 摘要',             6, 60, 'high'],
        ['第 5 章 阅读 + 摘要',             7, 60, 'high'],
        ['总复盘 · 全书思维导图',           8, 90, 'high'],
      ];
    } else if (/秋招|求职|找工作|面试|简历/.test(userInput)) {
      template = [
        ['梳理目标岗位与公司清单',          1, 60, 'high'],
        ['简历 v1 · STAR 法重写经历',       2, 90, 'high'],
        ['第 1 批 网申 5 家 + 内推',        3, 60, 'high'],
        ['行为面常见问题 · 写下答案',       4, 60, 'high'],
        ['专业知识自检 · 列出薄弱点',       4, 45, 'medium'],
        ['薄弱点补齐 1',                    5, 90, 'medium'],
        ['模拟面试 1 次 + 复盘',            6, 60, 'high'],
        ['第 2 批 网申 + 简历微调',         7, 60, 'medium'],
        ['周复盘 · 渠道转化率分析',         7, 30, 'medium'],
      ];
    } else {
      template = [
        ['第 1 天 · 启动与目标拆解',        1, 60, 'high'],
        ['第 2 天 · 进入核心动作',          2, 90, 'high'],
        ['第 3 天 · 巩固与练习',            3, 75, 'medium'],
        ['第 4 天 · 拓展与延伸',            4, 75, 'medium'],
        ['第 5 天 · 阶段小测',              5, 60, 'high'],
        ['第 6 天 · 弱项强化',              6, 75, 'medium'],
        ['第 7 天 · 总复盘 + 调整',         7, 45, 'high'],
      ];
    }

    const tasks = template.map(([title, day, est, priority]) => ({
      title, day, est, priority
    }));
    return JSON.stringify({ tasks });
  }

  function demoExecutor(userInputOrSnapshot) {
    const options = [
      {
        today: ['高数 · 第 2 章习题精选', '错题本 · 分类整理', '专业课导论 通读'],
        insight: '今天剩 2 项硬任务，建议先做高数',
        blocker: '"专业课导论" 连续 2 天未推进 · 建议拆为 25 分钟单元先开始',
      },
      {
        today: ['英语 · 阅读 2 篇', '高数 · 第 3 章概念', '政治 · 史纲时间线'],
        insight: '昨日完成率 100%，今天可挑战难度',
        blocker: '',
      },
      {
        today: ['错题本回顾', '高数 · 模拟题 1 套', '英语 · 真题词汇 200'],
        insight: '本周周三完成率最低，硬任务建议避开周三',
        blocker: '',
      },
    ];
    const pick = options[Math.floor(Math.random() * options.length)];
    return JSON.stringify(pick);
  }

  function demoReviewer(userInputOrSnapshot) {
    return JSON.stringify({
      summary: '本周完成率 81%（17/21），节奏整体稳定。周一、周五是高产日，周三明显低产，可能是课程密度问题。',
      insights: [
        '高产时段：周一上午、周五晚上 · 适合安排硬任务',
        '低产日：周三 · 完成率仅 1/4，建议把硬任务避开',
        '"专业课导论" 任务连续 2 天卡点，拆为 25 分钟单元后当天即推进 60%',
      ],
      next_week: [
        '把高数难章节集中排在周一上午',
        '周三调整为"轻负荷 + 复习"，不安排新内容',
        '继续维持错题本周日整理的节奏',
      ],
    });
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // -----------------------------------------------------------------------
  // 7. Bad Case 库（简历："建立 Bad Case 库反哺 Prompt 优化"）
  // -----------------------------------------------------------------------
  function recordBadCase(entry) {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEYS.BAD_CASES);
    const arr = (raw && safeJSON(raw, [])) || [];
    arr.push(Object.assign({ ts: new Date().toISOString() }, entry));
    // 保留最近 200 条
    const trimmed = arr.slice(-200);
    localStorage.setItem(STORAGE_KEYS.BAD_CASES, JSON.stringify(trimmed));
  }
  function listBadCases() {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEYS.BAD_CASES);
    return (raw && safeJSON(raw, [])) || [];
  }

  // -----------------------------------------------------------------------
  // 8. LLM-as-Judge（评估集自动评分骨架，简历："引入 LLM-as-Judge 自动化评分机制"）
  // -----------------------------------------------------------------------
  const JUDGE_PROMPT = `你是 Yuki 评估集的「LLM-as-Judge」。
任务：给定 (输入 input, 期望特征 expect, 实际输出 actual)，从 4 个维度打分 1-5：
- 结构性 (是否符合 JSON 协议)
- 可执行性 (任务能否被普通大学生立刻开始)
- 信息密度 (有没有套话 / 废话)
- 个性化 (是否结合了用户场景)

输出严格 JSON：
{"scores":{"structure":n,"executable":n,"density":n,"personalization":n},"reasoning":"≤60 字","is_bad_case":bool}`;

  async function judgeOutput({ input, expect, actual, settings }) {
    const messages = [
      { role: 'system', content: JUDGE_PROMPT },
      { role: 'user',   content: `INPUT:\n${input}\n\nEXPECT:\n${expect}\n\nACTUAL:\n${actual}` },
    ];
    try {
      const txt = await callLLM(messages, settings, { maxTokens: 400, temperature: 0.0 });
      const parsed = looseJSON(txt);
      if (parsed && parsed.scores) return parsed;
    } catch (e) {
      // Demo 模式下走启发式评分
    }
    // 启发式 fallback：结构性看 JSON 是否解析、其它给中位分
    const struct = looseJSON(actual) ? 5 : 1;
    return {
      scores: { structure: struct, executable: 4, density: 4, personalization: 3 },
      reasoning: '启发式评分（Demo / 离线模式）',
      is_bad_case: struct < 4,
    };
  }

  // -----------------------------------------------------------------------
  // 9. Agent 运行入口
  // -----------------------------------------------------------------------
  async function runPlanner(goalInput, settings) {
    const userText = typeof goalInput === 'string'
      ? goalInput
      : [
          '目标：' + (goalInput.title || ''),
          goalInput.description ? '描述：' + goalInput.description : '',
          goalInput.deadline ? '截止：' + goalInput.deadline : '',
        ].filter(Boolean).join('\n');

    const messages = [
      { role: 'system', content: PROMPTS.planner },
      { role: 'user',   content: userText },
    ];
    const raw = await callLLM(messages, settings, { maxTokens: 1200, temperature: 0.4 });
    const parsed = looseJSON(raw);
    if (!parsed || !Array.isArray(parsed.tasks)) {
      recordBadCase({ agent: 'planner', input: userText, raw, reason: 'invalid_json' });
      // 降级：用模板兜底
      const fallback = looseJSON(demoPlanner(userText));
      return fallback || { tasks: [] };
    }
    return parsed;
  }

  async function runExecutor(state, settings) {
    const snapshot = memorySnapshot(state);
    const userText = 'MEMORY_SNAPSHOT:\n' + JSON.stringify(snapshot, null, 2);
    const messages = [
      { role: 'system', content: PROMPTS.executor },
      { role: 'user',   content: userText },
    ];
    const raw = await callLLM(messages, settings, { maxTokens: 600, temperature: 0.5 });
    const parsed = looseJSON(raw);
    if (!parsed || !parsed.insight) {
      recordBadCase({ agent: 'executor', input: userText, raw, reason: 'missing_insight' });
      return looseJSON(demoExecutor(userText));
    }
    return parsed;
  }

  async function runReviewer(state, settings) {
    const snapshot = memorySnapshot(state);
    const userText = 'WEEKLY_MEMORY:\n' + JSON.stringify(snapshot, null, 2) +
                     '\n\nACTIVITY:\n' + JSON.stringify((state.activity || []).slice(-30), null, 2);
    const messages = [
      { role: 'system', content: PROMPTS.reviewer },
      { role: 'user',   content: userText },
    ];
    const raw = await callLLM(messages, settings, { maxTokens: 1000, temperature: 0.6 });
    const parsed = looseJSON(raw);
    if (!parsed || !parsed.summary) {
      recordBadCase({ agent: 'reviewer', input: userText, raw, reason: 'missing_summary' });
      return looseJSON(demoReviewer(userText));
    }
    return parsed;
  }

  // -----------------------------------------------------------------------
  // 10. 导出
  // -----------------------------------------------------------------------
  global.YukiEngine = {
    // 持久化
    loadState, saveState, loadSettings, saveSettings, seedDemoState,
    // Agent
    runPlanner, runExecutor, runReviewer,
    // 工具
    memorySnapshot, uuid, nowTs, callLLM, looseJSON,
    // Bad Case & Eval
    recordBadCase, listBadCases, judgeOutput,
    // 常量（调试用）
    PROMPTS, STORAGE_KEYS, PROVIDER_DEFAULTS,
  };

})(typeof window !== 'undefined' ? window : globalThis);
