// One command parser shared by the CLI and every chat adapter.
// "roast my standup notes", "gif cat typing", "meme drake | tests | vibes", "sound fahh"
'use strict';
const core = require('./core');
const brain = require('./brain');

const HELP = `🤪 DOOFUS COMMANDS
roast <thing> [--spice 1-3]          get cooked
gif <words>                          find a GIF (Giphy)
meme <template> | <top> | <bottom>   caption a top meme (drake, two buttons, boyfriend, pikachu, cheems...)
memes                                list the top 40 all-time templates
sound <name>                         fahh, vine-boom, bruh, tactical-nuke, six-seven, rizz, rick-roll...
sounds                               list every trending sound
react <whatever happened>            GIF + sound that fits the moment
help                                 this, again, because you forgot

or just talk: "what do you think", "meme that", "gif when prod breaks", "play a sound"`;

async function run(input) {
  const raw = String(input || '').trim().replace(/^\/(doofus\s+)?/i, '');
  const [cmdRaw, ...rest] = raw.split(/\s+/);
  const cmd = (cmdRaw || 'help').toLowerCase();
  let arg = rest.join(' ');

  // "meme that", "gif this", "roast it" → let the brain read the room instead.
  if (/^(meme|gif|roast|sound)$/.test(cmd) && (!arg || /^(that|this|it|him|her|them|me)\b/i.test(arg)) && cmd !== 'roast' || (cmd === 'roast' && /^(that|this|it)$/i.test(arg))) return brain.respond(raw);

  switch (cmd) {
    case 'roast': {
      let spice = 2;
      arg = arg.replace(/--spice\s*(\d)/, (_, n) => { spice = Math.min(3, Math.max(1, +n)); return ''; }).trim();
      return core.roast(arg || 'me, for asking', { spice });
    }
    case 'gif': return core.gif(arg || 'chaos');
    case 'meme': {
      const parts = arg.split('|').map((s) => s.trim());
      const [template, ...texts] = parts;
      return core.meme({ template, texts: texts.length ? texts : undefined });
    }
    case 'memes': case 'templates': return core.memeTemplates();
    case 'sound': case 'play': return core.sound(arg || 'fahh');
    case 'sounds': return core.listSounds();
    case 'react': return core.react(arg || 'something happened');
    case 'help': return { help: HELP };
    case '': return { help: HELP };
    default: {
      // "/fahh", "/bruh", "/vine-boom" work as shortcuts
      if (!rest.length) { const s = core.sound(cmd); if (!s.note) return s; }
      // Anything else is just talking to DOOFUS: he picks roast / gif / meme / sound himself.
      return brain.respond(raw);
    }
  }
}

async function runText(input) {
  try {
    const r = await run(input);
    if (r && r.help) return r.help;
    if (r && r.action) return brain.toChatText(r);
    return core.toText(r);
  } catch (e) {
    return `💀 the doofus tripped: ${e.message}`;
  }
}

module.exports = { run, runText, HELP };
