param(
  [int]$Limit = 0,
  [int]$SleepMs = 900
)
# 机翻：PowerShell 走 Google 端点，结果追加到 _tmp\zh.jsonl（key\t翻译），由 node 合并
$root = 'D:\Deepseek work\blog'
$extraPath = Join-Path $root 'source\_data\chuni_extra.json'
$outPath = Join-Path $root '_tmp\zh.jsonl'
$extra = Get-Content -Raw -Encoding UTF8 $extraPath | ConvertFrom-Json
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

$done = @{}
if (Test-Path $outPath) {
  Get-Content -Encoding UTF8 $outPath | ForEach-Object {
    $p = $_ -split "`t", 2
    if ($p.Count -eq 2 -and $p[1]) { $done[$p[0]] = $true }
  }
}

$todo = @()
foreach ($k in @($extra.PSObject.Properties.Name)) {
  $e = $extra.$k
  $ja = $e.wiki_comment
  if (-not $ja) { $ja = $e.wiki_jp }
  if (-not $ja) { continue }
  if ($e.wiki_comment_zh) { continue }
  if ($done.ContainsKey($k)) { continue }
  $todo += $k
}
if ($Limit -gt 0) { $todo = $todo[0..([Math]::Min($Limit, $todo.Count) - 1)] }
Write-Output ("待翻译: " + $todo.Count)

$ok = 0; $fail = 0
foreach ($k in $todo) {
  $e = $extra.$k
  $ja = $e.wiki_comment
  if (-not $ja) { $ja = $e.wiki_jp }
  $text = [string]$ja
  if ($text.Length -gt 4500) { $text = $text.Substring(0, 4500) }
  $q = [uri]::EscapeDataString($text)
  $zh = ''
  for ($try = 1; $try -le 3 -and -not $zh; $try++) {
    try {
      $u = "https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=ja&tl=zh-CN&q=$q"
      $r = Invoke-WebRequest -Uri $u -TimeoutSec 20 -UseBasicParsing -Headers @{ 'User-Agent' = $ua; 'Referer' = 'https://translate.google.com/' }
      $c = $r.Content
      if ($c -is [byte[]]) { $c = [System.Text.Encoding]::UTF8.GetString($c) }
      $j = $c | ConvertFrom-Json
      if ($j[0] -is [array]) { $zh = (($j | ForEach-Object { $_[0] }) -join '') } else { $zh = [string]$j[0] }
    } catch {
      Start-Sleep -Seconds (3 * $try)
    }
  }
  if ($zh) {
    $clean = $zh -replace "`r", ' ' -replace "`n", ' '
    Add-Content -Path $outPath -Value ($k + "`t" + $clean) -Encoding UTF8
    $ok++
    if ($ok % 10 -eq 0) { Write-Output ("已翻译 $ok / " + $todo.Count) }
  } else {
    $fail++
    Write-Output ("失败: " + $k)
  }
  Start-Sleep -Milliseconds $SleepMs
}
Write-Output ("完成: 成功 $ok 失败 $fail")
