# Build-time purge for deployment: keeps only the Serenity tokens, text/effect classes and motion patterns the
# prototype uses (with every token they reference). Reads the plugin's tokens.css and motion.css, never edits them;
# writes dist-css/tokens.css and dist-css/motion.css, which the deployed copy imports instead.
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
own = ''.join(p.read_text() for p in list((src / 'serenity').glob('*.jsx')) + [src / 'App.jsx', src / 'styles' / 'components.css', src / 'styles' / 'base.css'])
used_classes = set(re.findall(r'\b((?:text|effect|motion)-[a-z0-9-]+)', own))

def blocks(css):
    """Yield (prelude, body, depth) for top-level rules; @media keeps its inner rules as nested list."""
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0: break
        pre = css[i:j].strip()
        depth, k = 1, j + 1
        while depth and k < n:
            if css[k] == '{': depth += 1
            elif css[k] == '}': depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        out.append((re.sub(r'/\*.*?\*/', '', pre, flags=re.S).strip(), body))
        i = k
    return out

def decls(body):
    body = re.sub(r'/\*.*?\*/', '', body, flags=re.S)
    return [d.strip() for d in body.split(';') if d.strip()]

tok = (src / 'styles' / 'tokens.css').read_text()
mot = (src / 'styles' / 'motion.css').read_text()

# motion: rules whose selector names a used motion class, plus the keyframes they reference
mot_out, keyframes_needed = [], set()
def keep_sel(pre):
    return any(re.search(r'\.' + re.escape(c) + r'(?![a-z0-9-])', pre) for c in used_classes if c.startswith('motion-')) or pre.startswith(':root') and 'view-transition' not in pre and False
mot_blocks = blocks(mot)
for pre, body in mot_blocks:
    if pre.startswith('@keyframes'): continue
    if pre.startswith('@media'):
        inner = [(p, b) for p, b in blocks(body) if keep_sel(p)]
        if inner:
            mot_out.append(pre + '{' + ''.join(p + '{' + b.strip() + '}' for p, b in inner) + '}')
            for p, b in inner: keyframes_needed |= set(re.findall(r'animation(?:-name)?\s*:\s*([a-z0-9-]+)', b))
        continue
    if keep_sel(pre):
        mot_out.append(pre + '{' + body.strip() + '}')
        keyframes_needed |= set(re.findall(r'animation(?:-name)?\s*:\s*([a-z0-9-]+)', body))
for pre, body in mot_blocks:
    if pre.startswith('@keyframes') and pre.split()[1] in keyframes_needed:
        mot_out.append(pre + '{' + body.strip() + '}')
mot_css = '\n'.join(mot_out)

# tokens: closure of var() references from our CSS, kept classes and kept motion rules
tok_blocks = blocks(tok)
class_rules = []
for pre, body in tok_blocks:
    if pre.startswith('.') and not pre.startswith(('.theme-dark', '.theme-light')):
        names = re.findall(r'\.([a-z0-9-]+)', pre)
        if any(nm in used_classes for nm in names): class_rules.append((pre, body))
seed_text = own + mot_css + ''.join(b for _, b in class_rules)
need = set(re.findall(r'var\((--[a-z0-9-]+)', seed_text))
defs = {}
def collect(body):
    for d in decls(body):
        if d.startswith('--'):
            k, _, v = d.partition(':'); defs.setdefault(k.strip(), []).append(v)
for pre, body in tok_blocks:
    if pre.startswith('@media'):
        for p, b in blocks(body): collect(b)
    else: collect(body)
changed = True
while changed:
    changed = False
    for v in list(need):
        for val in defs.get(v, []):
            for r in re.findall(r'var\((--[a-z0-9-]+)', val):
                if r not in need: need.add(r); changed = True
def filt(body):
    keep = [d for d in decls(body) if not d.startswith('--') or d.split(':')[0].strip() in need]
    return ';'.join(keep)
tok_out = []
for pre, body in tok_blocks:
    if pre.startswith('.') and not pre.startswith(('.theme-dark', '.theme-light')):
        if (pre, body) in class_rules: tok_out.append(pre + '{' + ';'.join(decls(body)) + '}')
        continue
    if pre.startswith('@media'):
        inner = [(p, filt(b)) for p, b in blocks(body)]
        inner = [(p, b) for p, b in inner if b]
        if inner: tok_out.append(pre + '{' + ''.join(p + '{' + b + '}' for p, b in inner) + '}')
        continue
    b = filt(body)
    if b: tok_out.append(pre + '{' + b + '}')
out = root / 'dist-css'; out.mkdir(exist_ok=True)
(out / 'tokens.css').write_text('/* Purged at build time from the Serenity plugin tokens.css (Nov 9, 2026): only the tokens this prototype uses. */\n' + '\n'.join(tok_out) + '\n')
(out / 'motion.css').write_text('/* Purged at build time from the Serenity plugin motion.css (Nov 9, 2026): only the patterns this prototype uses. */\n' + mot_css + '\n')
missing = sorted(v for v in set(re.findall(r'var\((--[a-z0-9-]+)', own)) if v not in defs and not v.startswith(('--i', '--disclosure', '--trigger', '--motion-shimmer', '--motion-sheet', '--motion-from')))
print('classes', len(used_classes), 'vars', len(need), 'tokens.css', len('\n'.join(tok_out)), 'motion.css', len(mot_css))
print('MISSING TOKENS:', missing)
