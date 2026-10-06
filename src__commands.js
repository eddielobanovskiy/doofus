// One command parser shared by the CLI and every chat adapter.
// "roast my standup notes", "gif cat typing", "meme drake | tests | vibes", "sound fahh"
'use strict';
const core = require('./core');

const HELP = `🤪 DOOFUS COMMANDS
roast <thing> [--spice 1-3]          get cooked
gif <words>                          find a GIF (Giphy)
meme <template> | <top> | <bottom>   caption a top meme (drake, two buttons, boyfriend, pikachu, cheems...)
memes                                list the top 40 all-time templates
sound <name>                         fahh, vine-boom, bruh, tactical-nuke, six-seven, rizz, rick-roll...
sounds                               list every trending sound
react <whatever happened>            GIF + sound that fits the moment
help                                 this, again, because you forgot`;

async function run(input) {
  const raw = String(input || '').trim().replace(/^\/(doofus\s+)?/i, '');
  const [cmdRaw, ...rest] = raw.split(/\s+/);
  const cmd = (cmdRaw || 'help').toLowerCase();
  let arg = rest.join(' ');

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
    default: {
      // "/fahh", "/bruh", "/vine-boom" work as shortcuts
      const s = core.sound(cmd);
      if (!s.note) return s;
      return { help: HELP };
    }
  }
}

async function runText(input) {
  try {
    const r = await run(input);
    return r && r.help ? r.help : core.toText(r);
  } catch (e) {
    return `💀 the doofus tripped: ${e.message}`;
  }
}

module.exports = { run, runText, HELP };
