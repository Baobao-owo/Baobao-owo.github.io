$ErrorActionPreference = 'Continue'
$root = 'D:\Deepseek work\blog'
$targetsPath = Join-Path $root '_tmp\wiki-targets.json'
if (-not (Test-Path $targetsPath)) { Write-Output 'no targets file'; exit 1 }
$targets = Get-Content -Raw -Encoding UTF8 $targetsPath | ConvertFrom-Json
$cache = Join-Path $root '_tmp\wiki-cache'
New-Item -ItemType Directory -Force -Path $cache | Out-Null
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
$ok = 0; $skip = 0; $fail = 0
Write-Output ("fetching " + @($targets).Count + " pages")
foreach ($t in $targets) {
  $file = Join-Path $cache $t.file
  if (Test-Path $file) { $skip++; continue }
  $done = $false
  for ($try = 1; $try -le 3 -and -not $done; $try++) {
    try {
      $r = Invoke-WebRequest -Uri $t.url -TimeoutSec 40 -UseBasicParsing -Headers @{ 'User-Agent' = $ua; 'Accept-Language' = 'ja,en;q=0.8' }
      $c = $r.Content
      if ($c -is [byte[]]) { $c = [System.Text.Encoding]::UTF8.GetString($c) }
      if ($c -match 'Attention Required|Just a moment') { throw 'blocked' }
      Set-Content -Path $file -Value $c -Encoding UTF8
      $ok++; $done = $true
    } catch {
      Start-Sleep -Seconds (2 * $try)
    }
  }
  if (-not $done) { $fail++; Write-Output ("FAIL " + $t.id) }
  Start-Sleep -Milliseconds 700
}
Write-Output ("done ok=$ok skip=$skip fail=$fail")
