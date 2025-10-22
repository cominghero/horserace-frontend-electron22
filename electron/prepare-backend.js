import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Prepare backend dependencies for Electron build
 * This script ensures backend dependencies are installed before packaging
 */

console.log('Preparing backend for Electron packaging...');

const backendPath = join(__dirname, '../../horseraceBackend');
const backendDistPath = join(__dirname, '../dist-backend');

// Create dist-backend directory if it doesn't exist
if (!existsSync(backendDistPath)) {
  mkdirSync(backendDistPath, { recursive: true });
  console.log('Created dist-backend directory');
}

// Files to copy
const filesToCopy = [
  'server.js',
  'scraper.js',
  'scraper-alternative.js',
  'db.js',
  'package.json',
  '.env.example',
];

console.log('Copying backend files...');
filesToCopy.forEach(file => {
  const source = join(backendPath, file);
  const dest = join(backendDistPath, file);

  if (existsSync(source)) {
    copyFileSync(source, dest);
    console.log(`✓ Copied ${file}`);
  } else {
    console.warn(`⚠ Warning: ${file} not found`);
  }
});

console.log('\n✓ Backend prepared successfully!');
console.log('\nNext steps:');
console.log('1. Run: cd dist-backend && npm install --production');
console.log('2. Run: npm run electron:build');
