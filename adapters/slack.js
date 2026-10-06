// Slack slash command: /doofus roast my PR description
// 1. api.slack.com/apps -> Create app -> Slash Commands -> /doofus -> Request URL = https://your-host/slack
// 2. Basic Information -> copy Signing Secret
// 3. SLACK_SIGNING_SECRET=xxx PORT=3000 npx doofus slack
'use strict';
const http = require('http');
const crypto = require('crypto');
const { run, runText } = require('../src/commands');

const SECRET = process.env.SLACK_SIGNING_SECRET;
const PORT = +process.env.PORT || 3000;
if (!SECRET) { console.error('Set SLACK_SIGNING_SECRET first.'); process.exit(1); }

function verify(req, body) {
  const ts = req.headers['x-slack-request-timestamp'];
  const sig = req.headers['x-slack-signature'] || '';
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const mine = 'v0=' + crypto.createHmac('sha256', SECRET).update(`v0:${ts}:${body}`).digest('hex');
  return sig.length === mine.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(mine));
}

http.createServer((req, res) => {
  if (req.method !== 'POST') { res.end('🤪 doofus is awake'); return; }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', async () => {
    if (!verify(req, body)) { res.writeHead(401).end('nope'); return; }
    const p = new URLSearchParams(body);
    const text = p.get('text') || 'help';
    const responseUrl = p.get('response_url');
    // Ack within 3s, then post the real answer to response_url.
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ response_type: 'ephemeral', text: '🤪 summoning...' }));

    let payload;
    try {
      const out = await run(text);
      const img = out?.gif?.url || out?.results?.[0]?.url || out?.image;
      const words = out?.help || require('../src/core').toText(out);
      payload = { response_type: 'in_channel', replace_original: true, text: words };
      if (img && /\.(gif|jpe?g|png|webp)(\?|$)/i.test(img)) {
        payload.blocks = [
          { type: 'section', text: { type: 'mrkdwn', text: words } },
          { type: 'image', image_url: img, alt_text: text },
        ];
      }
    } catch (e) {
      payload = { response_type: 'ephemeral', text: await runText(text) };
    }
    fetch(responseUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
  });
}).listen(PORT, () => console.log(`🤪 Slack doofus listening on :${PORT}/slack`));
