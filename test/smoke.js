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

  // The brain: free text in, a bit out.
  const brain = require('../src/brain');
  assert.equal(brain.planByRules('meme that', ['the deploy failed on friday']).action, 'meme');
  assert.equal(brain.planByRules('throw a geefee').action, 'gif');
  assert.equal(brain.planByRules('roast him').action, 'roast');
  assert.equal(brain.planByRules('play a sound').action, 'sound');
  const vs = brain.planByRules('meme tabs vs spaces');
  assert.equal(vs.template, 'Drake Hotline Bling');
  for (let i = 0; i < 20; i++) assert.ok(['roast', 'gif', 'meme', 'sound'].includes(brain.planByRules('what do you think?').action));
  assert.ok(brain.isForDoofus('hey doofus what do you think'));
  assert.ok(brain.isForDoofus('we need a meme for that'));
  assert.ok(!brain.isForDoofus('lunch at noon?'));
  assert.equal(brain.overhear('prod is down again', { chaos: 0 }).mood, 'disaster');
  assert.equal(brain.overhear('we shipped it!! ', { chaos: 0 }).mood, 'win');
  const said = await brain.respond('what do you think about my pull request');
  assert.ok(said.action && brain.toChatText(said).length > 0);
  assert.ok((await runText('meme that')).length > 0);

  // Doofspeak: always on the signature words, never inside links or sound tags.
  const { doofify } = require('../src/doofspeak');
  assert.equal(doofify('Sir, more money is too much', { level: 2, rand: () => 0 }), 'Ser, moar moneh iz tew much');
  assert.equal(doofify('see https://you.com/what [are-you-serious]', { level: 2, rand: () => 0 }), 'see https://you.com/what [are-you-serious]');
  assert.equal(doofify('more', { level: 0 }), 'more');

  console.log('🤪 all smoke tests passed. the doofus lives.');
})().catch((e) => { console.error(e); process.exit(1); });
