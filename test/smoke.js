// Offline smoke test: no keys, no network needed for these paths.
'use strict';
const assert = require('assert');
for (const k of Object.keys(process.env)) if (/API_KEY|LLM_BASE_URL/.test(k)) delete process.env[k];

const core = require('../src/core');
const { run, runText } = require('../src/commands');

(async () => {
  assert.equal(core.sound('FAAAAH').id, 'fahh');
  assert.equal(core.sound('vine boom').id, 'vine-boom');
  assert.equal(core.sound('67').id, 'six-seven');
  assert.equal(core.sound('emotional damage').id, 'emotional');
  assert.ok(core.sound('kazoo').note, 'unknown sound gets a fallback note');
  assert.match(core.sound('bruh').src, /^https:\/\/soundbuttonsworld\.com\/uploads\/.+\.mp3$/);
  assert.equal(new Set(core.SOUNDS.map((s) => s.id)).size, core.SOUNDS.length, 'sound ids are unique');

  assert.equal(core.findTemplate('drake').id, '181913649');
  assert.equal(core.findTemplate('cheems').name, 'Buff Doge vs. Cheems');
  assert.equal(core.findTemplate('pikachu').name, 'Surprised Pikachu');
  assert.equal(core.TEMPLATES.length, 40);

  const r = await core.roast('my 47 browser tabs');
  assert.ok(r.roast.includes('47 browser tabs'), 'offline roast uses the target');
  assert.ok(core.SOUNDS.some((s) => s.id === r.sound), `roast sound "${r.sound}" exists`);

  const g = await core.gif('cat typing');
  assert.equal(g.results[0].source, 'link-only');

  const m = await core.meme({ template: 'two buttons', texts: ['a', 'b'] });
  assert.equal(m.template, 'Two Buttons');
  assert.match(m.note, /IMGFLIP_API_KEY/);

  assert.match((await run('roast --spice 3 my code')).roast, /my code/);
  assert.match(await runText('help'), /DOOFUS/);
  assert.match(await runText('/fahh'), /FAAAHHH/);
  assert.match(await runText('/doofus vine-boom'), /VINE BOOM/);
  assert.match(await runText('sounds'), /tactical-nuke/);
  assert.match(await runText('memes'), /Drake Hotline Bling/);

  console.log('🤪 all smoke tests passed. the doofus lives.');
})().catch((e) => { console.error(e); process.exit(1); });
