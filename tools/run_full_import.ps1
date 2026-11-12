param(
  [switch]$SkipFetch
)
# 全量搬运流水线：解析 → 履历展开 → 机翻 → 构建
$root = 'D:\Deepseek work\blog'
Set-Location $root

Write-Output '=== 1) 解析 wiki 页面 ==='
node tools/wiki_extra_sections.mjs

Write-Output '=== 2) 展开定数履历 ==='
node tools/wiki_history_expand.mjs

Write-Output '=== 3) 机翻介绍 ==='
node tools/translate_batch.mjs --sleep 1500

Write-Output '=== 4) 构建 ==='
cmd /c "npm run clean >nul 2>&1"
cmd /c "npm run build 2>&1" | Select-Object -Last 2

Write-Output '=== 5) 待决策清单 ==='
& "C:\Users\33303\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" tools/build_decision_docx.py
Write-Output 'done'
