// DOOFUS for Telegram. Long polling: no server, no webhook.
//   1. Message @BotFather → /newbot → copy the token
//   2. (groups) @BotFather → /setprivacy → Disable, so he can hear the chat
//   3. TELEGRAM_BOT_TOKEN=xxx npm run telegram
// Then just talk: "doofus what do you think", "meme that", "gif when prod breaks", "/fahh".
// He reacts to messages with emoji on his own, and rarely jumps in (DOOFUS_CHAOS, default 3%).
'use strict';
const fs = require('fs');
const core = require('../src/core');
const brain = require('../src/brain');
const { run, runText } = require('../src/commands');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) { console.error('Set TELEGRAM_BOT_TOKEN first (get one from @BotFather).'); process.exit(1); }
const API = `https://api.telegram.org/bot${TOKEN}`;
const REACT = (process.env.DOOFUS_REACT || 'on') !== 'off';
// Telegram only allows certain reaction emoji.
const TG_EMOJI = { disaster: '😱', win: '🔥', sus: '👀', cap: '🤨', office: '😴', sad: '😭', shock: '🤯', funny: '🤣', food: '🌭', money: '💯', idea: '🤓' };
let me = { username: 'doofus' };

async function tg(method, body) {
  const r = await fetch(`${API}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

// Send a sound as an audio clip. Uploads the local file if `npm run assets` was run.
async function sendSound(chat_id, s, caption) {
  if (s.local) {
    const fd = new FormData();
    fd.append('chat_id', String(chat_id));
    fd.append('title', s.label);
    if (caption) fd.append('caption', caption.slice(0, 1000));
    fd.append('audio', new Blob([fs.readFileSync(s.local)], { type: 'audio/mpeg' }), s.file);
    const j = await (await fetch(`${API}/sendAudio`, { method: 'POST', body: fd })).json();
    if (j.ok) return;
  }
  const j = await tg('sendAudio', { chat_id, audio: s.src, title: s.label, caption });
  if (!j.ok) await tg('sendMessage', { chat_id, text: `${caption ? caption + '\n' : ''}🔊 ${s.label}: ${s.src}` });
}

// Post whatever the brain came up with.
async function post(chat_id, r, reply_to) {
  const caption = r.text ? (r.action === 'roast' ? `🔥 ${r.text}` : r.text) : undefined;
  if (r.gif?.url && r.gif.source === 'giphy') await tg('sendAnimation', { chat_id, animation: r.gif.mp4 || r.gif.url, caption, reply_to_message_id: reply_to });
  else if (r.image) await tg('sendPhoto', { chat_id, photo: r.image, caption: caption || (r.note ? `(${r.note})` : undefined), reply_to_message_id: reply_to });
  else if (r.sound && r.action !== 'roast' && !r.gif) return sendSound(chat_id, r.sound, caption);
  else await tg('sendMessage', { chat_id, text: brain.toChatText({ ...r, sound: null }) || '🤪', reply_to_message_id: reply_to });
  if (r.sound) await sendSound(chat_id, r.sound);
}

async function onMessage(m) {
  const text = (m.text || m.caption || '').trim();
  if (!text) return;
  const chat_id = m.chat.id;
  const history = brain.recall(chat_id);
  brain.remember(chat_id, text);

  // Slash commands still work: /roast, /gif, /meme, /fahh, /sounds...
  if (text.startsWith('/')) {
    const clean = text.replace(/^\/(\S+)@\w+/, '/$1');
    try {
      const out = await run(clean);
      if (out?.roast) return sendSound(chat_id, core.sound(out.sound), `🔥 ${out.roast}`);
      if (out?.src && out?.file) return sendSound(chat_id, out);
      if (out?.gif?.url && out.gif.source === 'giphy') { await tg('sendAnimation', { chat_id, animation: out.gif.mp4 || out.gif.url }); return sendSound(chat_id, out.sound); }
      if (out?.results?.[0]?.source === 'giphy') return tg('sendAnimation', { chat_id, animation: out.results[0].mp4 || out.results[0].url });
      if (out?.image) return tg('sendPhoto', { chat_id, photo: out.image, caption: out.note });
    } catch (_) { /* fall through to text */ }
    return tg('sendMessage', { chat_id, text: await runText(clean), reply_to_message_id: m.message_id });
  }

  const private_ = m.chat.type === 'private';
  const repliedToMe = m.reply_to_message?.from?.username === me.username;
  if (private_ || repliedToMe || brain.isForDoofus(text, ['doofus', me.username])) {
    const r = await brain.respond(text, { history });
    return post(chat_id, r, m.message_id);
  }

  const o = brain.overhear(text);
  if (REACT && o.mood && TG_EMOJI[o.mood]) tg('setMessageReaction', { chat_id, message_id: m.message_id, reaction: [{ type: 'emoji', emoji: TG_EMOJI[o.mood] }] }).catch(() => {});
  if (o.jumpIn) post(chat_id, await brain.respond(`what do you think about: ${text}`, { history }), m.message_id);
}

(async function poll(offset = 0) {
  const info = await tg('getMe', {});
  if (info.ok) me = info.result;
  console.log(`🤪 DOOFUS (@${me.username}) is loose in Telegram. Ctrl+C to make it stop.`);
  await tg('setMyCommands', { commands: [
    { command: 'roast', description: 'get cooked' },
    { command: 'gif', description: 'find a gif' },
    { command: 'meme', description: 'template | top | bottom' },
    { command: 'fahh', description: 'FAAAHHH' },
    { command: 'sound', description: 'play a sound' },
    { command: 'sounds', description: 'list every sound' },
    { command: 'help', description: 'what can this doofus do' },
  ] });
  for (;;) {
    try {
      const j = await (await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`)).json();
      for (const u of j.result || []) {
        offset = u.update_id + 1;
        if (u.message) onMessage(u.message).catch((e) => console.error('message failed:', e.message));
      }
    } catch (e) {
      console.error('poll hiccup:', e.message);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
})();
