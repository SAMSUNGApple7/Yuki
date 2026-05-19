# 贡献指南 · Contributing to Yuki

感谢你考虑为 Yuki 贡献！本项目欢迎 Issue、PR、设计建议、用户反馈。

---

## 🚦 在开始之前

1. **搜一下已有 Issue** —— 你想报的 bug / 提的需求，可能已经有人讨论过
2. **大改先开 Issue 讨论** —— 涉及 > 200 行变更的 PR 建议先开 issue 对齐方向
3. **小改直接 PR** —— 文案、样式、文档、bugfix 等可直接提

---

## 🛠️ 本地开发

```bash
git clone https://github.com/SAMSUNGApple7/Yuki.git
cd Yuki
python -m http.server 8000   # 或 npx serve .
# 访问 http://localhost:8000
```

**为什么不能直接双击 .html**：Babel Standalone 用 `fetch` 加载 `.jsx`，`file://` 协议下被 CORS 阻止。

---

## 📂 改动建议范围

| 类别 | 文件位置 | 备注 |
|---|---|---|
| Agent Prompt | `app/agent-engine.js` 中 `PROMPTS` | 改动需附 50 场景评估集回归报告 |
| UI 组件 | `app/components.jsx` | 配套样式在 `styles/app.css` |
| 页面 | `app/pages.jsx` | 单页应用主页面 |
| 命令面板 | `app/command-palette.jsx` | 仅扩展命令时改 |
| 设计 token | `styles/design-system.css` | 改 token 需附三主题截图 |
| 文档 | `docs/*.md` | PRD 改动需更新 Word 版（`docs/_build_prd_docx.py`） |
| 原型 | `prototypes.html` | 新增 frame 时记得更新底部 frame 计数 |

---

## ✅ Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat: 新增习惯养成 Agent
fix: 修复 ⌘K 在 Firefox 不触发
docs: 更新评估集到 80 场景
style: 调整暗色模式下复盘师卡片对比度
refactor: agent-engine 拆分 LLM adapter 到独立文件
chore: 升级 React CDN 到 18.3.2
```

PR 标题遵循同样规范。

---

## 🔍 评估集回归（重要）

任何改动 Agent Prompt 的 PR，需要：

1. 跑一次 50 场景评估集
2. 在 PR description 中贴出对照表（before / after 综合得分）
3. 列出 Bad Case 是否有增减

模板：

```markdown
### 评估集回归

| Agent | Before | After | Δ |
|---|---|---|---|
| 规划师 | 4.45 | 4.52 | +0.07 |
| 执行官 | 4.25 | 4.30 | +0.05 |
| 复盘师 | 4.10 | 4.15 | +0.05 |

Bad Case 数：39 → 33（-6）
```

---

## 🧪 PR Checklist

提 PR 前自检：

- [ ] 本地能 clone + `python -m http.server` 起来跑通三 Agent 闭环
- [ ] 改动的设计 token 在浅色 / 深色两个模式下都验证过
- [ ] 新增的命令在 ⌘K 中可搜到
- [ ] 改 Prompt 附了评估集回归报告
- [ ] 改文档同步更新了 README 的链接

---

## 🐛 报 Bug

请用 `.github/ISSUE_TEMPLATE/bug_report.md` 模板。

最少要包含：
- 浏览器 + 版本
- 复现步骤
- 期望行为 vs 实际行为
- 控制台 error（如有）

---

## 💡 提需求

请用 `.github/ISSUE_TEMPLATE/feature_request.md` 模板，重点说清楚：
- 你在什么场景遇到这个需求
- 现有功能为何不够
- 期望的解决形式（可附草图）

---

## 📜 行为准则

参与本项目即代表你同意遵守 [Code of Conduct](./CODE_OF_CONDUCT.md)。

---

谢谢 ❤️
