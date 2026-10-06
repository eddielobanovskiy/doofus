// Minimal MCP server over stdio (JSON-RPC 2.0, newline-delimited). Zero deps.
// Works with Claude Desktop, Claude Code, Cursor, OpenClaw, Hermes Agent, and anything else that speaks MCP.
'use strict';
const core = require('./core');
const brain = require('./brain');

const TOOLS = [
  {
    name: 'vibe',
    description: 'Just talk to DOOFUS. Give him the conversation ("what do you think", "meme that", "gif this") and he picks the bit himself: a roast, a GIF, a captioned meme or a meme sound. Use when the user asks for something funny without saying exactly what.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'what was said' }, context: { type: 'array', items: { type: 'string' }, description: 'previous few messages, oldest first' } }, required: ['text'] },
  },
  {
    name: 'roast',
    description: 'Roast the user (or something they mention) in 1-2 sarcastic sentences. Punch at choices, never identity. Returns the roast plus a matching meme sound.',
    inputSchema: { type: 'object', properties: { target: { type: 'string', description: 'What to roast: their code, playlist, take, outfit, life choice' }, spice: { type: 'integer', minimum: 1, maximum: 3, default: 2 } }, required: ['target'] },
  },
  {
    name: 'gif',
    description: 'Search Giphy for a reaction GIF. Returns GIF URLs to embed in the reply.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', default: 1, maximum: 5 } }, required: ['query'] },
  },
  {
    name: 'meme',
    description: 'Caption one of the top 40 all-time Imgflip meme templates (Drake, Two Buttons, Distracted Boyfriend, Surprised Pikachu, Buff Doge vs. Cheems...). Returns an image URL. Use texts[] for templates with 3+ boxes.',
    inputSchema: { type: 'object', properties: { template: { type: 'string' }, top: { type: 'string' }, bottom: { type: 'string' }, texts: { type: 'array', items: { type: 'string' }, description: 'For templates with 3+ boxes' } }, required: ['template'] },
  },
  {
    name: 'meme_templates',
    description: 'List the top 40 all-time meme templates with how many text boxes each has.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'sound',
    description: 'Get a trending meme sound as an MP3 link. Call list_sounds to see all ids. Favorites: fahh, vine-boom, bruh, tactical-nuke, six-seven, rizz, emotional, sad-violin, stop-the-cap, fbi-open-up, rick-roll.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
  },
  {
    name: 'list_sounds',
    description: 'List every trending meme sound with its id and when to use it.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'react',
    description: 'Given something that just happened, pick a fitting GIF and meme sound.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  },
];

async function callTool(name, a = {}) {
  switch (name) {
    case 'vibe': return brain.respond(a.text || 'what do you think?', { history: a.context || [] });
    case 'roast': return core.roast(a.target, { spice: a.spice || 2 });
    case 'gif': return core.gif(a.query, { limit: a.limit || 1 });
    case 'meme': return core.meme(a);
    case 'meme_templates': return core.memeTemplates().map(({ id, name: n, boxes }) => ({ id, name: n, boxes }));
    case 'list_sounds': return core.listSounds().map(({ id, label, vibe }) => ({ id, label, vibe }));
    case 'sound': return core.sound(a.name);
    case 'react': return core.react(a.text);
    default: throw new Error(`unknown tool ${name}`);
  }
}

function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') {
    return send({ jsonrpc: '2.0', id, result: {
      protocolVersion: params?.protocolVersion || '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'doofus', version: require('../package.json').version },
      instructions: 'You have meme powers. Use them when the vibe calls for it, not every message. Roasts target choices, never identity.',
    } });
  }
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
  if (method === 'tools/call') {
    try {
      const out = await callTool(params.name, params.arguments || {});
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: core.toText(out) + '\n\n' + JSON.stringify(out) }] } });
    } catch (e) {
      return send({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: e.message }] } });
    }
  }
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  if (id !== undefined && !method?.startsWith('notifications/')) {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `method not found: ${method}` } });
  }
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    try { handle(JSON.parse(line)); } catch (e) { process.stderr.write(`bad json: ${e.message}\n`); }
  }
});

module.exports = { TOOLS, callTool };
