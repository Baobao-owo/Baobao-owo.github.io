param(
  [int]$ProbeMinutes = 5,
  [int]$MaxHours = 5
)
# Wait for Google translate to recover, then translate titles and origins queues.
$root = 'D:\Deepseek work\blog'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
$q = [uri]::EscapeDataString('test')
$deadline = (Get-Date).AddHours($MaxHours)
$log = Join-Path $root '_tmp\translate-wait.log'

while ((Get-Date) -lt $deadline) {
  $ready = $false
  try {
    $r = Invoke-WebRequest -Uri "https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=ja&tl=zh-CN&q=$q" -TimeoutSec 15 -UseBasicParsing -Headers @{ 'User-Agent' = $ua; 'Referer' = 'https://translate.google.com/' }
    if ($r.StatusCode -eq 200) { $ready = $true }
  } catch {
    $ready = $false
  }
  Add-Content -Path $log -Value ((Get-Date -Format 'HH:mm:ss') + ' ready=' + $ready) -Encoding UTF8
  if ($ready) { break }
  Start-Sleep -Seconds ($ProbeMinutes * 60)
}

if (-not $ready) {
  Add-Content -Path $log -Value 'gave up waiting' -Encoding UTF8
  exit 1
}

Add-Content -Path $log -Value 'start translating' -Encoding UTF8
powershell -ExecutionPolicy Bypass -File (Join-Path $root 'tools\translate_lines.ps1') -In (Join-Path $root '_tmp\extra-titles.json') -Out (Join-Path $root '_tmp\extra-titles-zh.jsonl') -SleepMs 900 | Add-Content -Path $log -Encoding UTF8
powershell -ExecutionPolicy Bypass -File (Join-Path $root 'tools\translate_lines.ps1') -In (Join-Path $root '_tmp\extra-origins.json') -Out (Join-Path $root '_tmp\extra-origins-zh.jsonl') -SleepMs 900 | Add-Content -Path $log -Encoding UTF8
Add-Content -Path $log -Value 'done' -Encoding UTF8
