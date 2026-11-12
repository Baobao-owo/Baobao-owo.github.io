param(
  [string]$Dir = 'D:\Deepseek work\blog\_tmp\opus-png',
  [string]$Out = 'D:\Deepseek work\blog\_tmp\opus-ocr.json'
)
$files = Get-ChildItem $Dir -Filter *.png
$results = @{}
$i = 0
foreach ($f in $files) {
  $i++
  $text = ''
  try {
    $text = powershell -ExecutionPolicy Bypass -File 'D:\Deepseek work\blog\tools\ocr_win.ps1' -Path $f.FullName 2>$null
  } catch {}
  $text = ($text -join "`n")
  $results[$f.Name] = $text
  if ($i % 10 -eq 0) { Write-Output ("ocr $i / " + $files.Count) }
}
$results | ConvertTo-Json -Depth 3 | Set-Content -Path $Out -Encoding UTF8
Write-Output ("done " + $files.Count)
