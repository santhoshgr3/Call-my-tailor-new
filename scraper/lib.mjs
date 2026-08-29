import fs from 'node:fs';
import path from 'node:path';

export const BASE = 'https://callmytailor.com';
export const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const CACHE = path.join(process.cwd(), 'data', 'cache');
fs.mkdirSync(CACHE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchHtml(url, { force = false } = {}) {
  const key = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_').slice(0, 180);
  const file = path.join(CACHE, key + '.html');
  if (!force && fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      const text = await res.text();
      fs.writeFileSync(file, text);
      await sleep(350);
      return text;
    } catch (e) {
      if (attempt >= 4) throw e;
      console.warn('  retry', attempt, url, e.message);
      await sleep(1500 * attempt);
    }
  }
}

export function save(name, obj) {
  const file = path.join(process.cwd(), 'data', name);
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
  console.log('saved', name, Array.isArray(obj) ? `(${obj.length})` : '');
}

export function load(name) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', name), 'utf8'));
}

export const abs = (u) => {
  if (!u) return null;
  u = u.trim();
  if (u.startsWith('//')) return 'https:' + u;
  if (u.startsWith('http')) return u;
  if (u.startsWith('/')) return BASE + u;
  return BASE + '/' + u;
};

export const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
