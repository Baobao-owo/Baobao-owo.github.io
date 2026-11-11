// 应用分类改名：把文章 front-matter 里的旧分类名（aliases）改成新名字。
// 用法：node tools/apply-categories.mjs [--dry]
// 在 CI 里构建前跑一次；改过的文件会由 workflow 提交回仓库。
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const dry = process.argv.includes('--dry');
const cfgPath = path.join(ROOT, 'source/_data/categories.yml');
const postsDir = path.join(ROOT, 'source/_posts');

if (!fs.existsSync(cfgPath)) {
  console.log('no categories.yml, skip');
  process.exit(0);
}

const cfg = yaml.load(fs.readFileSync(cfgPath, 'utf8')) || {};
const list = cfg.categories || [];

// alias -> name
const aliasMap = new Map();
for (const c of list) {
  if (!c || !c.name) continue;
  const aliases = Array.isArray(c.aliases)
    ? c.aliases
    : String(c.aliases || '').split(/[,，]/);
  for (const a of aliases) {
    const key = String(a || '').trim();
    if (key && key !== c.name) aliasMap.set(key, String(c.name).trim());
  }
}

if (aliasMap.size === 0) {
  console.log('no aliases configured, nothing to rename');
  process.exit(0);
}

const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
let changed = 0;

for (const file of files) {
  const full = path.join(postsDir, file);
  const text = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) continue;

  const fmText = m[1];
  let data;
  try {
    data = yaml.load(fmText) || {};
  } catch (e) {
    console.warn('skip (bad yaml):', file, e.message);
    continue;
  }

  const cats = data.categories;
  if (cats === undefined || cats === null) continue;

  const isArray = Array.isArray(cats);
  const values = isArray ? cats : [cats];
  let touched = false;
  const mapped = values.map((v) => {
    const key = String(v).trim();
    if (aliasMap.has(key)) {
      touched = true;
      return aliasMap.get(key);
    }
    return v;
  });

  if (!touched) continue;

  const newValue = isArray ? `[${mapped.join(', ')}]` : mapped[0];
  const updated = text.replace(/^categories:.*$/m, `categories: ${newValue}`);
  if (updated === text) {
    console.warn('could not rewrite categories line (multi-line?), skip:', file);
    continue;
  }

  if (dry) {
    console.log('[dry] rename in', file, '->', newValue);
  } else {
    fs.writeFileSync(full, updated, 'utf8');
    console.log('renamed in', file, '->', newValue);
  }
  changed++;
}

console.log(dry ? `[dry] ${changed} file(s) would change` : `${changed} file(s) updated`);
