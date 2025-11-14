// Script to convert SVG icon to PNG format for electron-builder
import sharp from 'sharp';
import { readFileSync } from 'fs';

const svgBuffer = readFileSync('./build/icon.svg');

// Generate 1024x1024 PNG for electron-builder to convert to .icns
await sharp(svgBuffer)
  .resize(1024, 1024)
  .png()
  .toFile('./build/icon.png');

console.log('✓ Generated icon.png (1024x1024)');

// Also generate 512x512 for various uses
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('./build/icon@2x.png');

console.log('✓ Generated icon@2x.png (512x512)');

// Generate 256x256
await sharp(svgBuffer)
  .resize(256, 256)
  .png()
  .toFile('./build/icon-256.png');

console.log('✓ Generated icon-256.png (256x256)');

console.log('\n✅ All icon assets generated successfully!');
