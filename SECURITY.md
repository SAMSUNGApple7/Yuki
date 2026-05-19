# Security Policy

## 支持的版本

| 版本 | 安全更新 |
|---|---|
| v0.1.x (当前) | ✅ |
| < v0.1 | ❌ |

## 报告漏洞

如果你发现 Yuki 的安全问题，请**不要在公开 Issue 中讨论**。

请发邮件至 **[填写你的联系邮箱]**，并在主题前缀加 `[SECURITY]`。

请尽量包含：
- 漏洞类型（XSS / CSRF / API Key 泄漏 / 等）
- 复现步骤
- 影响范围评估
- 你建议的修复方式（可选）

我们承诺：
- **48 小时内**回复邮件
- **7 个工作日内**给出修复时间表
- 修复后在 [SECURITY ADVISORIES](https://github.com/SAMSUNGApple7/Yuki/security/advisories) 公开致谢

## 已知风险与缓解

| 风险 | 状态 | 缓解 |
|---|---|---|
| API Key 存于 localStorage，他人 PC 登录可能泄露 | 已知 | v0.3 增加"会话级 Key"选项 |
| Anthropic 浏览器直连需要 `dangerous-direct-browser-access` 头 | 已知 | v0.3 加 Cloudflare Workers 代理 |
| LLM 输出可能含恶意 HTML/JS | 已知 | 所有 LLM 输出均通过 React 文本节点渲染，不使用 `dangerouslySetInnerHTML`（Memory Inspector 例外，仅展示 JSON 字符串） |

## 致谢

感谢负责任披露的安全研究者（待补充）。
