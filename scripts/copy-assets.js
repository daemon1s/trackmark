import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.copyFileSync(
  path.resolve(rootDir, 'manifest.json'),
  path.resolve(distDir, 'manifest.json')
);

const iconsDir = path.resolve(rootDir, 'icons');
const distIconsDir = path.resolve(distDir, 'icons');
if (fs.existsSync(iconsDir)) {
  if (!fs.existsSync(distIconsDir)) {
    fs.mkdirSync(distIconsDir, { recursive: true });
  }
  fs.readdirSync(iconsDir).forEach(file => {
    fs.copyFileSync(path.resolve(iconsDir, file), path.resolve(distIconsDir, file));
  });
}

console.log('[Build] Assets, icons, and manifest.json copied to dist/');
