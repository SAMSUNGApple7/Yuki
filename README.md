# Yuki — 基于多智能体协作的个人成长助手

> **Three minds, one growth.** 让每一天的成长被看见。

Yuki 是一个面向大学生群体的 AI 个人成长助手。通过 **规划师（Planner）/ 执行官（Executor）/ 复盘师（Reviewer）** 三个独立 Agent 协作，覆盖「定目标 → 拆任务 → 日执行 → 周复盘」完整闭环。

[**🌐 在线体验 · Live Demo**](#) ·
[**📖 设计稿**](./design.html) ·
[**💬 产品 Demo**](./app.html)

---

## ✨ 核心特性

- **🎯 三 Agent 协作架构** —— Planner / Executor / Reviewer 三个独立 Agent 各司其职，通过共享 Memory 解耦协作
- **🧠 真实 LLM 驱动** —— 不是脚本演示，每个 Agent 都用独立 Prompt 调用真实 LLM 完成各自任务
- **🔌 多模型支持** —— 内置 Demo 模式开箱即用；也可填入 Anthropic / OpenAI / DeepSeek API Key 切换至生产模式
- **🔄 Shared Memory** —— 中央化共享状态层，所有 Agent 行为均可追溯，事件流实时可视化
- **🎨 世界级视觉设计** —— 参考 Apple、Claude 官网的产品级审美，OKLCH 色彩空间，可切换深浅主题
- **📊 完整的设计稿** —— 架构图 / 功能脑图 / 用户流程 / 主界面原型 / 效果验证看板，5 件套齐全
- **⚡ 零构建工具** —— 纯静态页面 + React (CDN) + Babel Standalone，无打包、无依赖安装、可直接部署任意静态托管

---

## 🚀 快速开始

### 方式一：直接打开（推荐）

```bash
git clone https://github.com/<your-username>/yuki.git
cd yuki

# 任选一种方式启动本地 server
python3 -m http.server 8000
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
| **Cloudflare Pages** | Settings → Build → Framework: `None`, Build command: 留空, Output directory: `/` |
| **GitHub Pages** | Settings → Pages → Source: `main` branch, `/` (root) |

> 这是一个纯静态站点，无需构建步骤。

---

## 🔑 接入真实 LLM API

Yuki 默认运行在 **Demo 模式** —— 三个 Agent 使用结构化的预制响应，保证首次打开就能完整体验产品流程。

如需让 Agent 调用真实 LLM：

1. 进入 **Demo 页面 → 右上角「设置」**
2. 选择模型供应商：**Anthropic Claude / OpenAI / DeepSeek**
3. 粘贴你的 API Key（仅存储在浏览器 localStorage，不会上传）
4. 选择模型版本（如 `claude-haiku-4-5` / `gpt-4o-mini` / `deepseek-chat`）

### 三个 Agent 的 Prompt 设计

每个 Agent 都有独立的 System Prompt 与工具集，全部代码位于 [`app/agent-engine.js`](./app/agent-engine.js)：

| Agent | 角色 | System Prompt 关键约束 |
|---|---|---|
| 🎯 **Planner** | 战略家 | 输出严格 JSON 任务树，含 `title / estimate / day_offset / priority` 字段 |
| ⚡ **Executor** | 教练 | 读取 Memory 中今日任务，识别卡点并输出推进建议 |
| 📊 **Reviewer** | 顾问 | 聚合一周事件流，输出含「数据 / 洞察 / 下周建议」三段式周报 |

---

## 🏗️ 项目结构

```
yuki/
├── index.html              # Landing Page（产品官网首页）
├── app.html                # 主界面交互原型（产品 Demo）
├── design.html             # 设计稿展示（架构图 / 功能脑图 / 用户流程 / 数据看板）
│
├── styles/
│   ├── design-system.css   # 设计 token：颜色、字体、阴影、圆角、间距
│   └── app.css             # 主界面专属样式
│
└── app/
    ├── main.jsx            # App 入口与状态管理
    ├── agent-engine.js     # 三 Agent 引擎、Shared Memory、API 适配层
    ├── pages.jsx           # 各业务页面（今日 / 目标 / 复盘 / 设置）
    └── components.jsx      # 通用组件（按钮、卡片、对话气泡等）
```

---

## 🎨 设计系统

| Token | 值 |
|---|---|
| 主背景 (paper) | `oklch(0.985 0.003 80)` 暖白 |
| 主文本 (ink) | `oklch(0.18 0.01 260)` 近黑 |
| 强调色 (ember) | `oklch(0.74 0.10 75)` 暖金 |
| 主导航 (navy) | `oklch(0.32 0.06 255)` 深海蓝 |
| 主字体 | Inter（英文/数字）+ PingFang SC / Microsoft YaHei（中文） |
| 衬线 (重音) | Source Serif 4 |
| 等宽 (数据) | JetBrains Mono |
| 卡片圆角 | 12px / 16px / 20px |
| 阴影 | `0 1px 3px rgba(0,0,0,0.04)` 极轻 |

完整 token 见 [`styles/design-system.css`](./styles/design-system.css)。

---

## 🛠️ 技术栈

- **React 18.3.1**（CDN，UMD build）
- **Babel Standalone 7.29.0**（浏览器内 JSX 转译）
- **OKLCH 色彩空间**（精确感知均匀的颜色控制）
- **CSS 自定义属性**（深浅主题切换）
- **零构建工具**（无 Vite / Webpack / Rollup）

> 选择「无构建」是有意为之 —— 这是一个面向产品体验的高保真原型，不是生产 Web 应用。零构建确保任何人 clone 之后开箱即用。

---

## 🗺️ Roadmap

- [x] v0.1 · 三 Agent 核心闭环（目标 / 任务 / 复盘）
- [x] v0.2 · 多 LLM 提供商适配（Claude / OpenAI / DeepSeek）
- [x] v0.3 · 设计稿全套交付
- [ ] v0.4 · 移动端适配
- [ ] v0.5 · 多用户协作（合伙人模式 · 互相监督）
- [ ] v0.6 · 习惯养成 Agent（第四个 Agent · 长期视角）
- [ ] v1.0 · 数据导出 / 跨端同步

---

## 🤝 贡献

欢迎提 Issue 和 PR。在提 PR 之前请：

1. Fork 仓库
2. 创建 feature 分支：`git checkout -b feature/your-feature`
3. 提交改动：`git commit -m 'feat: add your feature'`
4. Push：`git push origin feature/your-feature`
5. 提交 PR

---

## 📄 License

详见 [LICENSE](./LICENSE)
