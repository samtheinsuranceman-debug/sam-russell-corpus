#!/usr/bin/env python3
"""Secret scan over git-tracked files. Patterns are anchored to real key
formats, not the word 'secret', so the output is actionable."""
import re, subprocess, sys, pathlib, json, collections
root = pathlib.Path(sys.argv[1]).resolve(); sub = sys.argv[2] if len(sys.argv)>2 else '.'
PATTERNS = [
 ('aws_access_key_id',      re.compile(r'\b(?:AKIA|ASIA)[0-9A-Z]{16}\b')),
 ('github_token',           re.compile(r'\bgh[pousr]_[A-Za-z0-9]{36,}\b')),
 ('openai_key',             re.compile(r'\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b')),
 ('anthropic_key',          re.compile(r'\bsk-ant-[A-Za-z0-9_-]{24,}\b')),
 ('stripe_live_key',        re.compile(r'\b[rs]k_live_[A-Za-z0-9]{20,}\b')),
 ('google_api_key',         re.compile(r'\bAIza[0-9A-Za-z_-]{35}\b')),
 ('slack_token',            re.compile(r'\bxox[baprs]-[A-Za-z0-9-]{10,}\b')),
 ('private_key_block',      re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----')),
 ('jwt',                    re.compile(r'\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b')),
 ('db_url_with_password',   re.compile(r'\b(?:mysql|postgres(?:ql)?|mongodb(?:\+srv)?)://[^\s:@/"\']+:[^\s:@/"\']+@')),
 ('sendgrid_key',           re.compile(r'\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b')),
 ('twilio_sid',             re.compile(r'\bAC[0-9a-fA-F]{32}\b')),
]
PLACEHOLDER = re.compile(r'(your[-_]?|example|placeholder|xxx|<[a-z]|dummy|sample|test[-_]?key|changeme|redacted|\.\.\.)', re.I)
files = subprocess.run(['git','-C',str(root),'ls-files',sub],capture_output=True,text=True).stdout.split('\n')
BIN = {'.png','.jpg','.jpeg','.webp','.pdf','.zip','.docx','.mp4','.ico','.woff','.woff2','.ttf','.gz','.bin'}
hits=[]; scanned=0
for rel in files:
    if not rel: continue
    p = root/rel
    if p.suffix.lower() in BIN or not p.is_file(): continue
    try:
        if p.stat().st_size > 4_000_000: continue
        txt = p.read_text(errors='ignore')
    except Exception: continue
    scanned += 1
    for name, pat in PATTERNS:
        for m in pat.finditer(txt):
            frag = m.group(0)
            line = txt[:m.start()].count('\n')+1
            ctx  = txt.splitlines()[line-1][:200] if line-1 < len(txt.splitlines()) else ''
            hits.append({'file':rel,'line':line,'rule':name,
                         'placeholder': bool(PLACEHOLDER.search(ctx)),
                         'preview': frag[:12]+'…'+f'({len(frag)} chars)'})
print(json.dumps({'scanned':scanned,'hits':hits}))
