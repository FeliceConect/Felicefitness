const fs = require('fs');
const path = require('path');

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
        font-family="Inter, Arial, sans-serif" font-weight="bold"
        font-size="${size * 0.35}" fill="white">FF</text>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Criar diretório se não existir
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Gerar ícones SVG
sizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Criado: ${filename}`);
});

// Criar apple-touch-icon
const appleTouchIcon = createIconSVG(180);
fs.writeFileSync(path.join(__dirname, '../public/apple-touch-icon.svg'), appleTouchIcon);
console.log('Criado: apple-touch-icon.svg');

// Criar favicon
const favicon = createIconSVG(32);
fs.writeFileSync(path.join(__dirname, '../public/favicon.svg'), favicon);
console.log('Criado: favicon.svg');

console.log('\nIcones gerados com sucesso!');
console.log('IMPORTANTE: Para produção, converta os SVGs para PNG usando uma ferramenta como:');
console.log('- https://cloudconvert.com/svg-to-png');
console.log('- Ou use sharp/canvas no Node.js');
