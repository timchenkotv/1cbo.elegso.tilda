#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('www');
const reportPath = path.resolve('reports/audit.json');
const expectedRoutes = ['/', '/howwework/', '/bonus/', '/soglashenie/', '/about/'];

async function walk(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

function routeCandidates(urlPath) {
  const clean = urlPath.replace(/^\/+|\/+$/g, '');
  if (!clean) return [path.join(root, 'index.html')];
  return [
    path.join(root, clean),
    path.join(root, clean, 'index.html'),
    path.join(root, `${clean}.html`),
  ];
}

async function existsAny(candidates) {
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) return true;
    } catch {}
  }
  return false;
}

const files = await walk(root);
const textFiles = files.filter((file) => /\.(?:html|css)$/i.test(file));
const externalAssetReferences = [];
const tildaRuntimeReferences = [];
const brokenLocalReferences = [];
const seoIssues = [];
let formCount = 0;
let formFields = 0;

for (const file of textFiles) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const text = await fs.readFile(file, 'utf8');
  if (file.endsWith('.html')) {
    formCount += (text.match(/<form\b/gi) || []).length;
    formFields += (text.match(/<(?:input|textarea|select)\b/gi) || []).length;
    const route = rel === 'index.html'
      ? '/'
      : rel.endsWith('/index.html')
        ? `/${rel.slice(0, -'index.html'.length)}`
        : null;
    if (route && expectedRoutes.includes(route)) {
      const canonical = `https://1cbo.elegso.ru${route}`;
      const escapedCanonical = canonical.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
      const checks = [
        ['lang', /<html\b[^>]*\blang=["']ru["']/i],
        ['title', /<title>[^<]+<\/title>/i],
        ['description', /<meta\b(?=[^>]*\bname=["']description["'])[^>]*\bcontent=["'][^"']+["']/i],
        ['robots', /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["'][^"']*index[^"']*["']/i],
        ['canonical', new RegExp(`<link\\b(?=[^>]*\\brel=["']canonical["'])[^>]*\\bhref=["']${escapedCanonical}["']`, 'i')],
        ['og:url', new RegExp(`<meta\\b(?=[^>]*\\bproperty=["']og:url["'])[^>]*\\bcontent=["']${escapedCanonical}["']`, 'i')],
        ['h1', /<h1\b[^>]*>[^<]+<\/h1>/i],
        ['schema', /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i],
      ];
      for (const [check, pattern] of checks) {
        if (!pattern.test(text)) seoIssues.push({ route, check });
      }
    }
  }
  const references = [];
  if (file.endsWith('.html')) {
    for (const match of text.matchAll(/<(script|img|source|video|audio|iframe)\b[^>]*\b(?:src|poster|data-src|data-original)=["']([^"']+)["']/gi)) {
      references.push(match[2]);
    }
    for (const match of text.matchAll(/<link\b[^>]*>/gi)) {
      const tag = match[0];
      if (!/\brel=["'][^"']*(?:stylesheet|icon|apple-touch)[^"']*["']/i.test(tag)) continue;
      const href = tag.match(/\bhref=["']([^"']+)["']/i);
      if (href) references.push(href[1]);
    }
  } else {
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) references.push(match[1]);
  }
  for (const raw of references) {
    if (/^https?:\/\//i.test(raw)) {
      externalAssetReferences.push({ file: rel, url: raw });
      continue;
    }
    if (!raw.startsWith('/') || raw.startsWith('//')) continue;
    const pathname = raw.split(/[?#]/, 1)[0];
    if (!await existsAny(routeCandidates(pathname))) brokenLocalReferences.push({ file: rel, url: raw });
  }
  if (file.endsWith('.html') && /(?:tilda\.ws|tildaapi|tildastat|mc\.yandex|googletagmanager|top-fwz1\.mail\.ru)/i.test(text)) {
    tildaRuntimeReferences.push(rel);
  }
}

const missingRoutes = [];
for (const route of expectedRoutes) {
  if (!await existsAny(routeCandidates(route))) missingRoutes.push(route);
}

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    files: files.length,
    htmlFiles: files.filter((file) => file.endsWith('.html')).length,
    images: files.filter((file) => /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i.test(file)).length,
    fonts: files.filter((file) => /\.(?:woff2?|ttf|otf|eot)$/i.test(file)).length,
    forms: formCount,
    formFields,
    missingRoutes: missingRoutes.length,
    externalAssetReferences: externalAssetReferences.length,
    brokenLocalReferences: brokenLocalReferences.length,
    filesWithRuntimeServiceReferences: new Set(tildaRuntimeReferences).size,
    seoIssues: seoIssues.length,
  },
  missingRoutes,
  externalAssetReferences,
  brokenLocalReferences,
  filesWithRuntimeServiceReferences: [...new Set(tildaRuntimeReferences)],
  seoIssues,
};

await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
if (missingRoutes.length || externalAssetReferences.length || brokenLocalReferences.length || seoIssues.length) process.exitCode = 1;
