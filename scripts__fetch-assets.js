#!/usr/bin/env node
// Downloads everything the bot and the landing page use:
//   docs/sounds/*.mp3  (39 trending sounds, soundbuttonsworld.com)
//   docs/gifs/*        (22 GIFs, GIPHY)
//   docs/memes/*.jpg   (top 12 meme templates, Imgflip)
// Run once: npm run assets   (add --force to re-download)
'use strict';
const fs = require('fs');
const path = require('path');
const D = (p) => path.join(__dirname, '..', p);
const jobs = [];
for (const s of require('../data/sounds.json').sounds) jobs.push([s.src, D(`docs/sounds/${s.id}.mp3`)]);
for (const [k, [id, ext]] of Object.entries(require('../data/gifs.json').gifs)) jobs.push([`https://media.giphy.com/media/${id}/200.${ext}`, D(`docs/gifs/${k}.${ext}`)]);
for (const t of require('../data/templates.json').templates.slice(0, 12)) jobs.push([t.image, D(`docs/memes/${t.image.split('/').pop()}`)]);

(async () => {
  let ok = 0, skip = 0, fail = 0;
  for (const [url, out] of jobs) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    if (fs.existsSync(out) && !process.argv.includes('--force')) { skip++; continue; }
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 doofus-asset-fetcher' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
      console.log('✅', path.relative(D('.'), out)); ok++;
    } catch (e) { console.log('💀', url, e.message); fail++; }
  }
  console.log(`\ndone: ${ok} downloaded, ${skip} already there, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
