// DOOFUS brain: reads a message (plus a bit of chat context) and decides what to do.
//   "meme that"            -> meme about the previous message
//   "gif when prod breaks" -> GIF
//   "play something"       -> sound
//   "roast me"             -> roast
//   "doofus what do you think?" -> random: roast, GIF, meme or sound
// With an AI key it asks the model to pick (smarter captions and GIF searches).
// Without one it uses rules. Either way you get back a plan, then perform(plan) makes the media.
'use strict';
const core = require('./core');
const { doofify } = require('./doofspeak');

const env = (k) => (process.env[k] || '').trim();
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const TRIGGERS = {
  gif: /\b(gif+y?|giph?y|geef(ee|y)|jif|reaction gif)\b/i,
  meme: /\b(meme|memeify|meme (that|this|it))\b/i,
  roast: /\b(roast|cook|flame|destroy) (me|him|her|them|this|that|it|my)\b|\broast\b/i,
  sound: /\b(sound|play (a |something|it)|fahh+|vine boom|bruh sound|sfx|soundboard)\b/i,
  opinion: /\b(what do (you|u) think|thoughts\??|opinion|rate (this|my|it)|wdyt|react to|your take)\b/i,
};

// Moods drive emoji reactions, sounds and GIF searches when there's no better clue.
const MOODS = [
  { re: /(fail|broke|broken|error|bug|crash|oops|wrong|deleted|prod|outage|down\b|rip\b)/i, mood: 'disaster', emoji: 'skull', sound: ['fahh', 'wasted', 'roblox-oof', 'mission-failed', 'error'], gif: 'this is fine fire' },
  { re: /(win|shipped|launched|passed|promoted|finally|merged|paid|closed the deal|we did it|lets go|let's go)/i, mood: 'win', emoji: 'fire', sound: ['mission-passed', 'yippee', 'default-dance', 'bugatti', 'siu'], gif: 'celebration dance' },
  { re: /(sus|suspicious|illegal|cursed|weird flex)/i, mood: 'sus', emoji: 'eyes', sound: ['sus', 'fbi-open-up', 'side-eye'], gif: 'suspicious side eye' },
  { re: /(\bcap\b|lie|lying|trust me|i swear|no way that)/i, mood: 'cap', emoji: 'billed_cap', sound: ['stop-the-cap', 'how-about-no'], gif: 'stop the cap' },
  { re: /(monday|meeting|standup|deadline|email|calendar|sync)/i, mood: 'office', emoji: 'sleeping', sound: ['snore', 'bruh', 'two-hours-later'], gif: 'tired office' },
  { re: /(sad|cancel|rejected|dumped|lost|tired|exhausted|cry)/i, mood: 'sad', emoji: 'sob', sound: ['sad-violin', 'why-you-bully-me'], gif: 'crying' },
  { re: /(wow|omg|twist|no way|wait what|what\?)/i, mood: 'shock', emoji: 'exploding_head', sound: ['vine-boom', 'wait-what', 'oh-great-heavens'], gif: 'shocked' },
  { re: /(lol|lmao|haha|😂|💀|dead)/i, mood: 'funny', emoji: 'joy', sound: ['lol', 'scooby-laugh', 'sitcom-laugh', 'heheha'], gif: 'laughing' },
  { re: /(food|lunch|hungry|pizza|taco|burger|eat)/i, mood: 'food', emoji: 'taco', sound: ['whopper', 'raining-tacos', 'minecraft-eating'], gif: 'hungry' },
  { re: /(money|rich|bought|price|\$|budget|invoice)/i, mood: 'money', emoji: 'money_with_wings', sound: ['mrbeast', 'bugatti', 'apple-pay'], gif: 'make it rain' },
  { re: /(idea|plan|what if|galaxy|genius)/i, mood: 'idea', emoji: 'brain', sound: ['galaxy-brain', 'let-him-cook'], gif: 'big brain' },
];

function moodOf(text) {
  return MOODS.find((m) => m.re.test(String(text || ''))) || null;
}

const STOP = new Set('a an the and or but so to of in on at for with is are was were be been it its it\'s this that these those i me my you your we our they them he she his her doofus bot pls please can could would will just like really very some any need want give send throw make do does did hey yo ok okay lol for us about what think thoughts gif giphy geefee jif meme sound play roast react that\'s here there get got'.split(' '));

function keywords(text, n = 4) {
  return String(text || '').toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).slice(0, n).join(' ');
}

// Strip the trigger part so "meme that: monday meetings" -> "monday meetings".
function subjectOf(text) {
  return String(text || '')
    .replace(/<@[^>]+>/g, '')
    .replace(/^\s*(hey|yo|ok|okay)?\s*,?\s*(@?doofus)\s*[,:]?/i, '')
    .replace(/\b(make|send|throw|give|drop|post)?\s*(me|us)?\s*(a|an|the)?\s*(meme|gif+y?|giph?y|geef(ee|y)|jif|sound|roast)\s*(that|this|it|of|for|about|when|me)?\s*[:,-]?/i, '')
    .replace(/\b(what do (you|u) think( about| of)?|wdyt|thoughts( on)?|your take( on)?)\s*[:?]?/i, '')
    .replace(/^[\s,.:?!-]+|[\s,.:?!-]+$/g, '')
    .trim();
}

const PUNCHLINES = ['skill issue', 'and it was a mistake', 'we do not talk about it', 'nobody asked', 'it\'s giving chaos', 'this is fine', 'absolute cinema', 'stop the cap', 'the audacity'];

function memeFromText(subject) {
  const s = subject.replace(/\s+/g, ' ').trim() || 'this conversation';
  const vs = s.match(/(.+?)\s+(?:vs\.?|versus|or)\s+(.+)/i);
  if (vs) return { template: 'Drake Hotline Bling', texts: [vs[1], vs[2]] };
  const when = s.match(/^when (.+)/i);
  if (when) return { template: 'Surprised Pikachu', texts: [s, '', ''] };
  return pick([
    { template: 'Change My Mind', texts: [s, ''] },
    { template: 'One Does Not Simply', texts: ['one does not simply', s] },
    { template: 'Waiting Skeleton', texts: ['me waiting for', s] },
    { template: 'Mocking Spongebob', texts: [s, s.split('').map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join('')] },
    { template: 'Disaster Girl', texts: [s, pick(PUNCHLINES)] },
    { template: 'Futurama Fry', texts: ['not sure if ' + s, 'or ' + pick(PUNCHLINES)] },
  ]);
}

// ---------------------------------------------------------------------------
// Rule-based planner (no AI key needed)
// ---------------------------------------------------------------------------
function planByRules(text, history = []) {
  // "meme that" → the subject is the last thing someone actually said, not "that".
  const useful = (x) => { const t = subjectOf(x); return t && !/^(that|this|it|please|pls)$/i.test(t) ? t : ''; };
  const prev = history.map(useful).filter(Boolean).pop() || '';
  const subject = useful(text) || prev || subjectOf(text);
  const mood = moodOf(subject) || moodOf(prev) || moodOf(text);
  let action = null;
  for (const a of ['gif', 'meme', 'roast', 'sound']) if (TRIGGERS[a].test(text)) { action = a; break; }
  if (!action) action = pick(['roast', 'gif', 'meme', 'sound', 'roast', 'gif']); // "what do you think?" = surprise

  if (action === 'gif') return { action, gif: keywords(subject) || mood?.gif || 'reaction', sound: mood ? pick(mood.sound) : null };
  if (action === 'meme') return { action, ...memeFromText(subject), sound: 'vine-boom' };
  if (action === 'sound') return { action, sound: mood ? pick(mood.sound) : pick(core.SOUNDS).id };
  return { action: 'roast', target: subject || 'you, for asking', spice: 2 };
}

// ---------------------------------------------------------------------------
// AI planner: one cheap call that returns JSON
// ---------------------------------------------------------------------------
function plannerPrompt() {
  const templates = core.TEMPLATES.map((t) => `${t.name} (${t.boxes} boxes)`).join('; ');
  const sounds = core.SOUNDS.map((s) => `${s.id}=${s.vibe}`).join('; ');
  return `You are DOOFUS, a chaotic but kind meme gremlin in a group chat. Decide how to react to the latest message.
Talk in doofspeak (on purpose misspellings: moar, tew much, ser, moneh, henlo, fren, smol, wut, cuz, prolly). No cuss words.
Reply with ONLY a JSON object, no prose:
{"action":"roast|gif|meme|sound","text":"short reply, max 25 words, Gen Z voice, optional","gif":"2-4 word Giphy search","template":"exact template name","texts":["caption 1","caption 2"],"sound":"sound id"}
Rules:
- If they ask for a gif/giphy/geefee -> action gif. Meme -> meme. Sound -> sound. Roast -> roast (put the roast in "text").
- "what do you think" / vague mention -> pick whatever is funniest.
- Memes must be about what the chat is actually talking about. Short captions. Use the template's box count.
- Roast choices, never identity, bodies or anything people can't change. No slurs. If someone seems genuinely upset, action "sound" with "text" being something kind and no joke.
Templates: ${templates}
Sounds: ${sounds}`;
}

async function askModel(system, user) {
  if (env('ANTHROPIC_API_KEY')) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: env('DOOFUS_MODEL') || 'claude-haiku-4-5-20251001', max_tokens: 300, system, messages: [{ role: 'user', content: user }] }),
    });
    return (await r.json())?.content?.[0]?.text;
  }
  if (env('OPENAI_API_KEY') || env('LLM_BASE_URL')) {
    const base = (env('LLM_BASE_URL') || 'https://api.openai.com/v1').replace(/\/$/, '');
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env('OPENAI_API_KEY') || 'none'}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: env('DOOFUS_MODEL') || 'gpt-4o-mini', max_tokens: 300, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    });
    return (await r.json())?.choices?.[0]?.message?.content;
  }
  return null;
}

async function plan(text, history = []) {
  try {
    const ctx = history.slice(-6).map((m, i) => `${i + 1}. ${m}`).join('\n');
    const out = await askModel(plannerPrompt(), `Recent chat:\n${ctx || '(nothing)'}\n\nLatest message: ${text}`);
    const json = out && JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
    if (json && ['roast', 'gif', 'meme', 'sound'].includes(json.action)) {
      if (json.sound) json.sound = core.sound(json.sound).id;
      return { ...json, by: 'ai' };
    }
  } catch (_) { /* fall back to rules */ }
  return { ...planByRules(text, history), by: 'rules' };
}

// ---------------------------------------------------------------------------
// Turn a plan into actual stuff to post
// ---------------------------------------------------------------------------
async function perform(p) {
  const out = { action: p.action, text: doofify(p.text || ''), by: p.by };
  if (p.action === 'roast') {
    if (p.text) { out.sound = core.sound(p.sound || 'emotional'); }
    else { const r = await core.roast(p.target, { spice: p.spice || 2 }); out.text = r.roast.replace(/\s*\[[a-z0-9-]+\]\s*$/i, ''); out.sound = core.sound(r.sound); }
  } else if (p.action === 'gif') {
    const g = await core.gif(p.gif || 'reaction');
    out.gif = g.results[0] || null; out.query = g.query; out.note = g.note;
    if (p.sound) out.sound = core.sound(p.sound);
  } else if (p.action === 'meme') {
    const texts = (p.texts || []).map((t) => doofify(t));
    const m = await core.meme({ template: p.template, texts: texts.length ? texts : undefined });
    out.image = m.image; out.template = m.template; out.captions = texts; out.note = m.note;
    if (p.sound) out.sound = core.sound(p.sound);
  } else {
    out.sound = core.sound(p.sound || pick(core.SOUNDS).id);
  }
  return out;
}

// What should DOOFUS do with a message he's overhearing (not addressed to him)?
// Returns an emoji reaction most of the time, and very rarely jumps in.
function overhear(text, { chaos = Number(env('DOOFUS_CHAOS') || 0.03) } = {}) {
  const m = moodOf(text);
  return { emoji: m ? m.emoji : null, jumpIn: Math.random() < chaos, mood: m ? m.mood : null };
}

// Is this message talking to DOOFUS or asking for a bit?
function isForDoofus(text, botNames = ['doofus']) {
  const t = String(text || '');
  if (botNames.some((n) => n && t.toLowerCase().includes(n.toLowerCase()))) return true;
  return /\b(meme (that|this|it)|gif (that|this|it)|giph?y (that|this|it)|geefee|need a (meme|gif|giphy)|throw a (meme|gif|giphy)|roast (him|her|them|me))\b/i.test(t);
}

// Tiny per-chat memory so "meme that" knows what "that" is.
const memory = new Map();
function remember(chatId, text, max = 8) {
  const a = memory.get(chatId) || [];
  a.push(String(text).slice(0, 400));
  while (a.length > max) a.shift();
  memory.set(chatId, a);
  return a;
}
function recall(chatId) { return (memory.get(chatId) || []).slice(); }

// One-shot helper for adapters: message in, media out.
async function respond(text, { chatId = 'default', history } = {}) {
  const h = history || recall(chatId);
  const p = await plan(text, h);
  return perform(p);
}

function toChatText(r, site = env('DOOFUS_SITE') || 'https://eddielobanovskiy.github.io/doofus/') {
  const lines = [];
  if (r.text) lines.push(r.action === 'roast' ? `🔥 ${r.text}` : r.text);
  if (r.gif?.url) lines.push(r.gif.url);
  if (r.image) lines.push(r.image);
  if (r.sound) lines.push(`🔊 ${r.sound.label}: ${site.replace(/\/$/, '')}/sounds/${r.sound.id}.mp3`);
  if (r.note) lines.push(`(${r.note})`);
  return lines.join('\n');
}

module.exports = { plan, planByRules, perform, respond, overhear, isForDoofus, remember, recall, moodOf, subjectOf, keywords, toChatText, TRIGGERS };
