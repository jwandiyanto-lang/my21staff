const sharp = require('sharp');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'logo.png');
const outputPath = path.join(publicDir, 'og-image.png');

// Create 1200x630 image with white background and centered logo
async function generateOGImage() {
  try {
    // Load and resize logo to fit nicely in the OG image
    const logo = await sharp(logoPath)
      .resize(800, null, { // Width 800px, maintain aspect ratio
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();

    // Get logo metadata to center it
    const logoMeta = await sharp(logo).metadata();

    // Create white background 1200x630
    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{
      input: logo,
      top: Math.round((630 - logoMeta.height) / 2),
      left: Math.round((1200 - logoMeta.width) / 2),
    }])
    .png()
    .toFile(outputPath);

    console.log('✓ Open Graph image created:', outputPath);
    console.log('  Size: 1200x630px');
    console.log('  Background: White');
    console.log('  Logo centered');
  } catch (error) {
    console.error('Error generating OG image:', error);
    process.exit(1);
  }
}

generateOGImage();
