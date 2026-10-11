# Phase 1 performance audit

Measured on 12 October 2026 (Africa/Cairo), against `main` commit
`55340ef2011c78fb40df85c573a2f6d800b29532`. Existing colours, Caviar Dreams/Montserrat typography,
gradients, layouts, focal points, content and navigation remain in place.
No separate Graphic Designer reference folder was available in this checkout;
the live site and current styles were used as the brand reference.

## Mobile measurements

Lighthouse 12.8.2, Chrome 155, default mobile simulation (412 × 823, DPR 1.75,
simulated slow 4G and 4× CPU slowdown). Both revisions were served from the same
machine with gzip and the same ten-minute cache policy. Cold-cache navigations,
two runs per final revision; the table reports medians. Baseline is unchanged
`main`; candidate is the proposed PR, **not the deployed production site**.

| Metric | Before | After |
| --- | ---: | ---: |
| Performance score | 74.5 / 100 | 79 / 100 |
| Largest Contentful Paint | 17.21 s | 5.86 s |
| First Contentful Paint | 1.57 s | 0.91 s |
| Total transferred data | 4.79 MB | 1.39 MB |
| Total Blocking Time | 0 ms | 0 ms |
| Cumulative Layout Shift | 0.0179 | 0.0181 |
| SEO score | 100 / 100 | 100 / 100 |

LCP improved by approximately 66%; transfer fell approximately 71%. LCP remains
above the 2.5-second good threshold in this simulated test. These are laboratory
results, not real-user Core Web Vitals or proof of a production improvement.
External font timing and the local server affect absolute timings. Layout shift
remained low, with a small measured increase of 0.0002.

The initial **live** homepage run scored 62, LCP 8.86 s, transfer 9.35 MB, SEO 92.
It reached Lighthouse's page-load time limit, so those results are provisional
and must not be compared directly with the local after scores. The live
`robots.txt` audit failed in that run; local robots/canonical/sitemap checks pass.
No robots or SEO policy changes were made based on that timed-out run.

## Findings and changes

- **LCP:** The live homepage preloaded a 3,000 × 2,308 WebP at 1,217,620 bytes
  on every device. Its background image was the measured LCP; approximately
  91% of the initial live LCP was image load time. Matched mobile/desktop
  preloads now select the same resource as CSS `image-set()`. The tested mobile
  candidate requests one 1,920-pixel AVIF of 445,352 bytes (63% smaller).
  WebP and original-image fallbacks remain available.
- **Responsive media:** 68 originals have separate WebP derivatives at useful
  widths (768, 1,280, 1,920 and 2,560 where the original is large enough).
  WebP quality 90; homepage AVIF quality 75. No upscaling or destructive edits.
  Large screens retain original resolution candidates. CSS cover crops include
  extra intrinsic width where required, rather than simply using viewport width.
- **Loading:** Below-the-fold portfolio and service images are lazy, decoded
  asynchronously, and have intrinsic dimensions. The above-the-fold About
  image remains eager with high fetch priority. Video posters are preloaded;
  smaller full-dimension derivatives are used where available. Hero video
  download/playback is scheduled after page load, including Apartment Celeste.
- **Slideshows:** The existing 3.8-second crossfade and mobile four-frame limit
  are preserved. Offscreen cards pause and resume at their current frame when
  visible; hidden tabs pause too. Newly created slides use responsive sources.
  The next frame is fetched while a card is visible and decoded before the
  crossfade, keeping the current image visible on slow or failed requests.
  ResizeObserver refreshes cover-aware image sizes when the viewport changes.
- **Fonts:** Existing Montserrat 400/500, Caviar Dreams faces, font preconnects
  and asynchronous stylesheet loading are retained. Browser checks confirmed
  both families load. Montserrat already uses `display=swap`; Caviar's remote
  stylesheet controls its font-display policy. Local Windows fonts can satisfy
  Caviar's `local()` source, so this machine is not a cross-platform font-timing
  benchmark. Self-hosting is deferred until exact font licensing is verified.
- **Scripts/styles:** The shared script is already deferred and small; measured
  blocking time is zero. No framework, tracking code or paid dependency added.
  Existing page-specific scripts and motion remain. Styles/script version
  queries are incremented so cached old code is not paired with new markup.
- **Caching:** Live GitHub Pages image responses use `Cache-Control: max-age=600`
  and ETag revalidation. This host does not expose per-file header overrides.
  Derivatives contain content hashes so changed bytes receive new URLs;
  hashes do not lengthen the host's cache lifetime. No unsupported `_headers`
  file, service worker, hosting migration or paid CDN is introduced.

## Validation and maintenance

- Existing SEO audit: 20 HTML pages, 14 sitemap entries; canonical, noindex,
  sitemap and internal asset/link checks pass.
- New dependency-free media audit: responsive candidates and gallery metadata
  resolve; no duplicate srcset descriptors; derivative filename hashes and
  original SHA-256 hashes match. Runs in the existing PR/push workflow.
- All original asset bytes, page titles, canonical/meta tags, JSON-LD, link
  destinations, sitemap, robots.txt and CNAME compared against `main`.
- Chrome browser checks: 11 routes at 390-pixel mobile and 1,440-pixel desktop
  widths; no JavaScript errors, missing local resources, broken images or
  horizontal overflow. Menu open/Escape close, visible gallery advance and
  offscreen gallery pause/resume checked. A failed next-frame request was
  injected to verify the current decoded frame stays visible. Homepage/gallery screenshots inspected.
- JavaScript syntax and whitespace checks pass.
- Sampled compression-only fidelity checks (SSIM against the original resized
  to the same dimensions): homepage AVIF 0.987–0.991; three portfolio WebP
  samples 0.980–0.989. This checks compression fidelity, not equality with the
  original 3–4K detail at smaller delivery sizes. Originals remain available.

Compact run data, browser results and fidelity samples are recorded in
[`performance-measurements.json`](performance-measurements.json).

This is a committed static site with `.nojekyll`: there is no production build
or runtime dependency to deploy. GitHub Pages continues to serve the files.
Optional image authoring uses free/open-source Sharp:

```sh
pnpm install --frozen-lockfile
pnpm images
python scripts/media_audit.py
python scripts/seo_audit.py
```

The generator reads originals and writes derivatives plus a manifest. When
adding/replacing photography, update its HTML srcset/gallery metadata and CSS
image-set/preload references to the generated URLs before committing. Preserve
old derivative files until existing cached markup no longer references them.
Generated derivatives add approximately 55.7 MB to the repository; clients
request only selected candidates. Merge and production deployment are separate
from this PR. After deployment, rerun mobile Lighthouse/PageSpeed against the
live URL and review Search Console Core Web Vitals once field data has updated.
