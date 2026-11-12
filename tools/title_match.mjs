// 共用：曲名归一键（全角/半角、标点、空格、括号、& 等都抹平）
export function keyOf(t) {
  return String(t || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[!！?？:：;；,，.。~～\-–—_'"“”‘’「」『』【】\[\]()（）〈〉《》・/\\|]/g, '')
    .replace(/&/g, 'and')
    .replace(/＆/g, 'and')
    .replace(/[\s\u3000]/g, '')
    .trim();
}

export function coreTitle(t) {
  // 去掉末尾括号补充（(TV edit)、［Reborn］ 之类）后的核心名
  return String(t || '')
    .replace(/[\(（\[［【][^\)）\]］】]*[\)）\]］】]\s*$/g, '')
    .trim();
}

export function buildIndex(songs) {
  const byKey = new Map();
  const byCore = new Map();
  for (const s of songs) {
    const k = keyOf(s.title);
    if (k && !byKey.has(k)) byKey.set(k, s);
    const c = keyOf(coreTitle(s.title));
    if (c && !byCore.has(c)) byCore.set(c, s);
  }
  return { byKey, byCore };
}

export function matchSong(title, artist, songs) {
  const k = keyOf(title);
  const c = keyOf(coreTitle(title));
  const { byKey, byCore } = buildIndex(songs);
  if (byKey.has(k)) return byKey.get(k);
  if (byCore.has(c)) return byCore.get(c);
  if (artist) {
    const ka = keyOf(title) + '|' + keyOf(artist);
    for (const s of songs) {
      if (keyOf(s.title) + '|' + keyOf(s.artist) === ka) return s;
    }
  }
  return null;
}
