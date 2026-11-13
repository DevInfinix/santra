import type { Plugin } from 'vite';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE_ORIGIN, pageForPath, sitePages, type PageMeta } from './src/seo';
import { guides } from './src/content/guides';
import { usecases } from './src/content/usecases';

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
function crawlableContent(page: PageMeta) {
  const guide = guides.find(item => page.path === `/guides/${item.slug}`);
  const usecase = usecases.find(item => page.path === `/usecase/${item.slug}`);
  const item = guide ?? usecase;
  const links = sitePages.filter(other => other.path !== page.path).map(other => `<li><a href="${other.path}">${escape(other.title)}</a></li>`).join('');
  return `<nav aria-label="Site"><a href="/">Santra</a> · <a href="/guides">Guides</a> · <a href="/usecase">Use cases</a> · <a href="/install">Install</a></nav><main><h1>${escape(guide?.headline ?? page.title.replace(' — Santra', ''))}</h1><p>${escape(page.description)}</p>${item ? `<p>${escape(item.pain)}</p><p>${escape(item.answer)}</p><h2>Steps</h2><ol>${item.steps.map(step => `<li><h3>${escape(step.title)}</h3><p>${escape(step.body)}</p></li>`).join('')}</ol><h2>Limits to check</h2><ul>${item.limits.map(limit => `<li>${escape(limit)}</li>`).join('')}</ul>` : ''}${guide ? `<h2>Questions</h2>${guide.faq.map(faq => `<h3>${escape(faq.question)}</h3><p>${escape(faq.answer)}</p>`).join('')}` : ''}<h2>Explore Santra</h2><ul>${links}</ul></main>`;
}
function htmlForPage(template: string, page: PageMeta) {
  const url = `${SITE_ORIGIN}${page.path}`;
  const indexable = sitePages.some(item => item.path === page.path);
  const head = `<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}" />
<link rel="canonical" href="${url}" />
<meta name="robots" content="${indexable ? 'index,follow' : 'noindex,follow'}" />
<meta property="og:site_name" content="Santra" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escape(page.title)}" />
<meta property="og:description" content="${escape(page.description)}" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escape(page.title)}" />
<meta name="twitter:description" content="${escape(page.description)}" />`;
  return template.replace(/<title>[\s\S]*?<\/title>/g, '').replace(/<meta\s+(?:name="(?:description|robots|twitter:[^"]*)"|property="og:[^"]*")[^>]*>/g, '').replace(/<link\s+rel="canonical"[^>]*>/g, '')
    .replace('</head>', `${head}\n</head>`).replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${crawlableContent(page)}</div>`);
}
export function seoPages(): Plugin {
  let outputDirectory: string;
  let isBuild = false;
  return {
    name: 'santra-static-page-metadata',
    configResolved(config) { isBuild = config.command === 'build'; outputDirectory = resolve(config.root, config.build.outDir); },
    transformIndexHtml(html, context) {
      return context.server ? htmlForPage(html, pageForPath(context.originalUrl ?? context.path)) : html;
    },
    closeBundle() {
      if (!isBuild) return;
      const template = readFileSync(resolve(outputDirectory, 'index.html'), 'utf8');
      for (const page of sitePages) {
        const directory = resolve(outputDirectory, `.${page.path}`);
        mkdirSync(directory, { recursive: true });
        writeFileSync(resolve(directory, 'index.html'), htmlForPage(template, page));
      }
      writeFileSync(resolve(outputDirectory, '404.html'), htmlForPage(template, pageForPath('/404')));
      writeFileSync(resolve(outputDirectory, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitePages.map(page => `  <url><loc>${SITE_ORIGIN}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`);
    },
  };
}
