param(
  [int]$SleepMs = 2200,
  [int]$MaxRetry = 3
)
$ErrorActionPreference = 'Continue'
$root = 'D:\Deepseek work\blog'
$targets = Get-Content -Raw -Encoding UTF8 (Join-Path $root '_tmp\wiki-targets.json') | ConvertFrom-Json
$cache = Join-Path $root '_tmp\wiki-cache'
New-Item -ItemType Directory -Force -Path $cache | Out-Null
$failLog = Join-Path $root '_tmp\wiki-fail.jsonl'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
$ok = 0; $skip = 0; $fail = 0

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
    return @{ ok = $false; reason = ('err:' + $code + ' ' + $_.Exception.Message.Split("`n")[0]) }
  }
}

Write-Output ("slow fetch start, targets=" + @($targets).Count)
foreach ($t in @($targets)) {
  if ($null -eq $t) { continue }
  $file = Join-Path $cache $t.file
  if (Test-Path $file) { $skip++; continue }

  $variants = @($t.url)
  if ($t.artist) { $variants += 'https://wikiwiki.jp/chunithmwiki/' + [uri]::EscapeDataString($t.title + ' (' + $t.artist + ')') }

  $saved = $false
  $reasons = @()
  foreach ($v in $variants) {
    for ($try = 1; $try -le $MaxRetry -and -not $saved; $try++) {
      $res = Try-Fetch $v
      if ($res.ok) {
        Set-Content -Path $file -Value $res.body -Encoding UTF8
        $ok++; $saved = $true
      } else {
        $reasons += $res.reason
        if ($res.reason -eq 'blocked' -or $res.reason -like 'err:*') {
          Start-Sleep -Seconds (6 * $try)
        }
      }
    }
    if ($saved) { break }
  }
  if (-not $saved) {
    $fail++
    Add-Content -Path $failLog -Value (@{ id = $t.id; title = $t.title; reasons = $reasons } | ConvertTo-Json -Compress) -Encoding UTF8
  }
  Start-Sleep -Milliseconds $SleepMs
  if (($ok + $fail) % 25 -eq 0) { Write-Output ("progress ok=$ok fail=$fail skip=$skip") }
}
Write-Output ("slow fetch done ok=$ok skip=$skip fail=$fail")
