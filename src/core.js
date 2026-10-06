// DOOFUS core. Zero dependencies. Node 18+ (global fetch).
// Every function returns plain JSON so any adapter (CLI, MCP, Slack, Telegram, Discord) can use it.
'use strict';

const fs = require('fs');
const path = require('path');

const env = (k) => (process.env[k] || '').trim();
const ROOT = path.join(__dirname, '..');
const SOUND_DIR = path.join(ROOT, 'docs', 'sounds');
const SOUNDS = require('../data/sounds.json').sounds;
const TEMPLATES = require('../data/templates.json').templates;

// ---------------------------------------------------------------------------
// SOUNDS — top trending buttons from soundbuttonsworld.com.
// `npm run assets` downloads them into docs/sounds/. Until then we use the source URL.
// ---------------------------------------------------------------------------
const ALIASES = {
  fah: 'fahh', faa: 'fahh', faaa: 'fahh', fahhh: 'fahh', boom: 'vine-boom', vine: 'vine-boom',
  'emotional-damage': 'emotional', damage: 'emotional', cap: 'stop-the-cap', nuke: 'tactical-nuke',
  '67': 'six-seven', 'sixseven': 'six-seven', tuco: 'get-out-tuco', fbi: 'fbi-open-up', cena: 'john-cena',
  violin: 'sad-violin', tacos: 'raining-tacos', sahur: 'tung-tung-sahur', brainrot: 'italian-brainrot-rap',
  hehehaw: 'clash-royale', 'sad': 'sad-violin', laugh: 'goofy-laugh', fart: 'wet-fart', scream: 'ahhh',
};

function withLocal(s) {
  const local = path.join(SOUND_DIR, s.file);
  return { ...s, local: fs.existsSync(local) ? local : null };
}

function listSounds() { return SOUNDS.map(withLocal); }

function sound(name) {
  const key = String(name || '').toLowerCase().trim().replace(/\s+/g, '-');
  let s = SOUNDS.find((x) => x.id === key) || SOUNDS.find((x) => x.id === ALIASES[key]);
  if (!s && /^fa+h*$/.test(key)) s = SOUNDS.find((x) => x.id === 'fahh');
  if (!s && key) s = SOUNDS.find((x) => x.id.includes(key) || x.label.toLowerCase().includes(key.replace(/-/g, ' ')));
  if (!s && key) s = SOUNDS.find((x) => x.vibe.includes(key.replace(/-/g, ' ')));
  if (s) return withLocal(s);
  const r = SOUNDS[Math.floor(Math.random() * SOUNDS.length)];
  return { ...withLocal(r), note: key ? `no sound called "${name}", so here's ${r.label} instead` : undefined };
}

// ---------------------------------------------------------------------------
// GIFS — Giphy API (developers.giphy.com, free key).
// ---------------------------------------------------------------------------
async function gif(query, { limit = 1, rating = 'pg-13' } = {}) {
  const q = String(query || 'chaos');
  const key = env('GIPHY_API_KEY');
  if (key) {
    const u = `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&limit=${Math.max(limit, 12)}&rating=${rating}&lang=en`;
    const r = await fetch(u);
    if (!r.ok) throw new Error(`Giphy said ${r.status}. Check GIPHY_API_KEY.`);
    const j = await r.json();
    const picks = shuffle(j.data || []).slice(0, limit).map((it) => ({
      title: it.title || q,
      url: it.images?.downsized?.url || it.images?.original?.url,
      mp4: it.images?.original_mp4?.mp4 || null,
      page: it.url,
      source: 'giphy',
    })).filter((x) => x.url);
    if (picks.length) return { query: q, results: picks };
    return { query: q, results: [], note: 'Giphy found nothing. Even Giphy is confused.' };
  }
  return {
    query: q,
    results: [{ title: q, url: `https://giphy.com/search/${encodeURIComponent(q.replace(/\s+/g, '-'))}`, source: 'link-only' }],
    note: 'Set GIPHY_API_KEY (free at developers.giphy.com) for real GIFs.',
  };
}

// ---------------------------------------------------------------------------
// MEMES — Imgflip top-all-time templates (data/templates.json).
// Captioning needs a free IMGFLIP_API_KEY.
// ---------------------------------------------------------------------------
function memeTemplates() { return TEMPLATES; }

const NICK = {
  drake: 'Drake Hotline Bling', buttons: 'Two Buttons', boyfriend: 'Distracted Boyfriend', ramp: 'Left Exit 12 Off Ramp',
  exit: 'Left Exit 12 Off Ramp', 'change my mind': 'Change My Mind', slap: 'Batman Slapping Robin', uno: 'UNO Draw 25 Cards',
  skeleton: 'Waiting Skeleton', brain: 'Expanding Brain', spongebob: 'Mocking Spongebob', mocking: 'Mocking Spongebob',
  cat: 'Woman Yelling At Cat', aliens: 'Ancient Aliens', gru: 'Gru\'s Plan', doge: 'Buff Doge vs. Cheems', cheems: 'Buff Doge vs. Cheems',
  bernie: 'Bernie I Am Once Again Asking For Your Support', 'roll safe': 'Roll Safe Think About It', fry: 'Futurama Fry',
  pooh: 'Tuxedo Winnie The Pooh', handshake: 'Epic Handshake', pablo: 'Sad Pablo Escobar', seagull: 'Inhaling Seagull',
  leo: 'Leonardo Dicaprio Cheers', pikachu: 'Surprised Pikachu', 'always has been': 'Always Has Been', harold: 'Hide the Pain Harold',
  pigeon: 'Is This A Pigeon', scroll: 'The Scroll Of Truth', rock: 'The Rock Driving', monkey: 'Monkey Puppet', panik: 'Panik Kalm Panik',
  oprah: 'Oprah You Get A', 'interesting man': 'The Most Interesting Man In The World', 'disaster girl': 'Disaster Girl',
  balloon: 'Running Away Balloon', 'nut button': 'Blank Nut Button', 'one does not simply': 'One Does Not Simply',
};

function findTemplate(name) {
  const t = String(name || '').toLowerCase().trim();
  if (!t) return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const nick = NICK[t] || Object.entries(NICK).find(([k]) => t.includes(k))?.[1];
  return TEMPLATES.find((m) => m.id === t) ||
    TEMPLATES.find((m) => m.name.toLowerCase() === t) ||
    (nick && TEMPLATES.find((m) => m.name === nick)) ||
    TEMPLATES.find((m) => m.name.toLowerCase().includes(t)) ||
    null;
}

async function meme({ template = '', top = '', bottom = '', texts } = {}) {
  let found = findTemplate(template);
  if (!found) {
    // Not in the top 40? Ask Imgflip's live top-100 list.
    try {
      const r = await fetch('https://api.imgflip.com/get_memes');
      const j = await r.json();
      const m = (j?.data?.memes || []).find((x) => x.name.toLowerCase().includes(String(template).toLowerCase()));
      if (m) found = { name: m.name, id: m.id, boxes: m.box_count, image: m.url };
    } catch (_) { /* ignore */ }
  }
  if (!found) found = TEMPLATES[0];

  const key = env('IMGFLIP_API_KEY');
  if (!key) {
    return { template: found.name, image: found.image, note: 'Blank template. Set IMGFLIP_API_KEY (free at imgflip.com/api-settings) to add captions.' };
  }
  const body = new URLSearchParams({ template_id: found.id });
  const lines = Array.isArray(texts) && texts.length ? texts : [top, bottom];
  lines.forEach((txt, i) => body.append(`boxes[${i}][text]`, String(txt || '')));
  const r = await fetch('https://api.imgflip.com/caption_image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) throw new Error(`Imgflip is down or unreachable (HTTP ${r.status}).`);
  const j = await r.json();
  if (!j.success) throw new Error(`Imgflip said no: ${j.error_message}`);
  return { template: found.name, image: j.data.url, page: j.data.page_url };
}

// ---------------------------------------------------------------------------
// ROASTS — bring any LLM. No key = offline roast deck.
// Roasts punch at choices, never at who someone is.
// ---------------------------------------------------------------------------
const SOUND_IDS = SOUNDS.map((s) => s.id).join(', ');
const { doofify } = require('./doofspeak');

const ROAST_SYSTEM = `You are DOOFUS, a dumb-looking but weirdly sharp gremlin who roasts people for fun.
Talk in doofspeak: misspell words on purpose like a lovable idiot (more=moar, too much=tew much, sir=ser, money=moneh/moolah, hello=henlo, friend=fren, small=smol, stupid=stoopid, please=plz, what=wut, because=cuz, probably=prolly). A few per message, still readable. No cuss words.
Rules: 1-2 sentences, max 40 words. Gen Z / Gen Alpha internet voice. Be specific to what they told you.
Roast choices, habits, takes, code, outfits, playlists. Never roast identity: race, religion, gender, sexuality, disability, body, appearance they can't change. No slurs.
Spiciness 1 = playful teasing, 2 = solid burn, 3 = emotional damage (still friendly).
End with exactly one sound tag in brackets, picked from: ${SOUND_IDS}. Example: [vine-boom]`;

const OFFLINE_ROASTS = [
  '{x}? that\'s not a personality, that\'s a loading screen. [bruh]',
  'I\'ve seen better decisions from a Roomba stuck under a couch. {x}, really? [fahh]',
  '{x} is giving "my code works on my machine" energy. [vine-boom]',
  'NPC behavior detected. {x} has the main character energy of a terms-of-service page. [sad-violin]',
  'you said "{x}" with your whole chest and the chest said no. [emotional]',
  'whoever approved {x} needs to be put in time-out with no wifi. [fbi-open-up]',
  '{x}? that\'s crazy. anyway. [we-do-not-care]',
  'not you thinking {x} was the move. it was the opposite of a move. [fahh]',
  '{x} has the same energy as replying "k" to a paragraph. [are-you-serious]',
  'scientists studied {x} and concluded: skill issue. [vine-boom]',
  '{x} is so mid it should come with a participation trophy. [sad-violin]',
  'ratio + L + {x} + touch grass. [clash-royale]',
  '{x} is the reason the group chat has a second group chat. [tactical-nuke]',
  'stop the cap, {x} was never gonna work. [stop-the-cap]',
];

function offlineRoast(target) {
  const x = String(target || 'you').slice(0, 80);
  const line = OFFLINE_ROASTS[Math.floor(Math.random() * OFFLINE_ROASTS.length)].replace(/\{x\}/g, x);
  return { roast: doofify(line), model: 'offline-roast-deck', sound: (line.match(/\[([a-z0-9-]+)\]/) || [])[1] || 'bruh' };
}

async function roast(target, { spice = 2 } = {}) {
  const user = `Spiciness ${spice}. Roast this: ${String(target || 'me').slice(0, 500)}`;
  try {
    let text = null;
    let model = null;
    if (env('ANTHROPIC_API_KEY')) {
      model = env('DOOFUS_MODEL') || 'claude-haiku-4-5-20251001';
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 150, system: ROAST_SYSTEM, messages: [{ role: 'user', content: user }] }),
      });
      text = (await r.json())?.content?.[0]?.text;
    } else if (env('OPENAI_API_KEY') || env('LLM_BASE_URL')) {
      // Any OpenAI-compatible API: OpenAI, OpenRouter, Groq, Ollama, LM Studio, Hermes on vLLM...
      const base = (env('LLM_BASE_URL') || 'https://api.openai.com/v1').replace(/\/$/, '');
      model = env('DOOFUS_MODEL') || 'gpt-4o-mini';
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env('OPENAI_API_KEY') || 'none'}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 150, messages: [{ role: 'system', content: ROAST_SYSTEM }, { role: 'user', content: user }] }),
      });
      text = (await r.json())?.choices?.[0]?.message?.content;
    }
    if (text) {
      const s = (text.match(/\[([a-z0-9-]+)\]/i) || [])[1];
      return { roast: doofify(text.trim()), model, sound: s ? sound(s).id : 'vine-boom' };
    }
  } catch (_) { /* fall through */ }
  return offlineRoast(target);
}

// ---------------------------------------------------------------------------
// REACT — picks a GIF + sound for whatever just happened.
// ---------------------------------------------------------------------------
const MOODS = [
  { re: /(fail|broke|error|bug|crash|oops|wrong|deleted|prod|down)/i, gif: 'this is fine fire', sound: 'fahh' },
  { re: /(win|shipped|launched|passed|promoted|done|finally|merged|paid)/i, gif: 'celebration dance', sound: 'default-dance' },
  { re: /(sus|suspicious|illegal|cursed)/i, gif: 'suspicious side eye', sound: 'fbi-open-up' },
  { re: /(lie|lying|cap|exaggerat)/i, gif: 'stop the cap', sound: 'stop-the-cap' },
  { re: /(monday|meeting|email|standup|deadline)/i, gif: 'tired office', sound: 'bruh' },
  { re: /(sad|rip|cancelled|rejected|dumped|lost)/i, gif: 'crying', sound: 'sad-violin' },
  { re: /(wow|omg|twist|reveal|actually)/i, gif: 'shocked', sound: 'vine-boom' },
  { re: /(money|rich|bought|flex|car)/i, gif: 'make it rain', sound: 'bugatti' },
];

async function react(text) {
  const m = MOODS.find((x) => x.re.test(String(text))) || { gif: String(text).split(/\s+/).slice(0, 3).join(' ') || 'chaos', sound: 'vine-boom' };
  const g = await gif(m.gif);
  return { gif: g.results[0], sound: sound(m.sound), note: g.note };
}

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

// One formatter so every chat surface reads the same.
function toText(result) {
  if (!result) return '';
  if (result.roast) return `🔥 ${result.roast}\n🔊 ${sound(result.sound).src}`;
  if (result.gif) return `${result.gif?.url || ''}\n🔊 ${result.sound.label}: ${result.sound.src}`;
  if (result.results) return result.results.map((r) => r.url).join('\n') + (result.note ? `\n(${result.note})` : '');
  if (result.image) return `${result.image}${result.note ? `\n(${result.note})` : ''}`;
  if (result.src) return `🔊 ${result.label}: ${result.src}${result.note ? `\n(${result.note})` : ''}`;
  if (Array.isArray(result) && result[0]?.vibe) return result.map((s) => `• ${s.id} — ${s.vibe}`).join('\n');
  if (Array.isArray(result) && result[0]?.boxes) return result.map((t) => `${t.rank}. ${t.name} (${t.boxes} boxes)`).join('\n');
  return JSON.stringify(result, null, 2);
}

module.exports = { doofify, gif, meme, memeTemplates, findTemplate, roast, offlineRoast, sound, listSounds, react, toText, SOUNDS, TEMPLATES, ROAST_SYSTEM, SOUND_DIR };
