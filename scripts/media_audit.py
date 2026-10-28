#!/usr/bin/env python3
"""Validate responsive delivery without dependencies or a website build step."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'assets/responsive/manifest.json').read_text())

def exists(url):
    assert (ROOT / unquote(url)).is_file(), f'Missing media: {url}'

def check_srcset(value):
    widths = []
    for candidate in value.split(','):
        url, descriptor = candidate.strip().rsplit(' ', 1)
        exists(url)
        assert re.fullmatch(r'\d+w|[\d.]+x', descriptor), descriptor
        assert descriptor not in widths, f'Duplicate descriptor: {value}'
        widths.append(descriptor)

class MediaParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('srcset'):
            check_srcset(a['srcset'])
            assert a.get('sizes') and a.get('width') and a.get('height'), a
        if a.get('imagesrcset'):
            check_srcset(a['imagesrcset'])
        if a.get('data-gallery'):
            for image in json.loads(a['data-gallery']):
                if isinstance(image, dict):
                    exists(image['src'])
                    check_srcset(image['srcset'])
        if tag == 'img' and unquote(a.get('src', '')) in manifest:
            assert a.get('srcset'), f'Original delivered without srcset: {a}'

for original, image in manifest.items():
    exists(original)
    assert (ROOT / original).stat().st_size == image['bytes'], original
    assert hashlib.sha256((ROOT / original).read_bytes()).hexdigest() == image['sha256'], original
    for variant in image['variants'] + image.get('avifVariants', []):
        exists(variant['url'])
        file = ROOT / unquote(variant['url'])
        assert file.stat().st_size == variant['bytes'], str(file)
        if not variant.get('original'):
            digest = hashlib.sha256(file.read_bytes()).hexdigest()[:12]
            assert digest in file.name, f'Stale content hash: {file}'

pages = [p for p in ROOT.rglob('*.html') if 'node_modules' not in p.parts and '.git' not in p.parts]
for page in pages:
    MediaParser().feed(page.read_text(encoding='utf-8'))
for page in pages + list(ROOT.glob('*.css')):
    for url in re.findall(r'url\([\'\"]?(assets/[^)\'\"]+)[\'\"]?\)', page.read_text(encoding='utf-8')):
        # Only validate new derivatives; legacy unused animation URLs predate Phase 1.
        if url.startswith('assets/responsive/'):
            exists(url)
print(f'PASS: {len(manifest)} original images, derivative hashes and responsive references across {len(pages)} pages.')
