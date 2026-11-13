import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const origin = 'https://santra.singhaman.me';
const sitemap = readFileSync(resolve(dist, 'sitemap.xml'), 'utf8');
const urls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);
assert.equal(new Set(urls).size, urls.length, 'Sitemap URLs must be unique');
assert.ok(urls.length >= 19, 'Include the primary pages, guides, and use cases');
const titles = new Set(), descriptions = new Set();
for (const url of urls) {
  assert.equal(new URL(url).origin, origin);
  const path = new URL(url).pathname;
  const html = readFileSync(resolve(dist, `.${path}`, 'index.html'), 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(title && description, `Missing metadata for ${path}`);
  assert.ok(!titles.has(title) && !descriptions.has(description), `Duplicate metadata for ${path}`);
  titles.add(title); descriptions.add(description);
  assert.ok(html.includes(`<link rel="canonical" href="${url}"`), `Wrong canonical for ${path}`);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  if (path.startsWith('/guides/') || path.startsWith('/usecase/')) {
    assert.ok(html.includes('<ol>') && html.includes('Limits to check'), `Missing crawlable article for ${path}`);
  }
}
assert.ok(readFileSync(resolve(dist, 'robots.txt'), 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(readFileSync(resolve(dist, '404.html'), 'utf8').includes('noindex,follow'));
console.log(`Static SEO checks passed: ${urls.length} unique pages with canonical URLs and descriptions.`);
