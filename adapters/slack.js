// DOOFUS for Slack. Two ways in, both on one tiny server:
//   1. Slash command  /doofus roast my PR          -> POST /slack
//   2. Just talk      "@doofus meme that"          -> POST /slack/events  (Events API)
//      He also reacts to channel messages with emoji (💀 on fails, 🔥 on wins, 🧢 on cap...)
//      and very rarely jumps in on his own (DOOFUS_CHAOS, default 3%).
//
// Setup (5 minutes): see README → Slack. Needs SLACK_SIGNING_SECRET and SLACK_BOT_TOKEN.
'use strict';
const http = require('http');
const crypto = require('crypto');
const { run } = require('../src/commands');
const brain = require('../src/brain');
const core = require('../src/core');

const SECRET = process.env.SLACK_SIGNING_SECRET;
const TOKEN = process.env.SLACK_BOT_TOKEN;
const PORT = +process.env.PORT || 3000;
const REACT = (process.env.DOOFUS_REACT || 'on') !== 'off';
if (!SECRET) { console.error('Set SLACK_SIGNING_SECRET first (Slack app → Basic Information).'); process.exit(1); }
if (!TOKEN) console.warn('No SLACK_BOT_TOKEN: slash command works, but DOOFUS can\'t talk in channels or react.');

let botUserId = null;
const seen = new Set();

function verify(req, body) {
  const ts = req.headers['x-slack-request-timestamp'];
  const sig = req.headers['x-slack-signature'] || '';
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const mine = 'v0=' + crypto.createHmac('sha256', SECRET).update(`v0:${ts}:${body}`).digest('hex');
  return sig.length === mine.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(mine));
}

async function slack(method, body) {
  if (!TOKEN) return {};
  const r = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body),
  });
  return r.json();
}

// Build a Slack message from a brain result: text + GIF/meme image + sound link.
function toBlocks(r) {
  const text = brain.toChatText(r);
  const img = r.gif?.url || r.image;
  const blocks = [{ type: 'section', text: { type: 'mrkdwn', text: text || '🤪' } }];
  if (img && /\.(gif|jpe?g|png|webp)(\?|$)/i.test(img)) blocks.push({ type: 'image', image_url: img, alt_text: r.query || r.template || 'doofus' });
  return { text: text || '🤪', blocks };
}

async function answer(event, text) {
  const history = brain.recall(event.channel);
  const r = await brain.respond(text, { chatId: event.channel, history: history.slice(0, -1) });
  await slack('chat.postMessage', { channel: event.channel, thread_ts: event.thread_ts, ...toBlocks(r), unfurl_links: false });
}

async function onEvent(e) {
  if (!e || e.bot_id || e.subtype) return;
  if (e.client_msg_id && seen.has(e.client_msg_id)) return;
  if (e.client_msg_id) { seen.add(e.client_msg_id); if (seen.size > 500) seen.clear(); }
  const text = String(e.text || '');
  brain.remember(e.channel, text.replace(/<@[^>]+>/g, '').trim());

  const mentioned = e.type === 'app_mention' || (botUserId && text.includes(`<@${botUserId}>`));
  if (mentioned || brain.isForDoofus(text)) return answer(e, text);

  // Overheard message: maybe an emoji, very rarely a full bit.
  const o = brain.overhear(text);
  if (REACT && o.emoji) slack('reactions.add', { channel: e.channel, timestamp: e.ts, name: o.emoji }).catch(() => {});
  if (o.jumpIn) answer(e, `what do you think about: ${text}`);
}

http.createServer((req, res) => {
  if (req.method !== 'POST') { res.end('🤪 doofus is awake'); return; }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', async () => {
    if (!verify(req, body)) { res.writeHead(401).end('nope'); return; }

    if (req.url.startsWith('/slack/events')) {
      const p = JSON.parse(body);
      if (p.type === 'url_verification') { res.writeHead(200, { 'content-type': 'text/plain' }).end(p.challenge); return; }
      res.writeHead(200).end('ok'); // ack fast, work after
      if (p.authorizations?.[0]?.user_id) botUserId = p.authorizations[0].user_id;
      onEvent(p.event).catch((err) => console.error('event failed:', err.message));
      return;
    }

    // Slash command: /doofus <anything>
    const p = new URLSearchParams(body);
    const text = (p.get('text') || '').trim() || 'what do you think?';
    const responseUrl = p.get('response_url');
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ response_type: 'ephemeral', text: '🤪 summoning...' }));
    let payload;
    try {
      const first = text.split(/\s+/)[0].toLowerCase();
      const isCommand = ['roast', 'gif', 'meme', 'memes', 'sound', 'sounds', 'react', 'help'].includes(first) && !/\b(that|this)\b/i.test(text);
      if (isCommand) {
        const out = await run(text);
        const words = out?.help || core.toText(out);
        payload = { response_type: 'in_channel', text: words };
        const img = out?.gif?.url || out?.results?.[0]?.url || out?.image;
        if (img && /\.(gif|jpe?g|png|webp)(\?|$)/i.test(img)) payload.blocks = [{ type: 'section', text: { type: 'mrkdwn', text: words } }, { type: 'image', image_url: img, alt_text: text }];
      } else {
        const r = await brain.respond(text, { chatId: p.get('channel_id') || 'slash' });
        payload = { response_type: 'in_channel', ...toBlocks(r) };
      }
    } catch (err) {
      payload = { response_type: 'ephemeral', text: `💀 the doofus tripped: ${err.message}` };
    }
    fetch(responseUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ replace_original: true, ...payload }) }).catch(() => {});
  });
}).listen(PORT, () => console.log(`🤪 DOOFUS is in Slack. Slash: :${PORT}/slack  Events: :${PORT}/slack/events`));
