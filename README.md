# TOTP 验证码生成器

一个简单、安全的 TOTP（基于时间的一次性密码）验证码生成器，运行在 Cloudflare Workers 上。

## 功能特性

- ✅ 多账号管理：支持添加、删除多个 2FA 账号
- ✅ 实时验证码：30秒自动刷新，与 Google Authenticator 完全兼容
- ✅ 一键复制：点击复制按钮快速复制验证码
- ✅ 时间提醒：圆形进度条显示剩余时间，过期前5秒红色提醒
- ✅ 本地存储：密钥存储在浏览器 localStorage，不上传服务器
- ✅ 响应式设计：完美支持手机、平板、电脑

## 快速开始

### 前置要求

1. [Node.js](https://nodejs.org/) (v16 或更高版本)
2. [Cloudflare 账号](https://dash.cloudflare.com/)

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:8787 查看应用。

### 部署到 Cloudflare Workers

1. 登录 Cloudflare：
```bash
npx wrangler login
```

2. 部署：
```bash
npm run deploy
```

部署完成后，你会获得一个类似 `https://totp-authenticator.your-subdomain.workers.dev` 的 URL。

## 使用方法

1. 在页面输入框中填写：
   - **账号名称**：例如 "Google"、"GitHub"、"Microsoft" 等
   - **2FA 密钥**：从各个服务获取的 Base32 格式密钥

2. 点击"添加账号"按钮

3. 验证码会自动生成，每30秒刷新一次

4. 点击"复制"按钮可以快速复制验证码

5. 圆形进度条显示当前验证码的剩余有效期

## 安全说明

- ✅ 所有密钥仅存储在您浏览器的 localStorage 中
- ✅ 密钥不会上传到任何服务器
- ✅ 使用 HTTPS 加密传输
- ✅ 完全开源，代码透明
- ⚠️ 清空浏览器缓存会丢失所有账号信息，请妥善备份密钥

## 如何获取 2FA 密钥

大多数服务在启用两步验证时会提供一个密钥（通常是一串 Base32 字符），例如：

```
JBSWY3DPEHPK3PXP
```

这个密钥就是你需要输入到本应用中的内容。

## 技术栈

- **运行时**: Cloudflare Workers
- **前端**: 原生 JavaScript + CSS
- **加密**: crypto-js (HMAC-SHA1)
- **存储**: 浏览器 localStorage

## 项目结构

```
totp-authenticator/
├── wrangler.toml           # Cloudflare Workers 配置
├── index.js                # Worker 主入口
├── package.json            # 项目依赖
├── public/
│   ├── index.html          # 主页面
│   ├── style.css           # 样式文件
│   └── app.js              # 前端逻辑
└── README.md
```

## 兼容性

- ✅ Google Authenticator
- ✅ Microsoft Authenticator
- ✅ Authy
- ✅ 1Password
- ✅ Bitwarden
- ✅ 所有支持 TOTP 的验证器应用

## License

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
