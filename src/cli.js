#!/usr/bin/env node
// npx doofus roast "my 47 open browser tabs"
// npx doofus mcp        -> starts the MCP server (Claude Desktop, Cursor, etc.)
// npx doofus telegram   -> starts the Telegram bot
'use strict';
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
