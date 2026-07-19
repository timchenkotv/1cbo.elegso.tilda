#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('www');
const canonicalOrigin = 'https://1cbo.elegso.ru';
const publicPages = new Set(['/', '/howwework/', '/bonus/', '/soglashenie/', '/about/']);
const sitemapLastModified = '2026-07-19';
const defaultSocialImage = `${canonicalOrigin}/_external/static.tildacdn.com/tild3361-3061-4133-b262-386262326531/_.png`;
const seoByRoute = new Map([
  ['/', {
    title: 'Бухгалтерское обслуживание и аутсорсинг в Москве — 1С:БухОбслуживание.ЭЮР',
    description: 'Бухгалтерское обслуживание и сопровождение бизнеса в Москве. Бухгалтерский аутсорсинг, налоговая оптимизация и консультации от 1С:БухОбслуживание.ЭЮР.',
    h1: 'Бухгалтерское обслуживание и аутсорсинг в Москве',
  }],
  ['/howwework/', {
    title: 'Как начать работу с 1С:БухОбслуживание.ЭЮР',
    description: 'Как начать работу с бухгалтерской компанией 1С:БухОбслуживание.ЭЮР: этапы подключения, консультация, аудит и сопровождение бизнеса.',
    h1: 'Как начать работу с 1С:БухОбслуживание.ЭЮР',
  }],
  ['/bonus/', {
    title: 'Бонусы для клиентов — 1С:БухОбслуживание.ЭЮР',
    description: 'Бонусы для клиентов 1С:БухОбслуживание.ЭЮР: бесплатные консультации, месяц обслуживания, помощь с регистрацией бизнеса и 1С.',
    h1: 'Бонусы для клиентов 1С:БухОбслуживание.ЭЮР',
  }],
  ['/soglashenie/', {
    title: 'Соглашение и обработка персональных данных',
    description: 'Пользовательское соглашение и политика обработки персональных данных сайта 1cbo.elegso.ru.',
    h1: 'Пользовательское соглашение и обработка персональных данных',
  }],
  ['/about/', {
    title: 'О компании — 1С:БухОбслуживание.ЭЮР',
    description: 'О компании 1С:БухОбслуживание.ЭЮР: бухгалтерский аутсорсинг, налоговая оптимизация и сопровождение малого и среднего бизнеса в Москве.',
    h1: 'О компании 1С:БухОбслуживание.ЭЮР',
  }],
]);

async function walk(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

function routeFor(file) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  if (rel.endsWith('.html')) return `/${rel.slice(0, -'.html'.length)}/`;
  return `/${rel}`;
}

function setCanonical(html, canonical) {
  if (/<link\b[^>]*rel=["'][^"']*canonical/i.test(html)) {
    return html.replace(
      /(<link\b[^>]*rel=["'][^"']*canonical[^>]*href=)["'][^"']*["']/i,
      `$1"${canonical}"`,
    );
  }
  return html.replace(/<\/head>/i, `<link rel="canonical" href="${canonical}">\n</head>`);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function setMeta(html, attribute, key, content) {
  const escapedKey = key.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${escapedKey}["'])[^>]*>`, 'i');
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}">`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function applySeo(html, route, seo) {
  const canonical = `${canonicalOrigin}${route}`;
  const organization = {
    '@type': 'Organization',
    '@id': `${canonicalOrigin}/#organization`,
    name: '1С:БухОбслуживание.ЭЮР',
    legalName: 'ООО «ЭЮР»',
    url: canonicalOrigin,
    email: '1cbo@elegso.ru',
    telephone: '+7-495-646-00-02',
    taxID: '9721218049',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ул. Новорязанская, д. 8Ас2',
      addressLocality: 'Москва',
      addressCountry: 'RU',
    },
  };
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'WebSite',
        '@id': `${canonicalOrigin}/#website`,
        url: `${canonicalOrigin}/`,
        name: '1С:БухОбслуживание.ЭЮР',
        inLanguage: 'ru-RU',
        publisher: { '@id': `${canonicalOrigin}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: seo.title,
        description: seo.description,
        inLanguage: 'ru-RU',
        isPartOf: { '@id': `${canonicalOrigin}/#website` },
        about: { '@id': `${canonicalOrigin}/#organization` },
      },
    ],
  };

  html = html.replace(/<html\b([^>]*)>/i, (_match, attrs) => {
    const cleanAttrs = attrs.replace(/\s+lang=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '');
    return `<html${cleanAttrs} lang="ru">`;
  });
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  if (!/<title>/i.test(html)) html = html.replace(/<\/head>/i, `<title>${escapeHtml(seo.title)}</title>\n</head>`);
  html = setMeta(html, 'name', 'description', seo.description);
  html = setMeta(html, 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  html = setMeta(html, 'property', 'og:locale', 'ru_RU');
  html = setMeta(html, 'property', 'og:type', 'website');
  html = setMeta(html, 'property', 'og:site_name', '1С:БухОбслуживание.ЭЮР');
  html = setMeta(html, 'property', 'og:title', seo.title);
  html = setMeta(html, 'property', 'og:description', seo.description);
  html = setMeta(html, 'property', 'og:url', canonical);
  html = setMeta(html, 'property', 'og:image', defaultSocialImage);
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', seo.title);
  html = setMeta(html, 'name', 'twitter:description', seo.description);
  html = setMeta(html, 'name', 'twitter:image', defaultSocialImage);
  html = html.replace(/\s*<style\b[^>]*data-seo-accessibility[^>]*>[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<\/head>/i, '<style data-seo-accessibility>.seo-visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}</style>\n</head>');
  html = html.replace(/\s*<h1\b[^>]*data-seo-heading[^>]*>[\s\S]*?<\/h1>/gi, '');
  html = html.replace(/<body\b([^>]*)>/i, `<body$1><h1 class="seo-visually-hidden" data-seo-heading>${escapeHtml(seo.h1)}</h1>`);
  html = html.replace(/\s*<script\b[^>]*data-seo-schema[^>]*>[\s\S]*?<\/script>/gi, '');
  return html.replace(/<\/head>/i, `<script type="application/ld+json" data-seo-schema>${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>\n</head>`);
}

function disableForms(html) {
  html = html.replace(/\s*<script\b[^>]*data-static-form-guard[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<form\b([^>]*)>/gi, (_match, attrs) => {
    const safe = attrs
      .replace(/\s+action=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+method=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+data-formactiontype=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+data-success-callback=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+data-static-form(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, '');
    return `<form${safe} action="#" method="post" data-static-form="true">`;
  });

  const guard = `<script data-static-form-guard>(function(){function neutralize(root){if(!root||!root.querySelectorAll)return;var forms=root.matches&&root.matches('form')?[root]:Array.prototype.slice.call(root.querySelectorAll('form'));forms.forEach(function(form){form.action='#';form.method='post';form.dataset.staticForm='true';});}document.addEventListener('DOMContentLoaded',function(){neutralize(document);new MutationObserver(function(records){records.forEach(function(record){Array.prototype.forEach.call(record.addedNodes,neutralize);});}).observe(document.body,{childList:true,subtree:true});});document.addEventListener('submit',function(event){if(event.target&&event.target.matches('form')){event.preventDefault();event.stopImmediatePropagation();}},true);})();</script>`;
  return html.replace(/<\/body>/i, `${guard}\n</body>`);
}

function removeRemoteRuntime(html) {
  html = html
    .replace(/\s*<script\b[^>]*src=["'][^"']*(?:tilda-fallback|tilda-forms|tilda-events|tilda-stat|google-analytics|googletagmanager|mc\.yandex|top-fwz1\.mail\.ru)[^"']*["'][^>]*><\/script>/gi, '')
    .replace(/\s*<link\b[^>]*(?:rel=["'](?:preconnect|dns-prefetch)["'][^>]*href=["']https?:\/\/[^"']+["']|href=["']https?:\/\/[^"']+["'][^>]*rel=["'](?:preconnect|dns-prefetch)["'])[^>]*>/gi, '')
    .replace(/\s*<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, (block) =>
      /(?:mc\.yandex|googletagmanager|top-fwz1\.mail\.ru)/i.test(block) ? '' : block,
    );
  return html.replace(/\s*<script\b[^>]*>[\s\S]*?<\/script>/gi, (block) =>
    /(?:ym\(|GoogleAnalyticsObject|googletagmanager\.com|tildaStat|stat\.tildacdn)/i.test(block) ? '' : block,
  );
}

function normalizeInternalUrls(html) {
  return html
    .replace(/https?:\/\/(?:www\.)?1cbo\.elegso\.ru\//gi, '/')
    .replace(/href=["']\/(howwework|bonus|soglashenie|about)["']/gi, 'href="/$1/"');
}

function eagerlyLoadLocalImages(html) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const original = tag.match(/\bdata-original=["']([^"']+)["']/i)?.[1];
    if (!original || !original.startsWith('/')) return tag;
    if (/\bsrc=["'][^"']*["']/i.test(tag)) {
      return tag.replace(/\bsrc=["'][^"']*["']/i, `src="${original}"`);
    }
    return tag.replace(/\s*\/?\s*>$/, ` src="${original}">`);
  });
}

const htmlFiles = (await walk(root)).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const route = routeFor(file);
  let html = await fs.readFile(file, 'utf8');
  html = eagerlyLoadLocalImages(html);
  html = html.replace(/(tilda-zero-forms-1\.0\.min\.js)(?:\?[^'"\s<]*)?/gi, '$1?v=20260719-2');
  html = html.replace(/\s*<script\b[^>]*data-local-phone-country[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<head>/i, '<head><script data-local-phone-country>window.geoCountry="RU";window.geoCountryRequested=true;</script>');
  html = html.replace(/(<div\s+id=["']allrecords["'])([^>]*)(>)/i, (_match, start, attrs, end) => {
    const cleanAttrs = attrs.replace(/\s+data-tilda-imgoptimoff=["'][^"']*["']/gi, '');
    return `${start}${cleanAttrs} data-tilda-imgoptimoff="yes"${end}`;
  });
  html = normalizeInternalUrls(html);
  html = removeRemoteRuntime(html);
  html = disableForms(html);
  html = setCanonical(html, `${canonicalOrigin}${route}`);
  html = html.replace(/(<meta\b[^>]*property=["']og:url["'][^>]*content=)["'][^"']*["']/i, `$1"${canonicalOrigin}${route}"`);
  const seo = seoByRoute.get(route);
  if (seo) html = applySeo(html, route, seo);
  html = html.replace(/[ \t]+$/gm, '');
  await fs.writeFile(file, html);
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...[...publicPages].map((route) => `  <url><loc>${canonicalOrigin}${route}</loc><lastmod>${sitemapLastModified}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n');
await fs.writeFile(path.join(root, 'sitemap.xml'), sitemap);
await fs.writeFile(
  path.join(root, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${canonicalOrigin}/sitemap.xml\n`,
);

const zeroFormsScript = path.join(root, '_external/static.tildacdn.com/js/tilda-zero-forms-1.0.min.js');
try {
  const raw = await fs.readFile(zeroFormsScript, 'utf8');
  const localized = raw.replaceAll(
    'https://static.tildacdn.com/css/tilda-zero-form-errorbox.min.css',
    '/_external/static.tildacdn.com/css/tilda-zero-form-errorbox.min.css',
  ).replaceAll(
    '"https://static.tildacdn."+t_zeroForms__getRootZone()',
    '"/_external/static.tildacdn.com"',
  );
  if (localized !== raw) await fs.writeFile(zeroFormsScript, localized);
} catch {}

console.log(`Finalized ${htmlFiles.length} HTML files; visible form fields were preserved and submissions disabled.`);
