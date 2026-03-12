import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('index.html SEO and Skeleton validation', () => {
  let dom;
  let document;

  beforeAll(() => {
    const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
    dom = new JSDOM(html);
    document = dom.window.document;
  });

  it('should have a descriptive title', () => {
    const title = document.querySelector('title');
    expect(title).not.toBeNull();
    expect(title.textContent).not.toBe('taiwanstockscanner');
    expect(title.textContent.length).toBeGreaterThan(5);
  });

  it('should have meta description', () => {
    const metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc).not.toBeNull();
    expect(metaDesc.getAttribute('content')).toBeTruthy();
  });

  it('should have meta keywords', () => {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    expect(metaKeywords).not.toBeNull();
    expect(metaKeywords.getAttribute('content')).toBeTruthy();
  });

  it('should have Open Graph (OG) tags', () => {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    expect(ogTitle).not.toBeNull();
    expect(ogDesc).not.toBeNull();
  });

  it('should have skeleton/fallback content inside #root', () => {
    const root = document.getElementById('root');
    expect(root).not.toBeNull();
    expect(root.innerHTML.trim()).not.toBe('');
  });
});
