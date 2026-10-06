<p align="center"><img src="docs/logo.svg" alt="DOOFUS" width="620"></p>

<h3 align="center">download a friend. his name is DOOFUS. 🤪</h3>
<p align="center">free forever · no signup · one text file</p>

**DOOFUS is a personality file for your AI.** Paste it into ChatGPT, Claude, Gemini, OpenClaw or Hermes, or drop him into Telegram, Slack or Discord, and your boring assistant turns into your dumbest, funniest friend. He still helps with everything: code, emails, homework, plans. He just roasts you while doing it, drops memes, and yells [FAAAHHH] when you push your `.env` to GitHub.

## Get DOOFUS

**In ChatGPT, Claude or Gemini (copy & paste, 30 seconds)**

1. Copy [`DOOFUS.md`](DOOFUS.md), or [`DOOFUS-lite.md`](DOOFUS-lite.md) (800 characters) for ChatGPT's small box. The [website](https://eddielobanovskiy.github.io/doofus/#how) has a copy button.
2. Paste him in:
   - **ChatGPT:** Settings → Personalization → Custom instructions → paste the **lite** version. (Full DOOFUS: make a GPT or Project and paste `DOOFUS.md`.)
   - **Claude:** Create a Project → Project instructions → paste `DOOFUS.md`.
   - **Gemini:** Gems → New Gem → Instructions → paste `DOOFUS.md`.

**In OpenClaw, Hermes or Claude Code (one command)**

```bash
curl -fsSL https://eddielobanovskiy.github.io/doofus/install.sh | bash
```

It finds your agents and installs DOOFUS as their `SOUL.md` (OpenClaw: `~/.openclaw/workspace/`, Hermes: `~/.hermes/`) plus the skill (Claude Code: `~/.claude/skills/doofus`). Your old soul is backed up as `SOUL.md.before-doofus`.

Want real GIFs, memes and sound clips too? Add `powers` (needs Node 18+). It downloads DOOFUS to `~/doofus`, grabs the 135 sounds, asks for the optional free keys and plugs the MCP server into Claude Code, OpenClaw and Hermes:

```bash
curl -fsSL https://eddielobanovskiy.github.io/doofus/install.sh | bash -s -- powers
```

Remove him: same line with `uninstall`.

**In your group chat (Telegram, Slack, Discord)**

```bash
curl -fsSL https://eddielobanovskiy.github.io/doofus/install.sh | bash -s -- telegram   # or slack, discord
```

It asks for your bot token, saves it in `~/doofus/.env` and starts him. Run him again any time with `node ~/doofus/src/cli.js telegram`.

## Just talk to him

No commands to learn. In any chat:

| You say | DOOFUS does |
|---|---|
| `doofus, what do you think?` | surprise: a roast, a GIF, a meme or a sound, about what you were just talking about |
| `meme that` / `meme tabs vs spaces` | captions a top meme about it ("X vs Y" → Drake, "when..." → Pikachu) |
| `throw a geefee` / `gif this` | finds a GIF that fits the conversation |
| `roast my PR` | roast, with a sound |
| `play a sound` / `fahh` | the sound that fits the mood |
| *(anything, in a group)* | drops an emoji on it: 💀 prod is down, 🔥 shipped, 🧢 cap, 👀 sus, 😴 meetings... and very rarely jumps in |

With an AI key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `LLM_BASE_URL`), one cheap call reads the conversation and picks the GIF search, meme template, captions and sound. Without a key, built-in rules do it.

| Setting | Default | |
|---|---|---|
| `DOOFUS_REACT` | `on` | emoji reactions on group messages |
| `DOOFUS_CHAOS` | `0.03` | chance he jumps in uninvited (0 = never) |

### Telegram

1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token.
2. For groups: @BotFather → `/setprivacy` → **Disable**, so he can hear the room (otherwise he only sees commands and replies).
3. `install.sh telegram`, or `TELEGRAM_BOT_TOKEN=xxx npm run telegram`. Long polling: no server, no public URL.

### Slack

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App → From a manifest** → paste [`docs/slack-manifest.yml`](docs/slack-manifest.yml) (scopes: `app_mentions:read`, `channels:history`, `groups:history`, `chat:write`, `reactions:write`, `commands`; events: `app_mention`, `message.channels`, `message.groups`).
2. Install to your workspace. Copy **Signing Secret** (Basic Information) and **Bot Token** `xoxb-...` (OAuth).
3. `install.sh slack`, or `SLACK_SIGNING_SECRET=xxx SLACK_BOT_TOKEN=xoxb-xxx npm run slack` (port 3000).
4. Give it a public URL (`cloudflared tunnel --url localhost:3000`, a VPS, Fly, Render...). Set **Event Subscriptions** → `https://your-url/slack/events` and the `/doofus` command → `https://your-url/slack`.
5. `/invite @doofus` in a channel. Then `@doofus what do you think`, `meme that`, or `/doofus roast my PR`.

### Discord

1. [discord.com/developers](https://discord.com/developers/applications) → New Application → copy Application ID, Public Key, Bot Token.
2. `install.sh discord` (registers `/doofus`), or `DISCORD_APP_ID=.. DISCORD_PUBLIC_KEY=.. DISCORD_BOT_TOKEN=.. node src/cli.js discord --register` then `npm run discord` (port 3001).
3. Set **Interactions Endpoint URL** to your public URL. Then `/doofus what do you think`.

### MCP (Claude Desktop, Cursor, anything)

`install.sh powers` wires Claude Code, OpenClaw and Hermes. For other apps:

```json
{ "mcpServers": { "doofus": { "command": "node", "args": ["/home/you/doofus/src/cli.js", "mcp"] } } }
```

Tools: `vibe` (pass the conversation, he picks the bit), `roast`, `gif`, `meme`, `meme_templates`, `sound`, `list_sounds`, `react`. Keys go in `~/doofus/.env`.

### Commands (still work everywhere)

```
roast <thing> [--spice 1-3]          get cooked
gif <words>                          Giphy GIF
meme <template> | <text> | <text>    caption a top-40 template (drake, buttons, boyfriend, cheems, pikachu…)
memes                                list the templates
sound <name>  or  /fahh /vine-boom   play a trending sound
sounds                               list all 135
react <what happened>                GIF + sound that fits
<anything else>                      DOOFUS decides
```

### Keys (all free, all optional)

| You want | Key | Without it |
|---|---|---|
| Real GIFs | `GIPHY_API_KEY` from [developers.giphy.com](https://developers.giphy.com/) | a Giphy search link |
| Finished memes | `IMGFLIP_API_KEY` from [imgflip.com/api-settings](https://imgflip.com/api-settings) | the blank template |
| Smarter roasts + picks | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `LLM_BASE_URL` (Ollama, OpenRouter, Groq, Hermes on vLLM…) | built-in roast deck |

## The website

`docs/` is the landing page, live at https://eddielobanovskiy.github.io/doofus/. A GitHub Action (`.github/workflows/pages.yml`) downloads the sounds, GIFs and meme templates and republishes it on every push.

## Where the content comes from

- **Sounds:** `data/sounds.json`, the [soundbuttonsworld.com trending page](https://soundbuttonsworld.com/trends?page=1) pages 1–5 as of Oct 2026 (135 sounds; offensive and NSFW ones skipped).
- **Memes:** `data/templates.json`, the [Imgflip top-all-time templates](https://imgflip.com/memetemplates?sort=top-all-time) with their real template IDs.
- **GIFs:** Giphy.

⚠️ The sound clips are user uploads cut from songs, games and ads. Nobody here owns them. `docs/sounds/*.mp3` is git-ignored by default so you don't publish them by accident. If you commit them anyway and a rights holder complains, pull the file.

## Rules DOOFUS lives by

Real answer first, jokes second. Roasts hit **choices**, never who someone is. No bits when someone's having a genuinely bad time. PG-13. These are in the personality file. Keep them if you remix him.

## License

MIT. Free forever. Remix him, rename him, send him to your group chat.
