import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG base para o ícone
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#gradient)"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-weight="bold"
        font-size="${size * 0.35}" fill="white">FF</text>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');
const publicDir = path.join(__dirname, '../public');

// Criar diretório se não existir
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  // Gerar ícones PNG
  for (const size of sizes) {
    const svg = Buffer.from(createIconSVG(size));
    const filename = `icon-${size}x${size}.png`;

    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, filename));

    console.log(`Criado: ${filename}`);
  }

  // Criar apple-touch-icon
  const appleSvg = Buffer.from(createIconSVG(180));
  await sharp(appleSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Criado: apple-touch-icon.png');

  // Criar favicon
  const faviconSvg = Buffer.from(createIconSVG(32));
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Criado: favicon.png');

  // Criar favicon.ico (usando PNG como base)
  await sharp(faviconSvg)
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Criado: favicon.ico');

  console.log('\nTodos os ícones foram gerados com sucesso!');
}

generateIcons().catch(console.error);
