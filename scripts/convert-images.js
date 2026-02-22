const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const glob = util.promisify(require('glob'));
const sharp = require('sharp');
const cheerio = require('cheerio');

const WORKSPACE_ROOT = process.cwd();

function splitSrc(src) {
  const qIdx = src.indexOf('?');
  const hIdx = src.indexOf('#');
  let end = src.length;
  if (qIdx !== -1) end = Math.min(end, qIdx);
  if (hIdx !== -1) end = Math.min(end, hIdx);
  const base = src.slice(0, end);
  const suffix = src.slice(end);
  return { base, suffix };
}

async function convertImages() {
  const patterns = ['**/*.{png,jpg,jpeg,gif,PNG,JPG,JPEG,GIF}'];
  const ignore = ['**/node_modules/**', '**/scripts/**'];
  const files = new Set();
  for (const p of patterns) {
    const found = await glob(p, { nodir: true, ignore });
    found.forEach(f => files.add(f));
  }

  console.log(`Found ${files.size} image(s) to consider.`);

  for (const rel of files) {
    try {
      const abs = path.join(WORKSPACE_ROOT, rel);
      const ext = path.extname(rel).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) continue;
      const webpRel = rel.replace(/\.[^.]+$/, '.webp');
      const webpAbs = path.join(WORKSPACE_ROOT, webpRel);
      try {
        await fs.access(webpAbs);
        console.log(`Skipping existing: ${webpRel}`);
        continue;
      } catch (e) {
        // proceed to convert
      }

      await fs.mkdir(path.dirname(webpAbs), { recursive: true });
      await sharp(abs).webp({ quality: 80 }).toFile(webpAbs);
      console.log(`Converted: ${rel} -> ${webpRel}`);
    } catch (err) {
      console.error('Error converting', rel, err.message);
    }
  }
}

async function updateHtml() {
  const htmlFiles = await glob('**/*.html', { ignore: ['**/node_modules/**', '**/scripts/**'] });
  console.log(`Updating ${htmlFiles.length} HTML file(s).`);
  for (const rel of htmlFiles) {
    const abs = path.join(WORKSPACE_ROOT, rel);
    let content = await fs.readFile(abs, 'utf8');
    const $ = cheerio.load(content, { decodeEntities: false });
    let changed = false;

    $('img').each((i, img) => {
      const $img = $(img);
      const src = $img.attr('src');
      if (!src) return;
      if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return;
      const { base, suffix } = splitSrc(src);
      const lower = base.toLowerCase();
      if (!/\.(png|jpe?g|gif)$/.test(lower)) return;
      if ($img.parent().is('picture')) return;
      const webp = base.replace(/\.[^.]+$/, '.webp') + suffix;
      const source = $('<source>').attr('type', 'image/webp').attr('srcset', webp);
      $img.before(source);
      changed = true;
    });

    if (changed) {
      await fs.writeFile(abs, $.html(), 'utf8');
      console.log(`Patched: ${rel}`);
    }
  }
}

async function main() {
  try {
    await convertImages();
    await updateHtml();
    console.log('Conversion + HTML update complete.');
  } catch (err) {
    console.error('Fatal:', err);
    process.exit(1);
  }
}

main();
