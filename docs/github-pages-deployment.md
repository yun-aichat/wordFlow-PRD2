# GitHub Pages 部署指南

本文档提供了将 WordFlow PRD 编辑器部署到 GitHub Pages 的详细步骤。

## 前提条件

1. 已有 GitHub 账号
2. 已创建项目仓库
3. 本地已安装 Git
4. 本地已安装 Node.js 和 npm

## 部署步骤

### 1. 配置项目

项目已经预先配置了 GitHub Pages 部署所需的设置：

- **vite.config.ts** 中已设置 `base` 路径为 `/wordFlow-PRD2/`
- **package.json** 中已添加 `deploy` 脚本
- 已安装 `gh-pages` 依赖

如果你的仓库名不是 `wordFlow-PRD2`，需要修改 `vite.config.ts` 中的 `base` 路径：

```typescript
base: process.env.NODE_ENV === 'production' ? '/你的仓库名/' : '/',
```

### 2. 构建项目

```bash
npm run build
```

这将在 `dist` 目录中生成生产版本的应用。

构建后，确保在 `dist` 目录中创建一个空的 `.nojekyll` 文件，以防止 GitHub Pages 使用 Jekyll 处理你的网站：

```bash
touch dist/.nojekyll
```

在 Windows 系统上，可以使用以下命令创建空文件：

```bash
type nul > dist\.nojekyll
```

### 3. 配置 Git 仓库

确保你的项目已关联到正确的 GitHub 仓库：

```bash
# 查看当前远程仓库
git remote -v

# 如果没有远程仓库，添加一个
git remote add origin https://github.com/你的用户名/wordFlow-PRD2.git
```

### 4. 部署到 GitHub Pages

```bash
npm run deploy
```

这个命令会执行以下操作：
1. 将 `dist` 目录中的内容复制到一个临时目录
2. 切换到 `gh-pages` 分支（如果不存在则创建）
3. 将内容提交到 `gh-pages` 分支
4. 推送到 GitHub

### 5. 配置 GitHub Pages 设置

1. 在 GitHub 仓库页面，点击 **Settings**
2. 在左侧菜单中找到 **Pages**
3. 在 **Source** 部分，选择 `gh-pages` 分支和 `/ (root)` 目录
4. 点击 **Save**

### 6. 验证和访问你的网站

部署完成后，你的应用将可以通过以下 URL 访问：

```
https://你的用户名.github.io/wordFlow-PRD2/
```

我们提供了一个验证脚本，帮助你检查部署是否成功。在 PowerShell 中运行：

```powershell
.\scripts\verify-deployment.ps1
```

该脚本将：
- 检查 gh-pages 分支是否存在
- 验证 GitHub Pages 网站是否可访问
- 提供故障排除建议

## 常见问题

### 部署失败：无法访问 GitHub 仓库

如果遇到类似以下错误：

```
fatal: unable to access 'https://github.com/用户名/仓库名.git/': Recv failure: Connection was reset
```

可能的解决方案：

1. 检查网络连接
2. 确认 Git 凭据是否正确
3. 尝试使用 SSH 而不是 HTTPS：

```bash
git remote set-url origin git@github.com:你的用户名/wordFlow-PRD2.git
```

我们提供了一个辅助脚本来帮助解决 Git 连接问题。在 PowerShell 中运行：

```powershell
.\scripts\fix-git-connection.ps1
```

该脚本可以：
- 检查当前 Git 配置
- 切换到 SSH 连接
- 重置 Git 凭据
- 配置或移除代理
- 测试 GitHub 连接

### 部署后网站显示 404

1. 确认 GitHub Pages 设置中选择了正确的分支（`gh-pages`）
2. 确认 `vite.config.ts` 中的 `base` 路径与仓库名匹配
3. 等待几分钟，GitHub Pages 部署可能需要一些时间生效

## 自动化部署

如果你想设置自动化部署，可以考虑使用 GitHub Actions。创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Create .nojekyll file
        run: touch dist/.nojekyll

      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

这样，每次推送到 `main` 分支时，GitHub Actions 将自动构建并部署你的应用。

## 自定义域名

如果你想为你的应用配置自定义域名，请参考 [自定义域名设置指南](./custom-domain-setup.md)。