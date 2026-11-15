param(
  [int]$From = 0,
  [int]$Count = 0,
  [int]$SleepMs = 350
)
$ErrorActionPreference = 'Continue'
$root = 'D:\Deepseek work\blog'
$targets = Get-Content -Raw -Encoding UTF8 (Join-Path $root '_tmp\wiki-targets.json') | ConvertFrom-Json
$all = @($targets)
if ($Count -le 0) { $Count = $all.Count - $From }
$end = [Math]::Min($From + $Count - 1, $all.Count - 1)
$slice = $all[$From..$end]
$cache = Join-Path $root '_tmp\wiki-cache'
New-Item -ItemType Directory -Force -Path $cache | Out-Null
$failLog = Join-Path $root '_tmp\wiki-fail.jsonl'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
$ok = 0; $skip = 0; $fail = 0

function Try-Fetch([string]$url) {
  try {
    $r = Invoke-WebRequest -Uri $url -TimeoutSec 25 -UseBasicParsing -Headers @{ 'User-Agent' = $ua; 'Accept-Language' = 'ja,en;q=0.8' }
    $c = $r.Content
    if ($c -is [byte[]]) { $c = [System.Text.Encoding]::UTF8.GetString($c) }
    if ($c -match 'Attention Required|Just a moment') { return @{ ok = $false; reason = 'blocked' } }
    if ($c.Length -lt 5000) { return @{ ok = $false; reason = 'short:' + $c.Length } }
    return @{ ok = $true; body = $c }
  } catch {
    $code = ''
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    return @{ ok = $false; reason = ('err:' + $code + ' ' + $_.Exception.Message.Split("`n")[0]) }
  }
}

Write-Output ("shard $From .. $end")
foreach ($t in $slice) {
  if ($null -eq $t) { continue }
  $file = Join-Path $cache $t.file
  if (Test-Path $file) { $skip++; continue }

  $variants = @($t.url)
  if ($t.artist) {
    $variants += 'https://wikiwiki.jp/chunithmwiki/' + [uri]::EscapeDataString($t.title + ' (' + $t.artist + ')')
  }
  $variants += 'https://wikiwiki.jp/chunithmwiki/' + [uri]::EscapeDataString($t.title + ' (' + ($t.version -replace 'CHUNITHM ', '') + ')')

  $saved = $false
  $reasons = @()
  foreach ($v in $variants) {
    $res = Try-Fetch $v
    if ($res.ok) {
      Set-Content -Path $file -Value $res.body -Encoding UTF8
      $ok++; $saved = $true
      break
    }
    $reasons += $res.reason
    if ($res.reason -eq 'blocked') { Start-Sleep -Seconds 5 }
  }
  if (-not $saved) {
    $fail++
    $line = (@{ id = $t.id; title = $t.title; reasons = $reasons } | ConvertTo-Json -Compress)
    Add-Content -Path $failLog -Value $line -Encoding UTF8
  }
  Start-Sleep -Milliseconds $SleepMs
}
Write-Output ("shard done ok=$ok skip=$skip fail=$fail")
