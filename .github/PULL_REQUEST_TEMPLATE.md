# Pull Request

## 这个 PR 做了什么

<!-- 一句话概括。如果是 bugfix，说清楚修复了什么；如果是 feature，说清楚新增了什么 -->

## 相关 Issue

<!-- 关联的 Issue 编号，例如 Closes #12 -->

Closes #

## 改动类型

- [ ] 🐛 Bug 修复
- [ ] ✨ 新功能
- [ ] 💄 UI / 样式
- [ ] 📝 文档
- [ ] ♻️ 重构（不影响功能）
- [ ] ⚡ 性能优化
- [ ] 🧪 测试 / 评估集
- [ ] 🔧 工程化

## 截图（UI 改动必填）

| Before | After |
|---|---|
| 截图 | 截图 |

## 评估集回归（改 Prompt 必填）

| Agent | Before | After | Δ |
|---|---|---|---|
| 规划师 | | | |
| 执行官 | | | |
| 复盘师 | | | |

Bad Case 数变化：

## 自检 Checklist

- [ ] 本地能 `python -m http.server` 跑通三 Agent 闭环
- [ ] 在浅色 / 深色两个主题下都验证过
- [ ] 改 Prompt 附了 50 场景评估集回归
- [ ] 改文档同步更新了 README / 链接
- [ ] Commit message 遵循 Conventional Commits 规范
- [ ] 没有 console.log / TODO 残留

## 额外信息

<!-- 任何 reviewer 需要注意的事项 -->
