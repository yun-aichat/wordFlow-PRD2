# 自定义域名设置指南

本文档提供了为 WordFlow PRD 编辑器配置自定义域名的步骤。

## 前提条件

1. 已成功部署项目到 GitHub Pages
2. 拥有一个自定义域名
3. 能够管理域名的 DNS 设置

## 配置步骤

### 1. 创建 CNAME 文件

在项目的 `dist` 目录中创建一个名为 `CNAME` 的文件，内容为你的自定义域名：

```
yourdomain.com
```

如果使用自动部署，需要确保每次构建后都创建此文件。可以在 `package.json` 中的 `predeploy` 脚本中添加：

```json
"predeploy": "echo > dist/.nojekyll && echo yourdomain.com > dist/CNAME"
```

或者在 GitHub Actions 工作流中添加：

```yaml
- name: Create CNAME file
  run: echo yourdomain.com > dist/CNAME
```

### 2. 配置 DNS 记录

在你的域名注册商或 DNS 提供商的管理面板中，添加以下 DNS 记录：

#### 方法 1：使用 A 记录（推荐）

添加 4 个 A 记录，将你的域名指向 GitHub Pages 的 IP 地址：

```
A @ 185.199.108.153
A @ 185.199.109.153
A @ 185.199.110.153
A @ 185.199.111.153
```

#### 方法 2：使用 CNAME 记录

添加一个 CNAME 记录，将你的域名指向你的 GitHub Pages 站点：

```
CNAME @ yourusername.github.io
```

### 3. 在 GitHub 仓库中配置自定义域名

1. 在 GitHub 仓库页面，点击 **Settings**
2. 在左侧菜单中找到 **Pages**
3. 在 **Custom domain** 部分，输入你的自定义域名
4. 点击 **Save**
5. 如果可能，勾选 **Enforce HTTPS** 选项以启用 HTTPS

### 4. 等待 DNS 传播

DNS 更改可能需要几分钟到 48 小时才能完全传播。在此期间，你的网站可能无法通过自定义域名访问。

## 验证配置

配置完成后，你应该能够通过以下两个 URL 访问你的网站：

```
https://yourdomain.com
https://yourusername.github.io/wordFlow-PRD2/
```

## 常见问题

### DNS 配置后网站仍然无法访问

1. 确认 DNS 记录已正确配置
2. 使用 `dig` 或 `nslookup` 命令检查 DNS 解析：
   ```bash
   dig yourdomain.com
   nslookup yourdomain.com
   ```
3. 检查 GitHub 仓库的 Pages 设置中是否正确配置了自定义域名
4. 等待 DNS 完全传播（最多 48 小时）

### HTTPS 证书问题

GitHub Pages 会自动为自定义域名提供 HTTPS 证书，但这可能需要一些时间。如果遇到证书警告：

1. 确保在 GitHub Pages 设置中勾选了 **Enforce HTTPS** 选项
2. 等待 GitHub 为你的域名颁发证书（通常需要 24 小时）
3. 如果问题持续存在，检查你的域名是否有 CAA 记录阻止 Let's Encrypt 颁发证书

## 更新 vite.config.ts

使用自定义域名后，需要更新 `vite.config.ts` 中的 `base` 配置：

```typescript
base: process.env.NODE_ENV === 'production' ? '/' : '/',
```

这样可以确保应用在自定义域名下正确加载所有资源。