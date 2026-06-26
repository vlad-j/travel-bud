const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../assets/icons');
const outputDir = path.join(__dirname, '../assets/icons-trimmed');

const padding = 24;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function trimImage(file) {
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file);

  const image = sharp(inputPath).ensureAlpha();
  const metadata = await image.metadata();

  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];

      if (alpha > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX === 0 && maxY === 0) {
    console.log(`Skipped empty image: ${file}`);
    return;
  }

  const left = Math.max(0, minX - padding);
  const top = Math.max(0, minY - padding);
  const width = Math.min(metadata.width - left, maxX - minX + padding * 2);
  const height = Math.min(metadata.height - top, maxY - minY + padding * 2);

  await sharp(inputPath)
    .extract({ left, top, width, height })
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);

  console.log(`Trimmed: ${file}`);
}

async function run() {
  const files = fs
    .readdirSync(inputDir)
    .filter((file) => file.toLowerCase().endsWith('.png'));

  for (const file of files) {
    await trimImage(file);
  }

  console.log('Done.');
}

run();