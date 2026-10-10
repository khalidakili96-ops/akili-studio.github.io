#!/usr/bin/env python3
"""Static SEO guardrails for Akili Studio's GitHub Pages site.

Checks canonical tags, sitemap consistency, noindex sitemap entries, and
internal href/src destinations. Uses only Python's standard library.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://akilis.studio"
SKIP_FILES = {"404.html"}
IGNORE_SCHEMES = ("http:", "https:", "mailto:", "tel:", "javascript:", "data:")

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.canonicals = []
        self.robots = []
        self.links = []
        self.title_count = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self.title_count += 1
        if tag == "link" and "canonical" in (a.get("rel") or "").lower().split():
            if a.get("href"): self.canonicals.append(a["href"].strip())
        if tag == "meta" and (a.get("name") or "").lower() == "robots":
            self.robots.append((a.get("content") or "").lower())
        for key in ("href", "src", "poster"):
            value = a.get(key)
            if value: self.links.append(value.strip())

def fail(message):
    ERRORS.append(message)

def resolve_local(url, source):
    parsed = urlparse(url)
    if parsed.scheme or parsed.netloc:
        if parsed.netloc and parsed.netloc.lower() not in {"akilis.studio", "www.akilis.studio"}:
            return None
        path = unquote(parsed.path)
    else:
        path = unquote(parsed.path)
    if not path or path == "/":
        return ROOT / "index.html"
    path = path.lstrip("/")
    candidate = (ROOT / path).resolve()
    try: candidate.relative_to(ROOT.resolve())
    except ValueError: return None
    options = [candidate]
    if path.endswith("/"): options.append(candidate / "index.html")
    else:
        if not candidate.suffix: options.extend([candidate / "index.html", candidate.with_suffix(".html")])
    for option in options:
        if option.is_file(): return option
    return candidate

ERRORS = []
html_files = sorted(p for p in ROOT.rglob("*.html") if not any(part.startswith(".") for part in p.relative_to(ROOT).parts))
parsers = {}
canonical_to_page = {}
for file in html_files:
    parser = AuditParser()
    try: parser.feed(file.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"{file.relative_to(ROOT)}: HTML parse error: {exc}")
        continue
    parsers[file] = parser
    robots = " ".join(parser.robots)
    noindex = "noindex" in robots
    if file.name not in SKIP_FILES and not noindex:
        if len(parser.canonicals) != 1:
            fail(f"{file.relative_to(ROOT)}: expected exactly one canonical tag, found {len(parser.canonicals)}")
        elif parser.canonicals[0] in canonical_to_page:
            fail(f"Duplicate canonical {parser.canonicals[0]} on {file.relative_to(ROOT)} and {canonical_to_page[parser.canonicals[0]]}")
        elif parser.canonicals:
            canonical_to_page[parser.canonicals[0]] = str(file.relative_to(ROOT))
    for link in parser.links:
        if not link or link.startswith("#") or link.startswith("//") or link.lower().startswith(IGNORE_SCHEMES):
            continue
        target = resolve_local(link, file)
        if target is None: continue
        if not target.is_file():
            fail(f"{file.relative_to(ROOT)}: broken local link/asset {link}")

sitemap = ROOT / "sitemap.xml"
sitemap_urls = []
if not sitemap.is_file():
    fail("Missing sitemap.xml")
else:
    try:
        xml = ET.parse(sitemap).getroot()
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        sitemap_urls = [n.text.strip() for n in xml.findall(".//sm:loc", ns) if n.text]
        if not sitemap_urls: fail("sitemap.xml contains no <loc> URLs")
        if len(sitemap_urls) != len(set(sitemap_urls)): fail("sitemap.xml contains duplicate URLs")
        for url in sitemap_urls:
            if not url.startswith(BASE + "/") and url != BASE:
                fail(f"Sitemap URL uses unexpected host or scheme: {url}")
                continue
            parsed = urlparse(url)
            local = resolve_local(parsed.path, ROOT / "sitemap.xml")
            if local is None or not local.is_file():
                fail(f"Sitemap URL has no matching local file: {url}")
                continue
            parser = parsers.get(local)
            if parser:
                if any("noindex" in r for r in parser.robots):
                    fail(f"Noindex URL must not be in sitemap: {url}")
                if len(parser.canonicals) == 1 and parser.canonicals[0].rstrip("/") != url.rstrip("/"):
                    fail(f"Sitemap URL does not match canonical: sitemap={url} canonical={parser.canonicals[0]}")
    except ET.ParseError as exc:
        fail(f"sitemap.xml is invalid XML: {exc}")

print(f"Audited {len(html_files)} HTML files and {len(sitemap_urls)} sitemap URLs.")
if ERRORS:
    print(f"FAILED: {len(ERRORS)} issue(s)")
    for error in ERRORS: print(f" - {error}")
    sys.exit(1)
print("PASS: canonical tags, sitemap consistency, noindex exclusion, and local links/assets.")
