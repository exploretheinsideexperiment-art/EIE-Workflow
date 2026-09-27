import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');
const docsDir = path.resolve(process.cwd(), 'docs');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(distDir)) {
  if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(docsDir, { recursive: true });

  copyRecursiveSync(distDir, docsDir);
  console.log('[prepare-docs] Copied dist/ to docs/ successfully.');

  // Create .nojekyll in docs/ to disable Jekyll on GitHub Pages
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
  console.log('[prepare-docs] Created docs/.nojekyll');

  // Also create .nojekyll in root
  fs.writeFileSync(path.resolve(process.cwd(), '.nojekyll'), '');

  // Create 404.html as a fallback to index.html for SPA routing
  if (fs.existsSync(path.join(docsDir, 'index.html'))) {
    fs.copyFileSync(path.join(docsDir, 'index.html'), path.join(docsDir, '404.html'));
    console.log('[prepare-docs] Created docs/404.html');
  }
} else {
  console.error('[prepare-docs] dist directory not found! Run vite build first.');
}
