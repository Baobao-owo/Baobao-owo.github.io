# 一把推上 GitHub Pages：建仓库 → 存凭据 → hexo deploy → 开 Pages → 验证线上
# 用法：$env:GH_PAT='ghp_xxx'; .\tools\deploy_pages.ps1
param(
    [string]$User = 'FDShijing',
    [string]$Repo = 'FDShijing.github.io',
    [string]$Token = $env:GH_PAT
)

$ErrorActionPreference = 'Stop'
if (-not $Token) { throw 'GH_PAT 没设置' }

$headers = @{
    Authorization = "Bearer $Token"
    Accept        = 'application/vnd.github+json'
    'User-Agent'  = 'dsh-blog-deploy'
}
$api = "https://api.github.com/repos/$User/$Repo"

# 1. 仓库：有就复用，没有就建
$existing = $true
try {
    $r = Invoke-RestMethod -Uri $api -Headers $headers -TimeoutSec 30
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) { $existing = $false }
    else { throw }
}
if ($existing) {
    Write-Output ("repo exists: " + $r.html_url + "  default=" + $r.default_branch)
} else {
    $body = @{
        name        = $Repo
        description = '个人博客（Hexo + Argon）'
        homepage    = ("https://" + $User.ToLower() + ".github.io")
        private     = $false
        has_issues  = $false
        has_wiki    = $false
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Method Post -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 30
    Write-Output ("repo created: " + $r.html_url)
}

# 2. 把 token 交给凭据管理器，hexo deploy 推送时就不用弹窗
$cred = "protocol=https`nhost=github.com`nusername=x-access-token`npassword=$Token`n`n"
$cred | git credential approve
Write-Output 'credential stored in Windows credential manager'

# 3. 构建并部署
Set-Location 'D:\Deepseek work\blog'
npm run build 2>&1 | Select-Object -Last 1
npm run deploy 2>&1 | Select-Object -Last 14

# 4. 确认分支推上去了
$branches = git ls-remote --heads "https://github.com/$User/$Repo.git" 2>&1
Write-Output "=== remote heads ==="
$branches | ForEach-Object { Write-Output ("  " + $_) }

# 5. Pages：用户站一般推送后自动开，没有就手动开
$pagesUrl = "https://api.github.com/repos/$User/$Repo/pages"
$pages = $null
try { $pages = Invoke-RestMethod -Uri $pagesUrl -Headers $headers -TimeoutSec 30 } catch {
    try {
        $pbody = @{ source = @{ branch = 'main'; path = '/' } } | ConvertTo-Json
        $pages = Invoke-RestMethod -Uri $pagesUrl -Method Post -Headers $headers -Body $pbody -ContentType 'application/json' -TimeoutSec 30
        Write-Output 'pages enabled manually'
    } catch { Write-Output ("pages api: " + $_.Exception.Message) }
}
if ($pages) { Write-Output ("pages: " + $pages.html_url + "  status=" + $pages.status) }

# 6. 等线上可访问
$site = ("https://" + $User.ToLower() + ".github.io/")
$ok = $false
for ($i = 0; $i -lt 40; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri $site -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Output ("HTTP " + [int]$resp.StatusCode + "  " + $site + "  (" + $resp.RawContentLength + " bytes)")
        $hit = [regex]::Match($resp.Content, '<title>(.*?)</title>')
        if ($hit.Success) { Write-Output ("title: " + $hit.Groups[1].Value) }
        $ok = $true
        break
    } catch {
        Start-Sleep -Seconds 8
    }
}
if (-not $ok) { Write-Output '还没起来：Pages 首次构建一般要 1~3 分钟，稍后再刷一次' }
