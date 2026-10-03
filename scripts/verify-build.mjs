import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const base = '/pmfolip/';
const site = `https://artmasster.github.io${base}`;
const html = readFileSync('dist/index.html', 'utf8');
assert(html.includes(`rel="canonical" href="${site}"`), 'Published canonical URL');
const localAssets = [...html.matchAll(/(?:src|href)="(\/[^"\s]+)"/g)].map((match) => match[1]);
assert(localAssets.some((path) => path.endsWith('.js')), 'Built JavaScript entry');
assert(localAssets.some((path) => path.endsWith('.css')), 'Built stylesheet');
for (const path of localAssets) {
  assert(path.startsWith(base), `Asset outside project base: ${path}`);
  assert(statSync(`dist/${path.slice(base.length)}`).size > 0, `Missing asset: ${path}`);
}
const source = JSON.parse(readFileSync('src/data/leaders.json', 'utf8'));
const published = JSON.parse(readFileSync('dist/data/leaders.json', 'utf8'));
assert.deepEqual(published, source, 'Published roster matches the research snapshot');
for (const leader of published.leaders) {
  if (leader.portrait) assert(statSync(`dist${leader.portrait}`).size > 0, `Portrait: ${leader.id}`);
}
for (const name of ['indicators.json', 'indicators-worldbank.json', 'indicators-historical.json', 'indicators-extended.json']) {
  const data = JSON.parse(readFileSync(`dist/data/${name}`, 'utf8'));
  assert(data.indicators.length > 0, `Empty evidence: ${name}`);
}
for (const name of ['methodology', 'development', 'leader-sources', 'historical-data', 'extended-data']) {
  assert(statSync(`dist/data/${name}.md`).size > 0, `Missing documentation: ${name}`);
}
assert(readFileSync('dist/sitemap.xml', 'utf8').includes(`<loc>${site}</loc>`));
assert(readFileSync('dist/robots.txt', 'utf8').includes(`${site}sitemap.xml`));
console.log(`Pages artifact verified: ${localAssets.length} entry assets, ${published.leaders.length} profiles, evidence and documentation.`);
