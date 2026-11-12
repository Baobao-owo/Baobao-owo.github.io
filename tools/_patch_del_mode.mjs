import fs from 'node:fs';

const p = 'themes/argon/layout/chuni-list.ejs';
let t = fs.readFileSync(p, 'utf8');

// 过滤：删除曲 / WE / 普通 三态互斥
const oldFilter = `			if (!state.removed && r.rm) return false;
			if (state.we ? !(r.we && r.we.length) : (r.we && r.we.length)) return false;`;
const newFilter = `			var isDel = !!(r.rm || r.cnrm);
			var isWE = !!(r.we && r.we.length);
			if (state.removed) {
				if (!isDel) return false;
			} else if (state.we) {
				if (!isWE) return false;
			} else {
				if (isDel || isWE) return false;
			}`;
if (t.includes(oldFilter)) {
  t = t.replace(oldFilter, newFilter);
} else {
  console.error('filter pattern miss');
}

// 两个开关互斥
t = t.replace(
  `\tif (rmBtn) rmBtn.addEventListener('click', function () {
\t\tstate.removed = !state.removed;
\t\trmBtn.classList.toggle('active', state.removed);
\t\tstate.page = 1;
\t\trenderRows();
\t});`,
  `\tif (rmBtn) rmBtn.addEventListener('click', function () {
\t\tstate.removed = !state.removed;
\t\tif (state.removed) {
\t\t\tstate.we = false;
\t\t\tvar wb = document.getElementById('chuni-we');
\t\t\tif (wb) wb.classList.remove('active');
\t\t}
\t\trmBtn.classList.toggle('active', state.removed);
\t\tstate.page = 1;
\t\trenderRows();
\t});`
);

t = t.replace(
  `\tif (weBtn) weBtn.addEventListener('click', function () {
\t\tstate.we = !state.we;
\t\tweBtn.classList.toggle('active', state.we);
\t\tstate.page = 1;
\t\trenderRows();
\t});`,
  `\tif (weBtn) weBtn.addEventListener('click', function () {
\t\tstate.we = !state.we;
\t\tif (state.we) {
\t\t\tstate.removed = false;
\t\t\tvar rb = document.getElementById('chuni-removed');
\t\t\tif (rb) rb.classList.remove('active');
\t\t}
\t\tweBtn.classList.toggle('active', state.we);
\t\tstate.page = 1;
\t\trenderRows();
\t});`
);

fs.writeFileSync(p, t, 'utf8');
console.log('patched:', t.includes('var isDel'), t.includes("state.removed = false;\n\t\t\tvar rb"));
