"""Builds the landing page from docs/src/page.html.
Writes docs/index.html (full page for GitHub Pages) and build/artifact.html (body-only, for previews).
Run: python3 scripts/build-page.py"""
import json, html, re, os, subprocess
R = os.path.join(os.path.dirname(__file__), '..')
rd = lambda p: open(os.path.join(R, p), encoding='utf-8').read()
src = rd('docs/src/page.html')
logo = re.sub(r'<svg xmlns="http://www.w3.org/2000/svg" viewBox="([^"]+)" width="\d+" height="\d+"', r'<svg viewBox="\1" aria-hidden="true"', rd('docs/logo.svg')).strip()
gifs = json.loads(rd('data/gifs.json'))['gifs']
G = {k: f'gifs/{k}.{ext}' for k, (gid, ext) in gifs.items()}
sounds = [{'id': s['id'], 'label': s['label'], 'src': s['src']} for s in json.loads(rd('data/sounds.json'))['sounds']]
tpl = [{'name': t['name'], 'file': 'memes/' + t['image'].split('/')[-1]} for t in json.loads(rd('data/templates.json'))['templates'][:12]]
doof = subprocess.run(['node', '-e', "process.stdout.write(JSON.stringify(require('./src/doofspeak').WORDS))"], cwd=R, capture_output=True, text=True, check=True).stdout
out = (src.replace('{{LOGO}}', logo)
          .replace('{{DOOF}}', doof)
          .replace('{{SOUL}}', html.escape(rd('DOOFUS.md')))
          .replace('{{LITE}}', html.escape(rd('DOOFUS-lite.md')))
          .replace('{{SOUNDS}}', json.dumps(sounds, separators=(',', ':')))
          .replace('{{GIFS}}', json.dumps(G, separators=(',', ':')))
          .replace('{{TPL}}', json.dumps(tpl, separators=(',', ':'))))
out = re.sub(r'\{\{G:([a-z_]+)\}\}', lambda m: G[m.group(1)], out)
assert '{{' not in out, re.findall(r'\{\{[^}]+\}\}', out)
os.makedirs(os.path.join(R, 'build'), exist_ok=True)
open(os.path.join(R, 'build/artifact.html'), 'w', encoding='utf-8').write(out)
head_end = out.index('</style>') + len('</style>')
full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta property="og:title" content="DOOFUS: a stupid friend for your AI">\n<meta property="og:description" content="One free text file. Your AI starts roasting you, making memes and screaming FAAAHHH.">\n'
        '<link rel="icon" href="logo.svg">\n' + out[:head_end] + '\n</head>\n<body>\n' + out[head_end:] + '\n</body>\n</html>\n')
open(os.path.join(R, 'docs/index.html'), 'w', encoding='utf-8').write(full)
print('built docs/index.html and build/artifact.html')
