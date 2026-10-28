// Optional authoring step. GitHub Pages serves the committed output directly.
// Originals are read only; derivative filenames change when their bytes change.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const manifest = {};
for (const dir of await fs.readdir(path.join(root, 'assets'), { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === 'responsive') continue;
  for (const file of await fs.readdir(path.join(root, 'assets', dir.name))) {
    if (!file.endsWith('.webp')) continue;
    const original = `assets/${dir.name}/${file}`;
    const input = await fs.readFile(path.join(root, original));
    const { width, height } = await sharp(input).metadata();
    const variants = [];
    const widths = [...new Set([768, 1280, 1920, 2560, Math.min(width, 2560)].filter(w => w <= width))].sort((a, b) => a - b);
    for (const w of widths) {
      const data = await sharp(input).resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 90, effort: 6 }).toBuffer();
      // Never replace a smaller original with a larger recompressed copy.
      if (w === width && data.length >= input.length) continue;
      const hash = createHash('sha256').update(data).digest('hex').slice(0, 12);
      const slug = `${dir.name}/${path.parse(file).name}`.toLowerCase().replace(/[^a-z0-9/-]+/g, '-');
      const url = `assets/responsive/${slug}-${w}-${hash}.webp`;
      await fs.mkdir(path.dirname(path.join(root, url)), { recursive: true });
      await fs.writeFile(path.join(root, url), data);
      variants.push({ width: w, url, bytes: data.length });
    }
    // The full resolution original remains available to large/high density screens.
    variants.push({ width, url: original.replaceAll(' ', '%20'), bytes: input.length, original: true });
    manifest[original] = { width, height, bytes: input.length,
      sha256: createHash('sha256').update(input).digest('hex'), variants };
    // The homepage LCP gets AVIF too. Other images retain simpler WebP delivery.
    if (original === 'assets/apartment-celeste/Apartment-Celeste-08.webp') {
      const avifVariants = [];
      for (const w of [1280, 1920, width]) {
        const data = await sharp(input).resize({ width: w }).avif({ quality: 75, effort: 6 }).toBuffer();
        const hash = createHash('sha256').update(data).digest('hex').slice(0, 12);
        const url = `assets/responsive/apartment-celeste/apartment-celeste-08-${w}-${hash}.avif`;
        await fs.writeFile(path.join(root, url), data);
        avifVariants.push({ width: w, url, bytes: data.length });
      }
      manifest[original].avifVariants = avifVariants;
    }
  }
}
await fs.writeFile(path.join(root, 'assets/responsive/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Generated responsive derivatives for ${Object.keys(manifest).length} originals; originals unchanged.`);
