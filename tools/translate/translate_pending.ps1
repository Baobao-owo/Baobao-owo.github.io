param(
  [string]$In = 'D:\Deepseek work\blog\_tmp\zh-pending.json',
  [string]$Out = 'D:\Deepseek work\blog\_tmp\zh.jsonl',
  [int]$SleepMs = 700,
  [int]$Limit = 0
)
$items = Get-Content -Raw -Encoding UTF8 $In | ConvertFrom-Json
if ($Limit -gt 0) { $items = $items[0..([Math]::Min($Limit, $items.Count) - 1)] }
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
$ok = 0; $fail = 0; $i = 0
foreach ($it in $items) {
  $i++
  $q = [uri]::EscapeDataString([string]$it.t)
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
      Start-Sleep -Seconds (2 * $try)
    }
  }
  if ($zh) {
    $clean = $zh -replace "`r", ' ' -replace "`n", ' '
    Add-Content -Path $Out -Value ($it.k + "`t" + $clean) -Encoding UTF8
    $ok++
    if ($ok % 50 -eq 0) { Write-Output ("translated $ok / " + $items.Count) }
  } else {
    $fail++
    Write-Output ("fail: " + $it.k)
  }
  Start-Sleep -Milliseconds $SleepMs
}
Write-Output ("done ok=$ok fail=$fail")
