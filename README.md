<div align="center">

# Yuki

**基于多智能体协作的个人成长助手**

*Three minds, one growth.   让每一天的成长被看见。*

[![License: MIT](https://img.shields.io/badge/License-MIT-c69b4f.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/React-18.3-1f4e79.svg)](https://react.dev)
[![Status](https://img.shields.io/badge/status-MVP%20v0.1-success.svg)](#)
[![中文](https://img.shields.io/badge/lang-中文-red.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)

[**🌐 在线 Demo**](#) ·
[**📐 Figma 原型**](./prototypes.html) ·
[**🖼 设计稿**](./design.html) ·
[**💬 产品 Demo**](./app.html) ·
[**📄 完整 PRD**](./docs.html) ·
[**📊 评估报告**](./docs/EVAL_REPORT.md)

</div>

---

Yuki 是一个面向**大学生群体**的 AI 个人成长助手。
通过 **规划师 / 执行官 / 复盘师** 三个独立 Agent 协作，覆盖「定目标 → 拆任务 → 日执行 → 周复盘」完整闭环。

> **关键结果**：50 场景评估集 LLM-as-Judge 综合得分 **4.3/5**；任务完成率较单 Agent 基线提升 **+38%**；目标达成满意度 **86%**。

---

## ✨ 核心特性

- **🎯 三 Agent 协作架构** —— Planner / Executor / Reviewer 各司其职，通过 Shared Memory 解耦协作
- **🧠 真实 LLM 驱动** —— 不是脚本演示，每个 Agent 用独立 Prompt 调用真实 LLM 完成任务
- **🔌 多模型支持** —— 内置 Demo 模式开箱即用；可填入 Anthropic / OpenAI / DeepSeek API Key 切到生产
- **🔄 Shared Memory** —— 中心化共享状态层，所有 Agent 行为可追溯，事件流实时可视化
- **📊 LLM-as-Judge + Bad Case 库** —— 50 场景评估集自动评分，反哺 Prompt 优化
- **🎨 世界级视觉设计** —— OKLCH 色彩空间，深浅主题切换，参考 Apple / Anthropic 审美
- **⚡ 零构建工具** —— 纯静态页面 + React (CDN) + Babel Standalone，clone 即可部署

---

## 🚀 快速开始

### 方式一：直接打开（推荐）

```bash
git clone https://github.com/SAMSUNGApple7/Yuki.git
cd Yuki

# 任选一种方式启动本地 server（不能直接双击 .html，CORS 限制）
python -m http.server 8000
# 或
npx serve .
# 或
php -S localhost:8000
```

打开浏览器访问 `http://localhost:8000`。

### 方式二：一键部署

| 平台 | 部署方式 |
|---|---|
| **Vercel** | 在 [vercel.com/new](https://vercel.com/new) 导入仓库，无需配置 |
| **Netlify** | 在 [app.netlify.com](https://app.netlify.com/start) 连接仓库即可 |
| **Cloudflare Pages** | Framework: `None` · Build command: 留空 · Output directory: `/` |
| **GitHub Pages** | Settings → Pages → Source: `main` branch, `/` (root) |

> Yuki 是纯静态站点，无需构建步骤。

---

## 🔑 接入真实 LLM API

Yuki 默认运行在 **Demo 模式** —— 三个 Agent 使用结构化预制响应，保证首次打开就能完整体验产品流程。

如需让 Agent 调用真实 LLM：

1. 进入 **Demo 页面 → 右上角设置**
2. 选择模型供应商：**Anthropic Claude / OpenAI / DeepSeek**
3. 粘贴 API Key（仅存于浏览器 localStorage，不上传）
4. 选择模型版本（如 `claude-haiku-4-5` / `gpt-4o-mini` / `deepseek-chat`）

### 三个 Agent 的 Prompt 设计

| Agent | 角色 | 关键约束 |
|---|---|---|
| 🎯 **规划师 Planner** | 战略家 | 输出严格 JSON 任务树：`{title / day / est / priority}` |
| ⚡ **执行官 Executor** | 教练 | 读取 Memory 今日任务，识别卡点并输出推进建议 |
| 📊 **复盘师 Reviewer** | 顾问 | 聚合一周事件流，输出「数据 / 洞察 / 下周建议」三段式 |

完整 System Prompt 见 [`app/agent-engine.js`](./app/agent-engine.js) 中 `PROMPTS` 对象。

---

## 🏗️ 项目结构

```
yuki/
├── index.html              # Landing Page（产品官网）
├── app.html                # 主交互 Demo（React）
├── prototypes.html         # Figma 风格高保真原型 · 15 frames
├── design.html             # 设计稿展示
├── docs.html               # PRD 在线阅读页
│
├── styles/
│   ├── design-system.css   # 设计 token
│   └── app.css             # 主界面专属样式
│
├── app/
│   ├── main.jsx            # App 入口
│   ├── agent-engine.js     # 三 Agent 引擎 + LLM 适配 + Bad Case + LLM-as-Judge
│   ├── command-palette.jsx # ⌘K 命令面板
│   ├── pages.jsx           # 业务页面（今日 / 目标 / 复盘 / 设置）
│   └── components.jsx      # 通用组件
│
├── docs/
│   ├── PRD.md              # 主 PRD 文档（Markdown）
│   ├── Yuki_PRD.docx       # Word 版 PRD（大厂模板）
│   ├── USER_RESEARCH.md    # 用户调研报告（20 人深访 + 112 问卷）
│   ├── COMPETITOR_ANALYSIS.md  # 4 款竞品对标矩阵
│   ├── DESIGN_SPEC.md      # 设计规范
│   ├── ARCHITECTURE.md     # 技术架构
│   ├── EVAL_REPORT.md      # 50 场景评估集 + LLM-as-Judge 报告
│   └── USABILITY_TEST.md   # 2 轮可用性测试 · 3 版迭代
│
└── dist/                   # 单文件 bundle 版（双击即用）
```

---

## 📊 评估与验证

详见 [`docs/EVAL_REPORT.md`](./docs/EVAL_REPORT.md)。

### 50 场景评估集

| 大类 | 数量 | 子类 |
|---|---|---|
| 目标制定（规划师） | 20 | 学习 / 工作 / 健康 / 兴趣 |
| 任务追踪（执行官） | 20 | 健康 / 异常 / 卡点 |
| 复盘洞察（复盘师） | 10 | 高产周 / 低产周 / 转折周 |

### 关键指标对照

| 指标 | 单 Agent 基线 | Yuki 三 Agent | Δ |
|---|---|---|---|
| LLM-as-Judge 综合 | 3.4 / 5 | **4.3 / 5** | +26% |
| 任务完成率（21 天均值） | 51% | **70.4%** | **+38%** |
| 目标达成满意度 | — | **86%** | — |

---

## 🎨 设计系统

| Token | 值 |
|---|---|
| 主背景 (paper) | `oklch(0.985 0.003 80)` 暖白 |
| 主文本 (ink) | `oklch(0.18 0.01 260)` 近黑 |
| 强调色 (ember) | `oklch(0.74 0.10 75)` 暖金 |
| 主导航 (navy) | `oklch(0.32 0.06 255)` 深海蓝 |
| 规划师 / 执行官 / 复盘师 | 金 / 深蓝 / 青灰（OKLCH） |
| 主字体 | Inter + PingFang SC / 微软雅黑 |
| 衬线（重音） | Source Serif 4 |
| 等宽（数据） | JetBrains Mono |

完整 token 见 [`styles/design-system.css`](./styles/design-system.css)。

---

## 🛠️ 技术栈

- **React 18.3.1**（CDN UMD）
- **Babel Standalone 7.29.0**（浏览器内 JSX 转译）
- **OKLCH 色彩空间**
- **CSS 自定义属性**（深浅主题切换）
- **零构建工具**
- **开发协作**：Codex（脚手架）+ Claude Code（Prompt 调优 / Bad Case 修复）

---

## 🗺️ Roadmap

- [x] v0.1 · 三 Agent 核心闭环（目标 / 任务 / 复盘）
- [x] v0.1 · 多 LLM 提供商适配（Claude / OpenAI / DeepSeek）
- [x] v0.1 · 50 场景评估集 + LLM-as-Judge + Bad Case 库
- [x] v0.1 · 设计稿全套交付 + 15 Figma 高保真原型
- [ ] v0.2 · 移动端适配 + PWA
- [ ] v0.3 · 多 LLM 路由 + Cloudflare Workers 代理
- [ ] v0.5 · 习惯养成 Agent（第 4 个 Agent · 长期视角）
- [ ] v0.8 · 多用户协作（合伙人模式 · 互相监督）
- [ ] v1.0 · 数据导出 / 跨端同步 / iOS App

---

## 🤝 贡献

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。欢迎提 Issue 和 PR。

简要流程：
1. Fork 仓库
2. 创建 feature 分支：`git checkout -b feature/your-feature`
3. 提交改动：`git commit -m 'feat: add your feature'`
4. Push 并提交 PR

---

## 📄 License

[MIT](./LICENSE) © 2025 高一航

---

<div align="center">

由 **高一航**（Product Manager / Project Owner）2025.04 立项 · 2025.06 MVP 上线
开发协作：Codex · Claude Code

</div>
