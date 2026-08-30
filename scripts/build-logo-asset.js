import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const iconPath = path.resolve(rootDir, 'icons/icon-128.png');
const iconBuf = fs.readFileSync(iconPath);
const base64 = iconBuf.toString('base64');
const dataUri = `data:image/png;base64,${base64}`;

const code = `export const TM_LOGO_DATA_URI = '${dataUri}';\n`;
fs.writeFileSync(path.resolve(rootDir, 'src/ui/logo-asset.ts'), code);
console.log('src/ui/logo-asset.ts created successfully!');
