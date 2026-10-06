// Doofspeak: DOOFUS can't spell and refuses to learn. "more" -> "moar", "sir" -> "ser", "money" -> "moneh".
// Clean words only. Leaves URLs, `code` and [sound-tags] alone so nothing breaks.
'use strict';

// [pattern, replacements, chance]. chance 1 = always (the signature ones), lower = sometimes, so it stays readable.
const WORDS = [
  ['more', ['moar'], 1],
  ['too much', ['tew much'], 1],
  ['sir', ['ser'], 1],
  ['money', ['moneh', 'moolah'], 1],
  ['hello', ['henlo'], 1],
  ['friend', ['fren'], 1],
  ['friends', ['frens'], 1],
  ['small', ['smol'], 1],
  ['stupid', ['stoopid'], 1],
  ['sorry', ['sowwy'], 1],
  ['please', ['plz', 'pls'], 0.8],
  ['what', ['wut', 'wat'], 0.6],
  ['you', ['u'], 0.5],
  ['your', ['ur'], 0.5],
  ["you're", ['ur'], 0.6],
  ['the', ['teh'], 0.15],
  ['this', ['dis'], 0.3],
  ['that', ['dat'], 0.25],
  ['with', ['wif'], 0.4],
  ['love', ['luv'], 0.8],
  ['cool', ['kewl'], 0.8],
  ['really', ['rly', 'reeeally'], 0.6],
  ['people', ['ppl', 'peeps'], 0.7],
  ['something', ['somethin'], 0.6],
  ['nothing', ['nuthin'], 0.7],
  ['because', ['cuz', 'bc'], 0.7],
  ['okay', ['oki', 'okie dokie'], 0.7],
  ['ok', ['oki'], 0.5],
  ['food', ['noms'], 0.6],
  ['delicious', ['delish'], 1],
  ['thanks', ['thx', 'tank u'], 0.7],
  ['is', ['iz'], 0.15],
  ['yes', ['yus', 'yuh'], 0.7],
  ['no', ['nu'], 0.3],
  ['awesome', ['awesum'], 0.8],
  ['very', ['v', 'verry'], 0.4],
  ['probably', ['prolly'], 0.9],
  ['going to', ['gonna'], 0.9],
  ['want to', ['wanna'], 0.9],
  ['think', ['fink'], 0.4],
  ['everyone', ['errybody'], 0.8],
  ['everybody', ['errybody'], 0.8],
  ['enough', ['enuf'], 0.8],
  ['fight', ['fite'], 0.8],
  ['coffee', ['cawfee'], 0.9],
  ['cat', ['catto'], 0.6],
  ['dog', ['doggo'], 0.6],
  ['big', ['chonky', 'thicc'], 0.4],
  ['brother', ['brudder'], 0.8],
  ['bro', ['bruh'], 0.4],
  ['dude', ['dood'], 0.7],
  ['boss', ['bauss'], 0.8],
  ['business', ['bizness'], 0.9],
  ['computer', ['compooter'], 0.9],
  ['internet', ['interwebs'], 0.8],
  ['wow', ['wowie'], 0.6],
  ['oh my god', ['omg', 'omagawd'], 1],
  ['amazing', ['amazin'], 0.6],
  ['actually', ['akshually'], 0.8],
  ['seriously', ['srsly'], 0.8],
  ['help', ['halp'], 0.5],
  ['tomorrow', ['tmrw'], 0.7],
  ['tonight', ['2nite'], 0.7],
  ['before', ['b4'], 0.4],
  ['great', ['gr8'], 0.5],
  ['idea', ['big brain idea'], 0.2],
];

const RULES = WORDS.map(([w, alts, chance]) => [new RegExp(`\\b${w.replace(/ /g, '\\s+')}\\b`, 'gi'), alts, chance]);

function matchCase(src, out) {
  if (src === src.toUpperCase() && /[A-Z]/.test(src)) return out.toUpperCase();
  if (src[0] === src[0].toUpperCase() && /[A-Z]/.test(src[0])) return out[0].toUpperCase() + out.slice(1);
  return out;
}

// level: 0 = off, 1 = normal, 2 = unhinged (everything always)
function doofify(text, { level = Number(process.env.DOOFSPEAK ?? 1), rand = Math.random } = {}) {
  if (!text || !level) return text;
  // Split out the stuff we must not touch: urls, `code`, [sound tags], <@slack mentions>, :emoji:
  return String(text).split(/(https?:\/\/\S+|`[^`]*`|\[[^\]]*\]|<[^>]+>|:[a-z0-9_+-]+:)/gi).map((part, i) => {
    if (i % 2) return part;
    for (const [re, alts, chance] of RULES) {
      part = part.replace(re, (m) => (level >= 2 || rand() < chance ? matchCase(m, alts[Math.floor(rand() * alts.length)]) : m));
    }
    return part;
  }).join('');
}

module.exports = { doofify, WORDS };
