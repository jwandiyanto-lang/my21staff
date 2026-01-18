const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [32, 64, 128, 256];
const logos = ['wordmark-full', 'icon-only'];
const inputDir = path.join(__dirname, '..', 'logos');
const outputDir = inputDir;

async function generateLogos() {
  for (const logo of logos) {
    const svgPath = path.join(inputDir, `${logo}.svg`);

    if (!fs.existsSync(svgPath)) {
      console.error(`SVG not found: ${svgPath}`);
      continue;
    }

    const svgBuffer = fs.readFileSync(svgPath);

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `${logo}-${size}.png`);

      // For wordmark, maintain aspect ratio (width-based)
      // For icon, use square dimensions
      const resizeOptions = logo === 'icon-only'
        ? { width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }
        : { height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } };

      await sharp(svgBuffer)
        .resize(resizeOptions)
        .png()
        .toFile(outputPath);

      console.log(`Generated ${logo}-${size}.png`);
    }
  }

  console.log('Logo generation complete!');
}

generateLogos().catch(console.error);
