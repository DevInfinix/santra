import { guides } from './content/guides';
import { usecases } from './content/usecases';

export const SITE_ORIGIN = 'https://santra.singhaman.me';
export type PageMeta = { path: string; title: string; description: string };
export const sitePages: PageMeta[] = [
  { path: '/', title: 'Santra — Offline file conversion for Windows & Linux', description: 'Convert, edit, and organize files locally with Santra for Windows and Linux. Explore image tools, spreadsheets, and engine-dependent media conversion.' },
  { path: '/tools', title: 'Local file conversion & editing tools — Santra', description: 'Explore Santra’s image, spreadsheet, subtitle, archive, document, audio, and video tools, with supported formats and local engine requirements.' },
  { path: '/usecase', title: 'Everyday file workflows, without uploads — Santra', description: 'Prepare listing photos, trim video, hand off documents and spreadsheet data, or organize local files. Find a practical Santra workflow for each task.' },
  { path: '/guides', title: 'Practical offline file conversion guides — Santra', description: 'Step-by-step guides to converting spreadsheets and images, trimming video, handling subtitles, and extracting archives locally on Windows and Linux.' },
  { path: '/pricing', title: 'Santra pricing — Free development preview', description: 'Santra’s current Windows and Linux development preview is free. See what is included, with local processing and no conversion accounts or usage meter.' },
  { path: '/install', title: 'Download Santra for Windows & Linux', description: 'Install Santra on Windows x64 or Linux x64. Choose the Windows installer, Debian package, or portable AppImage for local file conversion and editing.' },
  ...guides.map(guide => ({ path: `/guides/${guide.slug}`, title: `${guide.title} — Santra`, description: guide.description })),
  ...usecases.map(usecase => ({ path: `/usecase/${usecase.slug}`, title: `${usecase.title} — Santra`, description: usecase.description })),
];
export function pageForPath(path: string): PageMeta {
  const clean = path.split('?')[0].replace(/\/$/, '') || '/';
  return sitePages.find(page => page.path === clean) ?? { path: clean, title: 'Page not found — Santra', description: 'This Santra page does not exist. Browse practical guides, local file tools, and Windows or Linux downloads.' };
}
export function applyPageMeta(path: string) {
  const page = pageForPath(path);
  document.title = page.title;
  function meta(key: string, value: string, property = false) {
    const attribute = property ? 'property' : 'name';
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.append(element); }
    element.content = value;
  }
  meta('description', page.description);
  meta('og:title', page.title, true); meta('og:description', page.description, true);
  meta('og:url', `${SITE_ORIGIN}${page.path}`, true); meta('og:type', 'website', true);
  meta('twitter:card', 'summary'); meta('twitter:title', page.title); meta('twitter:description', page.description);
  meta('robots', sitePages.some(item => item.path === page.path) ? 'index,follow' : 'noindex,follow');
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = `${SITE_ORIGIN}${page.path}`;
}
