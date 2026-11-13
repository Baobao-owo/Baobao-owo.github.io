import fs from 'node:fs';

const p = 'themes/argon/layout/sidebar.ejs';
let t = fs.readFileSync(p, 'utf8');
const before = t;
t = t.replace(`<a href="<%= url_for('/archives')%>">`, '<a href="/categories/">');
fs.writeFileSync(p, t, 'utf8');
console.log('sidebar changed:', before !== t);
