// 等普查进程结束后，自动汇总证据并生成审阅 docx
import fs from 'node:fs';
import { execSync, execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function running() {
  try {
    const out = execSync(
      'powershell -NoProfile -Command "@(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq \'node.exe\' -and $_.CommandLine -like \'*neta_census*\' }).Count"',
      { encoding: 'utf8' }
    ).trim();
    return Number(out) > 0;
  } catch (e) {
    return false;
  }
}

let waited = 0;
while (running() && waited < 6 * 60 * 60 * 1000) {
  await sleep(60000);
  waited += 60000;
  if (waited % (10 * 60000) === 0) console.log('仍在普查，已等待', Math.round(waited / 60000), '分钟');
}

console.log('普查结束，开始汇总');
execFileSync(process.execPath, ['tools/build_neta_evidence.mjs'], { cwd: ROOT, stdio: 'inherit' });
execFileSync(
  'C:\\Users\\33303\\.dsh\\dsh-runtimes\\dsh-primary-runtime\\dependencies\\python\\python.exe',
  ['tools/build_neta_review_docx.py'],
  { cwd: ROOT, stdio: 'inherit' }
);
console.log('完成');
