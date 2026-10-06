// Telegram bot via long polling. No webhook, no server, no deps.
// 1. Talk to @BotFather, /newbot, copy the token
// 2. TELEGRAM_BOT_TOKEN=xxx npx doofus telegram
'use strict';
const fs = require('fs');
const core = require('../src/core');
const { run, runText } = require('../src/commands');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) { console.error('Set TELEGRAM_BOT_TOKEN first (get one from @BotFather).'); process.exit(1); }
const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method, body) {
  const r = await fetch(`${API}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

// Send a sound as a voice-style audio clip. Uploads the local file if `npm run assets` was run.
async function sendSound(chat_id, s, caption) {
  if (s.local) {
    const fd = new FormData();
    fd.append('chat_id', String(chat_id));
    fd.append('title', s.label);
    if (caption) fd.append('caption', caption.slice(0, 1000));
    fd.append('audio', new Blob([fs.readFileSync(s.local)], { type: 'audio/mpeg' }), s.file);
    const r = await fetch(`${API}/sendAudio`, { method: 'POST', body: fd });
    const j = await r.json();
    if (j.ok) return;
  }
  const j = await tg('sendAudio', { chat_id, audio: s.src, title: s.label, caption });
  if (!j.ok) await tg('sendMessage', { chat_id, text: `${caption ? caption + '\n' : ''}🔊 ${s.label}: ${s.src}` });
}

async function onMessage(m) {
  const text = (m.text || '').trim();
  if (!text.startsWith('/')) return;
  const clean = text.replace(/^\/(\S+)@\w+/, '/$1'); // strip @botname in groups
  const chat_id = m.chat.id;
  try {
    const out = await run(clean);
    if (out?.roast) { await sendSound(chat_id, core.sound(out.sound), `🔥 ${out.roast}`); return; }
    if (out?.src && out?.file) { await sendSound(chat_id, out); return; }
    if (out?.gif?.url && out.gif.source === 'giphy') {
      await tg('sendAnimation', { chat_id, animation: out.gif.mp4 || out.gif.url });
      await sendSound(chat_id, out.sound);
      return;
    }
    if (out?.results?.[0]?.source === 'giphy') { await tg('sendAnimation', { chat_id, animation: out.results[0].mp4 || out.results[0].url }); return; }
    if (out?.image) { await tg('sendPhoto', { chat_id, photo: out.image, caption: out.note }); return; }
  } catch (_) { /* fall back to text */ }
  await tg('sendMessage', { chat_id, text: await runText(clean), reply_to_message_id: m.message_id });
}

(async function poll(offset = 0) {
  console.log('🤪 DOOFUS is loose in Telegram. Ctrl+C to make it stop.');
  await tg('setMyCommands', { commands: [
    { command: 'roast', description: 'get cooked' },
    { command: 'gif', description: 'find a gif' },
    { command: 'meme', description: 'template | top | bottom' },
    { command: 'fahh', description: 'FAAAHHH' },
    { command: 'sound', description: 'play a trending sound' },
    { command: 'sounds', description: 'list every sound' },
    { command: 'react', description: 'gif + sound for the moment' },
    { command: 'help', description: 'what can this doofus do' },
  ] });
  for (;;) {
    try {
      const r = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`);
      const j = await r.json();
      for (const u of j.result || []) {
        offset = u.update_id + 1;
        if (u.message) onMessage(u.message);
      }
    } catch (e) {
      console.error('poll hiccup:', e.message);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
})();
