// Discord slash command via the Interactions endpoint (HTTP, no gateway, no deps).
// 1. discord.com/developers -> New Application -> copy Application ID, Public Key, Bot Token
// 2. DISCORD_APP_ID=.. DISCORD_PUBLIC_KEY=.. DISCORD_BOT_TOKEN=.. npx doofus discord --register   (once)
// 3. DISCORD_PUBLIC_KEY=.. PORT=3001 npx doofus discord
// 4. Set "Interactions Endpoint URL" in the dev portal to https://your-host/
'use strict';
const http = require('http');
const crypto = require('crypto');
const { runText } = require('../src/commands');

const { DISCORD_APP_ID, DISCORD_PUBLIC_KEY, DISCORD_BOT_TOKEN } = process.env;
const PORT = +process.env.PORT || 3001;

async function register() {
  const opt = (name, description) => ({ type: 3, name, description, required: false });
  const r = await fetch(`https://discord.com/api/v10/applications/${DISCORD_APP_ID}/commands`, {
    method: 'PUT',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify([{ name: 'doofus', description: 'summon the meme doofus', options: [opt('do', 'just talk: "what do you think", "meme that", roast <thing>, gif <words>, fahh')] }]),
  });
  console.log(r.ok ? '✅ /doofus registered' : `❌ ${r.status} ${await r.text()}`);
}

if (process.argv.includes('--register')) { register(); return; }
if (!DISCORD_PUBLIC_KEY) { console.error('Set DISCORD_PUBLIC_KEY first.'); process.exit(1); }

// Wrap the raw 32-byte Ed25519 key Discord gives you so node:crypto can use it.
const pubKey = crypto.createPublicKey({
  key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(DISCORD_PUBLIC_KEY, 'hex')]),
  format: 'der', type: 'spki',
});

http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', async () => {
    const sig = req.headers['x-signature-ed25519'];
    const ts = req.headers['x-signature-timestamp'];
    const ok = sig && ts && crypto.verify(null, Buffer.from(ts + body), pubKey, Buffer.from(sig, 'hex'));
    if (!ok) { res.writeHead(401).end('bad signature'); return; }
    const i = JSON.parse(body);
    const json = (o) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(o));
    if (i.type === 1) return json({ type: 1 }); // PING
    const input = i.data?.options?.[0]?.value || 'what do you think?';
    // Defer, then edit the original response once the doofus is done.
    json({ type: 5 });
    const content = (await runText(input)).slice(0, 1990); // free text goes through the brain
    fetch(`https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }),
    }).catch(() => {});
  });
}).listen(PORT, () => console.log(`🤪 Discord doofus listening on :${PORT}`));
