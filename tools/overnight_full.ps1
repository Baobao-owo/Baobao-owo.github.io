param(
  [int]$SleepMs = 7000
)
# Overnight pipeline: fetch -> parse -> translate -> merge -> build -> decision doc
$root = 'D:\Deepseek work\blog'
Set-Location $root
$log = Join-Path $root '_tmp\overnight.log'
function Log($msg) {
  Add-Content -Path $log -Value ((Get-Date -Format 'HH:mm:ss') + '  ' + $msg) -Encoding UTF8
}
if (-not (Test-Path $log)) { New-Item -ItemType File -Path $log | Out-Null }
Log 'pipeline start'

$targets = Get-Content -Raw -Encoding UTF8 (Join-Path $root '_tmp\wiki-targets.json') | ConvertFrom-Json
$cache = Join-Path $root '_tmp\wiki-cache'
New-Item -ItemType Directory -Force -Path $cache | Out-Null
$failLog = Join-Path $root '_tmp\wiki-fail.jsonl'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
$ok = 0; $skip = 0; $fail = 0; $idx = 0

function Try-Fetch([string]$url) {
  try {
    $r = Invoke-WebRequest -Uri $url -TimeoutSec 30 -UseBasicParsing -Headers @{ 'User-Agent' = $ua; 'Accept-Language' = 'ja,en;q=0.8'; 'Referer' = 'https://wikiwiki.jp/chunithmwiki/' }
    $c = $r.Content
    if ($c -is [byte[]]) { $c = [System.Text.Encoding]::UTF8.GetString($c) }
    if ($c -match 'Attention Required|Just a moment') { return @{ ok = $false; reason = 'blocked' } }
    if ($c.Length -lt 5000) { return @{ ok = $false; reason = 'short:' + $c.Length } }
    return @{ ok = $true; body = $c }
  } catch {
    $code = ''
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    return @{ ok = $false; reason = ('err:' + $code) }
  }
}

Log ('fetch targets=' + @($targets).Count)
foreach ($t in @($targets)) {
  if ($null -eq $t) { continue }
  $idx++
  $file = Join-Path $cache $t.file
  if (Test-Path $file) { $skip++; continue }

  $variants = @($t.url)
  if ($t.artist) { $variants += 'https://wikiwiki.jp/chunithmwiki/' + [uri]::EscapeDataString($t.title + ' (' + $t.artist + ')') }

  $saved = $false
  $reasons = @()
  foreach ($v in $variants) {
    $res = Try-Fetch $v
    if ($res.ok) { Set-Content -Path $file -Value $res.body -Encoding UTF8; $ok++; $saved = $true; break }
    $reasons += $res.reason
    if ($res.reason -like 'err:429*' -or $res.reason -eq 'blocked') {
      Start-Sleep -Seconds 30
      $res = Try-Fetch $v
      if ($res.ok) { Set-Content -Path $file -Value $res.body -Encoding UTF8; $ok++; $saved = $true; break }
      $reasons += $res.reason
    }
  }
  if (-not $saved) {
    $fail++
    Add-Content -Path $failLog -Value (@{ id = $t.id; title = $t.title; reasons = $reasons } | ConvertTo-Json -Compress) -Encoding UTF8
  }
  if ($idx % 20 -eq 0) { Log ("fetch idx=$idx ok=$ok skip=$skip fail=$fail") }
  Start-Sleep -Milliseconds $SleepMs
}
Log ("fetch done ok=$ok skip=$skip fail=$fail")

Log 'wiki_build'
node tools/wiki_build.mjs *>> $log
Log 'extra sections'
node tools/wiki_extra_sections.mjs *>> $log
Log 'history expand'
node tools/wiki_history_expand.mjs *>> $log

Log 'translate (ps)'
powershell -ExecutionPolicy Bypass -File (Join-Path $root 'tools\translate_batch.ps1') -SleepMs 600 *>> $log
Log 'merge translations'
node tools/translate_merge.mjs *>> $log

Log 'build'
cmd /c "npm run clean >nul 2>&1"
cmd /c "npm run build 2>&1" | Select-Object -Last 1 | ForEach-Object { Log $_ }

Log 'decision doc'
& "C:\Users\33303\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" tools/build_decision_docx.py *>> $log

Log 'all done'
