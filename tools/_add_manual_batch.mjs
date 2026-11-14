import fs from 'node:fs';
const p = 'tools/designer-manual.json';
const m = JSON.parse(fs.readFileSync(p, 'utf8'));

m.aliases["Don't Fight Chuni Fumen Boys"] = '团队名义';
m.aliases['SHOW ME YOUR "POTENTIAL" -For KoP The 3rd-'] = '制作者不明';
m.aliases['WHITE WINTER NOTES'] = '制作者不明';
m.aliases['合作だよ'] = '制作者不明';

m.collab['trrricksters!!'] = { m: ['サファ太', 'Ragnarok'] };
m.collab['紅'] = { e: ['Techno Kitchen', 'ロシェ＠ペンギン'] };
m.collab['蜘蛛の糸'] = { m: ['Techno Kitchen', 'Redarrow'] };
m.collab['glitch street'] = { m: ['アミノハバキリ', 'ミストルティン'] };

fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n', 'utf8');
console.log('aliases:', Object.keys(m.aliases).length, ' collab:', Object.keys(m.collab).length);
