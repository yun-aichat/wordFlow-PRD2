# 修复 Git 连接问题的 PowerShell 脚本

# 检查 Git 配置
Write-Host "检查 Git 配置..."
Write-Host "当前 Git 远程仓库配置:"
git remote -v

# 检查 Git 凭据
Write-Host "`n检查 Git 凭据..."
$credential = git config --global --get credential.helper
Write-Host "当前凭据助手: $credential"

# 检查代理设置
Write-Host "`n检查代理设置..."
$httpProxy = git config --global --get http.proxy
$httpsProxy = git config --global --get https.proxy
Write-Host "HTTP 代理: $httpProxy"
Write-Host "HTTPS 代理: $httpsProxy"

# 提供修复选项
Write-Host "`n可能的修复选项:"
Write-Host "1. 切换到 SSH 连接 (推荐)"
Write-Host "2. 重置 Git 凭据"
Write-Host "3. 配置/移除代理"
Write-Host "4. 测试连接"
Write-Host "5. 退出"

$choice = Read-Host "`n请选择一个选项 (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`n切换到 SSH 连接..."
        $repo = Read-Host "请输入你的 GitHub 用户名"
        $repoName = Read-Host "请输入仓库名称 (默认: wordFlow-PRD2)"
        
        if ([string]::IsNullOrEmpty($repoName)) {
            $repoName = "wordFlow-PRD2"
        }
        
        $currentRemote = git remote get-url origin
        Write-Host "当前远程 URL: $currentRemote"
        
        $newRemote = "git@github.com:$repo/$repoName.git"
        git remote set-url origin $newRemote
        
        Write-Host "远程 URL 已更新为: $newRemote"
        Write-Host "请确保你已经设置了 SSH 密钥。如果没有，请参考: https://docs.github.com/cn/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent"
    }
    "2" {
        Write-Host "`n重置 Git 凭据..."
        git credential-manager uninstall
        git credential-manager install
        Write-Host "Git 凭据已重置。请尝试重新部署。"
    }
    "3" {
        $proxyAction = Read-Host "你想要 (1) 配置代理 或 (2) 移除代理?"
        
        if ($proxyAction -eq "1") {
            $proxyUrl = Read-Host "请输入代理 URL (例如: http://127.0.0.1:7890)"
            git config --global http.proxy $proxyUrl
            git config --global https.proxy $proxyUrl
            Write-Host "代理已配置为: $proxyUrl"
        } else {
            git config --global --unset http.proxy
            git config --global --unset https.proxy
            Write-Host "代理设置已移除"
        }
    }
    "4" {
        Write-Host "`n测试连接..."
        Write-Host "尝试连接到 GitHub..."
        $testResult = Test-NetConnection -ComputerName github.com -Port 443
        
        if ($testResult.TcpTestSucceeded) {
            Write-Host "连接成功！可以访问 GitHub。"
            
            Write-Host "`n测试 Git 连接..."
            git ls-remote --exit-code --heads origin main
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Git 连接测试成功！"
            } else {
                Write-Host "Git 连接测试失败。请检查你的凭据和远程 URL。"
            }
        } else {
            Write-Host "无法连接到 GitHub。请检查你的网络连接或代理设置。"
        }
    }
    "5" {
        Write-Host "退出脚本"
        exit
    }
    default {
        Write-Host "无效选项，请重新运行脚本并选择有效选项。"
    }
}

Write-Host "`n脚本执行完成。如果问题仍然存在，请考虑以下选项:"
Write-Host "1. 检查防火墙设置"
Write-Host "2. 尝试使用 VPN"
Write-Host "3. 联系你的网络管理员"
Write-Host "4. 查看 GitHub 状态页面: https://www.githubstatus.com/"