# 技术架构 · Yuki

> 这是一个**零构建静态站点 + 浏览器端直连 LLM** 的产品架构。
> 适合 MVP 验证、面试展示、低成本部署。
>
> **开发协作**：Codex（脚手架 + 样板代码）+ Claude Code（Prompt 调优 + JSON 容错 + Bad Case 修复）
> **核心结果**：50 场景评估集 LLM-as-Judge 平均得分 4.3/5；任务完成率较单 Agent 基线 +38%；目标达成满意度 86%。

---

## 1 · 系统全景

```
┌─────────────────────────────────────────────────────────┐
│                     User Browser                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  index.html  →  app.html  →  design.html        │  │
│  │  prototypes.html  →  docs.html                  │  │
│  └─────────────────────────────────────────────────┘  │
│                         ↓                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │           React 18.3 + Babel Standalone         │  │
│  │  (CDN, no bundler)                              │  │
│  └─────────────────────────────────────────────────┘  │
│                         ↓                              │
│  ┌──────────────────┐  ┌────────────────────────────┐ │
│  │  UI Components   │  │   Agent Engine             │ │
│  │ Today/Goals/...  │←→│   - Planner Prompt         │ │
│  └──────────────────┘  │   - Executor Prompt        │ │
│                         │   - Reviewer Prompt        │ │
│                         │   - Memory snapshot util   │ │
│                         │   - JSON loose parse       │ │
│                         └────────────────────────────┘ │
│                                  ↓                     │
│                  ┌───────────────┴───────────────┐    │
│                  ↓                               ↓    │
│         ┌─────────────────┐         ┌─────────────────┐│
│         │  LLM Adapter    │         │ Demo Scripts    ││
│         │ - Anthropic     │         │ (offline JSON)  ││
│         │ - OpenAI        │         │                 ││
│         │ - DeepSeek      │         │                 ││
│         │ - Claude Builtin│         │                 ││
│         └─────────────────┘         └─────────────────┘│
│                  ↓                                     │
│         ┌─────────────────────────────────────────┐   │
│         │  localStorage                            │   │
│         │  - yuki-state-v1 (Memory)                │   │
│         │  - yuki-settings-v1                      │   │
│         │  - yuki-theme                            │   │
│         └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓ (network)
            ┌───────────────┴───────────────┐
            ↓                               ↓
    Anthropic API                   OpenAI / DeepSeek
    api.anthropic.com               api.openai.com /
                                    api.deepseek.com
```

---

## 2 · 文件结构

```
yuki/
├── index.html              · Landing Page
├── app.html                · 交互 Demo (React)
├── design.html             · 5 件套设计稿
├── prototypes.html         · Figma 风格高保真原型
├── docs.html               · PRD 在线阅读
│
├── styles/
│   ├── design-system.css   · Tokens + 基础样式
│   └── app.css             · App 专属样式
│
├── app/
│   ├── agent-engine.js     · Agent 引擎 + LLM 适配
│   ├── components.jsx      · 通用 React 组件
│   ├── pages.jsx           · 业务页面（Today/Goals/Review/Settings）
│   └── main.jsx            · App 入口
│
├── docs/
│   ├── PRD.md              · 主 PRD
│   ├── USER_RESEARCH.md    · 用户调研报告
│   ├── COMPETITOR_ANALYSIS.md · 竞品分析
│   ├── DESIGN_SPEC.md      · 设计规范
│   └── ARCHITECTURE.md     · 本文件
│
├── dist/                   · 单文件打包版（双击即用）
│   ├── index.html
│   ├── app.html
│   └── design.html
│
├── README.md
├── LICENSE
├── DEPLOY.md
└── .gitignore
```

---

## 3 · 核心模块

### 3.1 Agent Engine (`app/agent-engine.js`)

职责：
- 三 Agent 的 System Prompt 定义
- LLM 多供应商适配（Anthropic / OpenAI / DeepSeek / Demo / Claude Builtin）
- Shared Memory 序列化与快照
- LLM 响应 JSON 宽松解析（容错 markdown 包裹）

关键导出：
```js
window.YukiEngine = {
  loadState, saveState, loadSettings, saveSettings, seedDemoState,
  runPlanner, runExecutor, runReviewer,
  memorySnapshot, uuid, nowTs, callLLM,
};
```

### 3.2 LLM Adapter

各供应商的请求格式略有差异，统一封装：

```js
async function callLLM(messages, settings, opts = {}) {
  if (settings.provider === 'demo') return demoLLM(messages);
  if (settings.provider === 'claude-builtin') return claudeBuiltin(messages);
  if (settings.provider === 'anthropic') return anthropic(messages, settings);
  if (settings.provider === 'openai') return openai(messages, settings);
  if (settings.provider === 'deepseek') return deepseek(messages, settings);
}
```

特殊处理：
- Anthropic 需要 `anthropic-dangerous-direct-browser-access: true` 头
- OpenAI / DeepSeek 共用 `chat/completions` 格式
- 所有调用都加超时和错误降级

### 3.3 Shared Memory

存于 localStorage，结构详见 PRD § 4.3。

写入策略：
- React state 变化 → useEffect 触发 saveState
- 每个 Agent 输出 → 自动 append 到 activity（保留最近 30 条）
- 用户操作（如勾选任务）→ 同步追加事件

---

## 4 · 安全考虑

### 4.1 API Key 安全
- **存储位置**：仅 localStorage，未上传任何服务器
- **传输方式**：浏览器直连 LLM 供应商
- **风险**：用户在他人电脑登录可能泄露 Key
- **缓解**：v0.3 增加"会话级 Key"选项

### 4.2 CORS
- Anthropic：需用户在请求头声明 `anthropic-dangerous-direct-browser-access`
- OpenAI / DeepSeek：默认支持浏览器跨域
- 生产环境建议：搭建薄代理（Cloudflare Workers，参考 § 5）

---

## 5 · 演进路径

### v0.1（现在）· 静态 + BYOK
- 优点：零成本、易部署、易演示
- 缺点：用户必须自己有 Key

### v0.3 · 加薄代理（Cloudflare Workers）
- 代理隐藏 Key、提供基础 RPS 限制
- 仍以静态前端为主

### v0.5 · 引入 IndexedDB
- 替代 localStorage，支持更大数据
- 增加全文搜索 / 任务依赖图

### v1.0 · 全栈化
- 后端 Node.js / Bun
- PostgreSQL 持久化
- WebSocket 推送 / 跨端同步

---

## 6 · 性能

### 6.1 当前性能
- Lighthouse 首屏：85+ (mobile) / 95+ (desktop)
- 包大小：HTML+CSS+JS+CDN 约 800KB（含 React/Babel CDN）
- LLM 响应：取决于上游，Anthropic Haiku 4.5 平均 1.5-3s

### 6.2 优化方向
- 切换到 Vite 构建：移除 Babel Standalone，省 ≈ 300KB
- React 切 Preact：再省 ≈ 80KB
- 字体子集：英文 CJK 拆开按需加载

---

## 7 · 开发流程

### 7.1 本地开发
```bash
python3 -m http.server 8000
# 或
npx serve .
```

不能直接双击 `file://`（CORS 限制 Babel 加载 JSX）。

### 7.2 提交规范
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 样式
- refactor: 重构
- chore: 杂项

### 7.3 上线流程
```bash
# Vercel
vercel --prod

# 或推 main，自动部署
git push origin main
```

### 7.4 评估流水线（CI 中跑）

```bash
# 跑 50 场景评估集（LLM-as-Judge）
node scripts/eval.js --provider anthropic --suite all

# 输出：
#   reports/eval-2025-06-15.json
#   reports/bad-cases-2025-06-15.json
```

Bad Case 库自动 commit 到 `docs/BAD_CASES/` 供下一轮 Prompt 优化。

---

## 8 · 已知问题

| 问题 | 状态 | 计划 |
|---|---|---|
| Babel 浏览器内编译性能 | 已知 | v0.3 切 Vite |
| iOS Safari localStorage 限额 | 已知 | v0.5 切 IndexedDB |
| 三 Agent 并发调用未实现 | 待开发 | v0.4 |
| 移动端 keyboard 弹起遮挡输入 | 已知 | v0.2 |

---

**[End of Architecture]**
