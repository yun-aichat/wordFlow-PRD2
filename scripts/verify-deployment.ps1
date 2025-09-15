# 验证 GitHub Pages 部署的 PowerShell 脚本

# 获取仓库信息
function Get-RepoInfo {
    $remoteUrl = git remote get-url origin 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: 无法获取远程仓库 URL。请确保你在 Git 仓库中运行此脚本。" -ForegroundColor Red
        return $null
    }
    
    # 尝试从远程 URL 提取用户名和仓库名
    if ($remoteUrl -match "github\.com[:\/]([^/]+)\/([^/\.]+)(\.git)?$") {
        $username = $matches[1]
        $repoName = $matches[2]
        if ($repoName.EndsWith(".git")) {
            $repoName = $repoName.Substring(0, $repoName.Length - 4)
        }
        return @{Username = $username; RepoName = $repoName}
    } else {
        Write-Host "警告: 无法从远程 URL 解析 GitHub 用户名和仓库名。" -ForegroundColor Yellow
        $username = Read-Host "请输入你的 GitHub 用户名"
        $repoName = Read-Host "请输入仓库名称 (默认: wordFlow-PRD2)"
        
        if ([string]::IsNullOrEmpty($repoName)) {
            $repoName = "wordFlow-PRD2"
        }
        
        return @{Username = $username; RepoName = $repoName}
    }
}

# 检查 GitHub Pages 设置
function Check-GitHubPages {
    param (
        [string]$username,
        [string]$repoName
    )
    
    $pagesUrl = "https://$username.github.io/$repoName/"
    Write-Host "检查 GitHub Pages 部署: $pagesUrl" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $pagesUrl -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ GitHub Pages 已成功部署！" -ForegroundColor Green
            Write-Host "你的网站可以通过以下 URL 访问: $pagesUrl" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "✗ GitHub Pages 尚未部署或无法访问。" -ForegroundColor Red
        Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return $false
}

# 检查 gh-pages 分支
function Check-GhPagesBranch {
    $branches = git branch -a
    if ($branches -match "remotes/origin/gh-pages") {
        Write-Host "✓ gh-pages 分支已存在" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ gh-pages 分支不存在" -ForegroundColor Red
        return $false
    }
}

# 检查 GitHub 仓库设置
function Check-GitHubSettings {
    param (
        [string]$username,
        [string]$repoName
    )
    
    Write-Host "`n请检查你的 GitHub 仓库设置:" -ForegroundColor Cyan
    Write-Host "1. 访问 https://github.com/$username/$repoName/settings/pages" -ForegroundColor Yellow
    Write-Host "2. 确保 Source 设置为 'Deploy from a branch'" -ForegroundColor Yellow
    Write-Host "3. 确保选择了 'gh-pages' 分支和 '/ (root)' 目录" -ForegroundColor Yellow
    Write-Host "4. 如果你刚刚部署，可能需要等待几分钟才能访问你的网站" -ForegroundColor Yellow
}

# 主函数
function Main {
    Write-Host "GitHub Pages 部署验证工具" -ForegroundColor Cyan
    Write-Host "============================`n" -ForegroundColor Cyan
    
    $repoInfo = Get-RepoInfo
    if ($null -eq $repoInfo) {
        return
    }
    
    $username = $repoInfo.Username
    $repoName = $repoInfo.RepoName
    
    Write-Host "GitHub 用户名: $username" -ForegroundColor Cyan
    Write-Host "仓库名称: $repoName`n" -ForegroundColor Cyan
    
    $ghPagesBranchExists = Check-GhPagesBranch
    $pagesDeployed = Check-GitHubPages -username $username -repoName $repoName
    
    if (-not $ghPagesBranchExists -or -not $pagesDeployed) {
        Check-GitHubSettings -username $username -repoName $repoName
        
        Write-Host "`n建议的修复步骤:" -ForegroundColor Cyan
        if (-not $ghPagesBranchExists) {
            Write-Host "1. 运行 'npm run deploy' 创建并推送 gh-pages 分支" -ForegroundColor Yellow
        }
        Write-Host "2. 如果部署失败，请运行 '.\scripts\fix-git-connection.ps1' 修复 Git 连接问题" -ForegroundColor Yellow
        Write-Host "3. 确保 vite.config.ts 中的 base 路径设置正确 (应为 '/$repoName/')" -ForegroundColor Yellow
        Write-Host "4. 确保 dist 目录中包含 .nojekyll 文件" -ForegroundColor Yellow
    }
}

# 执行主函数
Main