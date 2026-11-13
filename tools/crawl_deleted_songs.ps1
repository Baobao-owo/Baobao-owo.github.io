# 逐页抓取「配信終了」曲目的 wiki 页面（慢速 + 429 退避）
$ErrorActionPreference = 'Stop'
Set-Location "D:\Deepseek work\blog"
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
$titles = Get-Content "_tmp\wiki\crawl_titles.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$i = 0
$ok = 0
$fail = @()
foreach ($t in $titles) {
  $i++
  $out = "_tmp\wiki\songs\$i.html"
  if ((Test-Path $out) -and ((Get-Item $out).Length -gt 20000)) { $ok++; continue }
  $safe = [System.Uri]::EscapeDataString($t)
  $try = 0
  $done = $false
  while ($try -lt 8 -and -not $done) {
    $try++
    try {
      Invoke-WebRequest -Uri "https://wikiwiki.jp/chunithmwiki/$safe" -UseBasicParsing -TimeoutSec 45 -Headers @{ 'User-Agent' = $ua } -OutFile $out
      $done = $true
      $ok++
    } catch {
      $msg = $_.Exception.Message
      if ($msg -match '429') { Start-Sleep -Seconds (6 * $try) }
      else { Start-Sleep -Seconds 3 }
    }
  }
  if (-not $done) { $fail += $t }
  Start-Sleep -Seconds 3
}
"crawl finished: ok=$ok fail=$($fail.Count)"
$fail | ForEach-Object { "FAIL: $_" }
