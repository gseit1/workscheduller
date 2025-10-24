// Simple Icon Generator for PWA
// This creates basic SVG icons that can be used as placeholders

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon
function generateSVGIcon(size) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.4}" 
        fill="white">JA</text>
</svg>`;
  return svg;
}

// Generate all icon sizes
console.log('Generating PWA icons...\n');

sizes.forEach(size => {
  const svg = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${filename}`);
});

console.log('\n✅ All icons generated successfully!');
console.log('\nNote: These are SVG placeholders. For production, you should:');
console.log('1. Open public/generate-icons.html in a browser');
console.log('2. Click "Generate Icons" button');
console.log('3. Download each PNG icon');
console.log('4. Replace the SVG files in public/icons/ with the PNG files\n');
