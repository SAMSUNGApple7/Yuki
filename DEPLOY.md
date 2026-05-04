# 部署指南 · Deployment Guide

Yuki 是纯静态站点（HTML + CSS + 浏览器内 Babel 转译的 JSX），**无需构建步骤**，可部署到任何静态托管服务。

---

## 选项 1 · Vercel（推荐 · 零配置）

```bash
npm i -g vercel
cd yuki
vercel
```

或 Push 到 GitHub 后在 [vercel.com/new](https://vercel.com/new) 一键导入：
- Framework Preset: **Other**
- Build Command: 留空
- Output Directory: `.`
- Install Command: 留空

部署完成后会得到 `https://<你的项目名>.vercel.app`。

---

## 选项 2 · Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

或 CLI：

```bash
npm i -g netlify-cli
netlify deploy --prod --dir .
```

---

## 选项 3 · Cloudflare Pages

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com) → Pages → Create
2. 连接 GitHub 仓库
3. 构建配置：
   - Framework preset: **None**
   - Build command: 留空
   - Build output directory: `/`

---

## 选项 4 · GitHub Pages

1. Push 项目到 GitHub
2. Settings → Pages
3. Source: **Deploy from a branch**
4. Branch: `main` / `/` (root)
5. Save，1-2 分钟后访问 `https://<username>.github.io/<repo>/`

> ⚠️ GitHub Pages 默认无 SSL/CDN 优化，加载略慢。建议正式演示时用 Vercel。

---

## 选项 5 · 本地预览

```bash
# Python 3
python3 -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

> ⚠️ 不能直接 `file://` 双击打开 `index.html` —— Babel Standalone 加载本地 JSX 文件需要 HTTP 协议。

---

## 关于 API Key 安全

Yuki 在浏览器端直连 LLM 提供商（Anthropic / OpenAI / DeepSeek），用户的 API Key **仅存储在 localStorage**，从不会上传到 Yuki 自身的服务器（事实上 Yuki 没有服务器）。

> 这种设计适合个人 Demo 和求职作品。如要做生产产品，必须搭建后端代理，避免 Key 泄漏与跨域问题。

---

## 自定义域名

所有上述平台都支持自定义域名。以 Vercel 为例：

1. Project → Settings → Domains
2. Add `yuki.yourdomain.com`
3. 按提示在域名服务商添加 CNAME 记录

---

## 性能优化建议（可选）

当前项目使用浏览器内 Babel 转译，首屏加载约 200ms 用于编译 JSX。如需上线生产：

1. 用 Vite/esbuild 预编译 JSX → 替换 `<script type="text/babel">` 为编译产物
2. 资源加 immutable 缓存头
3. 启用 gzip / brotli（Vercel / Netlify 默认开启）

---

## 故障排查

| 问题 | 解决 |
|---|---|
| 页面白屏 | 浏览器 Console 看错误。最常见是 JSX 语法错误，按提示修复 |
| Babel 警告 | `You are using the in-browser Babel transformer` —— 这是 dev 警告，不影响运行 |
| API 调用 CORS 报错 | 检查 API Key 是否正确；某些代理需在 Headers 加 `anthropic-dangerous-direct-browser-access: true` |
| 字体不显示 | 检查网络是否能访问 fonts.googleapis.com |
