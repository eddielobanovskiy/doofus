#!/usr/bin/env bash
# 🤪 DOOFUS installer. Download a friend for your AI.
#
#   curl -fsSL https://eddielobanovskiy.github.io/doofus/install.sh | bash                  # personality: OpenClaw, Hermes, Claude Code
#   curl -fsSL https://eddielobanovskiy.github.io/doofus/install.sh | bash -s -- powers      # + GIFs, memes, sounds (MCP)
#   curl -fsSL https://eddielobanovskiy.github.io/doofus/install.sh | bash -s -- telegram    # DOOFUS as a Telegram bot
#   curl -fsSL https://eddielobanovskiy.github.io/doofus/install.sh | bash -s -- slack       # DOOFUS as a Slack bot
#   curl -fsSL https://eddielobanovskiy.github.io/doofus/install.sh | bash -s -- discord     # DOOFUS as a Discord bot
#   curl -fsSL https://eddielobanovskiy.github.io/doofus/install.sh | bash -s -- uninstall   # he'll be sad. he'll get over it.
#
# Safe: anything it replaces is backed up as *.before-doofus first. Read it, it's short.
set -euo pipefail

SITE="${DOOFUS_SITE:-https://eddielobanovskiy.github.io/doofus}"
REPO="eddielobanovskiy/doofus"
HOME_DIR="${DOOFUS_HOME:-$HOME/doofus}"
MODE="${1:-soul}"

y=$'\e[1;33m'; p=$'\e[1;35m'; g=$'\e[1;32m'; r=$'\e[1;31m'; n=$'\e[0m'
say()  { printf '%s\n' "$*"; }
yay()  { printf '%s✔%s %s\n' "$g" "$n" "$*"; }
meh()  { printf '%s!%s %s\n' "$y" "$n" "$*"; }
oof()  { printf '%s✘ FAAAHHH:%s %s\n' "$r" "$n" "$*" >&2; exit 1; }
ask()  { local v=""; { read -r -p "$1" v </dev/tty; } 2>/dev/null || true; printf "%s" "$v"; }
fetch(){ curl -fsSL "$SITE/$1" -o "$2" || oof "couldn't download $1 (internet ok?)"; }

backup() { [ -f "$1" ] && ! grep -q "DOOFUS" "$1" 2>/dev/null && cp "$1" "$1.before-doofus" && meh "backed up your old $(basename "$1") → $1.before-doofus" || true; }

say "${p}"
say '  ____   ___   ___  _____ _   _ ____  '
say ' |  _ \ / _ \ / _ \|  ___| | | / ___| '
say ' | | | | | | | | | | |_  | | | \___ \ '
say ' | |_| | |_| | |_| |  _| | |_| |___) |'
say ' |____/ \___/ \___/|_|    \___/|____/ '
say "${n}        a stupid friend for your AI 🤪"
say ""

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
fetch DOOFUS.md "$TMP/DOOFUS.md"
fetch IDENTITY.md "$TMP/IDENTITY.md"
fetch skill/SKILL.md "$TMP/SKILL.md"

# ── 1. The personality ──────────────────────────────────────────────
install_soul() {
  local found=0
  if [ -d "$HOME/.openclaw" ]; then
    mkdir -p "$HOME/.openclaw/workspace" "$HOME/.openclaw/skills/doofus"
    backup "$HOME/.openclaw/workspace/SOUL.md"; backup "$HOME/.openclaw/workspace/IDENTITY.md"
    cp "$TMP/DOOFUS.md" "$HOME/.openclaw/workspace/SOUL.md"
    cp "$TMP/IDENTITY.md" "$HOME/.openclaw/workspace/IDENTITY.md"
    cp "$TMP/SKILL.md" "$HOME/.openclaw/skills/doofus/SKILL.md"
    yay "OpenClaw: DOOFUS is now your SOUL.md (+ skill)"; found=1
  fi
  if [ -d "$HOME/.hermes" ]; then
    backup "$HOME/.hermes/SOUL.md"
    cp "$TMP/DOOFUS.md" "$HOME/.hermes/SOUL.md"
    mkdir -p "$HOME/.hermes/skills/doofus" && cp "$TMP/SKILL.md" "$HOME/.hermes/skills/doofus/SKILL.md"
    yay "Hermes: DOOFUS is now your SOUL.md (+ skill)"; found=1
  fi
  if [ -d "$HOME/.claude" ] || command -v claude >/dev/null 2>&1; then
    mkdir -p "$HOME/.claude/skills/doofus"
    cp "$TMP/SKILL.md" "$HOME/.claude/skills/doofus/SKILL.md"
    yay "Claude Code: installed the doofus skill (say \"doofus mode\")"; found=1
  fi
  if [ "$found" = 0 ]; then
    cp "$TMP/DOOFUS.md" ./DOOFUS.md
    meh "No OpenClaw, Hermes or Claude Code found here."
    say "   Saved ${y}./DOOFUS.md${n}. Paste it into ChatGPT / Claude / Gemini custom instructions,"
    say "   or copy it from $SITE/#how"
  fi
}

# ── 2. Powers: download the code + sounds once ───────────────────────
need_node() {
  command -v node >/dev/null 2>&1 || oof "powers need Node 18+ → https://nodejs.org (then run this again)"
  [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] || oof "Node is too old. Need 18+, you have $(node -v)."
}
get_code() {
  need_node
  if [ -d "$HOME_DIR/.git" ] && command -v git >/dev/null; then
    git -C "$HOME_DIR" pull -q || true
  elif [ ! -f "$HOME_DIR/src/cli.js" ] && command -v git >/dev/null && git clone -q --depth 1 "https://github.com/$REPO.git" "$HOME_DIR" 2>/dev/null; then
    :
  elif [ ! -f "$HOME_DIR/src/cli.js" ]; then
    mkdir -p "$HOME_DIR"
    curl -fsSL "https://codeload.github.com/$REPO/tar.gz/refs/heads/main" | tar -xz -C "$HOME_DIR" --strip-components=1 \
      || oof "couldn't download the code from github.com/$REPO"
  fi
  yay "code in $HOME_DIR"
  say "   downloading 135 meme sounds (one time, ~10 MB)..."
  (cd "$HOME_DIR" && node scripts/fetch-assets.js >/dev/null 2>&1) && yay "sounds downloaded" || meh "some sounds failed, he'll use links instead"
  touch "$HOME_DIR/.env"
}
setenv() { # setenv KEY "prompt" [default]
  local k="$1" cur v; cur="$(grep -E "^$k=" "$HOME_DIR/.env" 2>/dev/null | cut -d= -f2- || true)"
  [ -n "$cur" ] && return 0
  v="$(ask "$2")"; v="${v:-${3:-}}"
  [ -n "$v" ] && printf '%s=%s\n' "$k" "$v" >> "$HOME_DIR/.env"
  return 0
}
optional_keys() {
  say ""
  say "${y}Optional free keys${n} (press Enter to skip, he still works without them):"
  setenv GIPHY_API_KEY   "  Giphy key (real GIFs, developers.giphy.com): "
  setenv IMGFLIP_API_KEY "  Imgflip key (captioned memes, imgflip.com/api-settings): "
  setenv ANTHROPIC_API_KEY "  Anthropic or skip (smarter roasts; OPENAI_API_KEY also works, edit $HOME_DIR/.env): "
}

install_mcp() {
  get_code; optional_keys
  local CMD="node $HOME_DIR/src/cli.js mcp" any=0
  if command -v claude >/dev/null 2>&1; then
    claude mcp add doofus -s user -- node "$HOME_DIR/src/cli.js" mcp >/dev/null 2>&1 && yay "Claude Code: powers added" && any=1 || true
  fi
  if command -v openclaw >/dev/null 2>&1; then
    openclaw mcp set doofus "{\"command\":\"node\",\"args\":[\"$HOME_DIR/src/cli.js\",\"mcp\"]}" >/dev/null 2>&1 && yay "OpenClaw: powers added" && any=1 || true
  fi
  if [ -d "$HOME/.hermes" ]; then
    local cfg="$HOME/.hermes/config.yaml"; touch "$cfg"
    if ! grep -q "doofus:" "$cfg"; then
      cp "$cfg" "$cfg.before-doofus"
      if grep -q "^mcp_servers:" "$cfg"; then
        sed -i.tmp "/^mcp_servers:/a\\
  doofus:\\
    command: node\\
    args: [\"$HOME_DIR/src/cli.js\", \"mcp\"]" "$cfg" && rm -f "$cfg.tmp"
      else
        printf '\nmcp_servers:\n  doofus:\n    command: node\n    args: ["%s/src/cli.js", "mcp"]\n' "$HOME_DIR" >> "$cfg"
      fi
    fi
    yay "Hermes: powers added to config.yaml"; any=1
  fi
  say ""
  say "Any other app that speaks MCP (Claude Desktop, Cursor...): add a server with command"
  say "   ${y}$CMD${n}"
  [ "$any" = 1 ] && say "Restart your agent, then say: ${p}\"doofus, what do you think?\"${n}"
}

run_bot() {
  local bot="$1"; get_code
  case "$bot" in
    telegram)
      say ""; say "1. Open Telegram → message ${y}@BotFather${n} → /newbot → copy the token"
      say "2. For group chats: @BotFather → /setprivacy → Disable (so he can hear the room)"
      setenv TELEGRAM_BOT_TOKEN "Paste your bot token: " ;;
    slack)
      say ""; say "1. ${y}api.slack.com/apps${n} → Create New App → From a manifest → paste $SITE/slack-manifest.yml"
      say "2. Install to workspace, then copy: Basic Information → Signing Secret, OAuth → Bot Token (xoxb-)"
      setenv SLACK_SIGNING_SECRET "Signing secret: "
      setenv SLACK_BOT_TOKEN "Bot token (xoxb-...): "
      say "3. He needs a public URL. Quick: ${y}npx localtunnel --port 3000${n} or ${y}cloudflared tunnel --url localhost:3000${n}"
      say "   then put https://<that-url>/slack/events and /slack into the app (see README → Slack)" ;;
    discord)
      say ""; say "1. ${y}discord.com/developers${n} → New Application → copy App ID, Public Key, Bot token"
      setenv DISCORD_APP_ID "Application ID: "
      setenv DISCORD_PUBLIC_KEY "Public key: "
      setenv DISCORD_BOT_TOKEN "Bot token: "
      (cd "$HOME_DIR" && node src/cli.js discord --register) || true
      say "2. Needs a public URL → set it as Interactions Endpoint URL (see README → Discord)" ;;
  esac
  optional_keys
  say ""
  yay "ready. start him any time with: ${p}node $HOME_DIR/src/cli.js $bot${n}"
  local go; go="$(ask "Start DOOFUS now? [Y/n] ")"
  case "$go" in n|N|no) ;; *) cd "$HOME_DIR" && exec node src/cli.js "$bot" ;; esac
}

uninstall() {
  for f in "$HOME/.openclaw/workspace/SOUL.md" "$HOME/.openclaw/workspace/IDENTITY.md" "$HOME/.hermes/SOUL.md"; do
    [ -f "$f.before-doofus" ] && mv "$f.before-doofus" "$f" && yay "restored $f"
  done
  rm -rf "$HOME/.openclaw/skills/doofus" "$HOME/.hermes/skills/doofus" "$HOME/.claude/skills/doofus"
  command -v claude >/dev/null 2>&1 && claude mcp remove doofus -s user >/dev/null 2>&1 || true
  grep -q "doofus:" "$HOME/.hermes/config.yaml" 2>/dev/null && meh "Hermes: delete the 'doofus:' entry under mcp_servers in ~/.hermes/config.yaml" || true
  yay "DOOFUS removed. $HOME_DIR is still there if you want it (rm -rf it if not). bye 😔"
  exit 0
}

case "$MODE" in
  soul|"")              install_soul ;;
  powers|mcp)           install_soul; install_mcp ;;
  telegram|slack|discord) run_bot "$MODE" ;;
  uninstall|remove)     uninstall ;;
  *) oof "unknown option '$MODE'. try: powers, telegram, slack, discord, uninstall" ;;
esac

say ""
say "${p}🤪 DOOFUS installed. Say \"hey doofus, what do you think?\"${n}"
