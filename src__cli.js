#!/usr/bin/env node
// npx doofus roast "my 47 open browser tabs"
// npx doofus mcp        -> starts the MCP server (Claude Desktop, Cursor, etc.)
// npx doofus telegram   -> starts the Telegram bot
'use strict';
// Load ~/doofus/.env (or ./.env) if it exists. Zero deps, never overrides real env vars.
for (const f of [require('path').join(__dirname, '..', '.env'), '.env']) {
  try {
    for (const line of require('fs').readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*([^#\n]*?)\s*(#.*)?$/);
      if (m && m[2] && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
    break;
  } catch (_) { /* no .env, no problem */ }
}
const args = process.argv.slice(2);
const sub = (args[0] || '').toLowerCase();

if (sub === 'mcp') require('./mcp');
else if (sub === 'telegram') require('../adapters/telegram');
else if (sub === 'slack') require('../adapters/slack');
else if (sub === 'discord') require('../adapters/discord');
else {
  const { runText } = require('./commands');
  runText(args.join(' ') || 'help').then((t) => { console.log(t); });
}
