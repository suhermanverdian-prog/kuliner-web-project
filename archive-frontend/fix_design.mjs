import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.resolve(__dirname, 'src/pages');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // 1. Replace bg-white and bg-black with bg-card or bg-background
  content = content.replace(/bg-white/g, 'bg-card');
  content = content.replace(/bg-black/g, 'bg-background');
  // 2. Replace text-white and text-black
  content = content.replace(/text-white/g, 'text-zinc-900 dark:text-white');
  content = content.replace(/text-black/g, 'text-zinc-900');
  // 3. Replace custom rounded values with rounded-lg (8px) for cards/panels
  content = content.replace(/rounded-\[.*?\]/g, 'rounded-lg');
  // 4. Replace rounded-2xl, rounded-xl, rounded-3xl etc. with rounded-lg (keep full circles)
  content = content.replace(/rounded-(2xl|xl|3xl|4xl|5xl|full)/g, match => {
    if (match === 'rounded-full') return match; // keep circles
    return 'rounded-lg';
  });
  // 5. Remove opacity utilities on text (opacity-XX)
  content = content.replace(/\s+opacity-\d+/g, '');
  // 6. Replace text-muted-foreground with explicit zinc colors
  content = content.replace(/text-muted-foreground/g, 'text-zinc-500 dark:text-zinc-100');
  // 7. Replace bg-muted (background) with bg-background (base)
  content = content.replace(/bg-muted/g, 'bg-background');
  // 8. Ensure primary button classes follow KEN spec (bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900)
  content = content.replace(/className="([^"]*?)\bbg-(?:amber|zinc)-\d+[^"]*?"/g, (match, inner) => {
    if (!/outline|ghost/.test(inner)) {
      const newClasses = inner.replace(/bg-(?:amber|zinc)-\d+/g, 'bg-amber-500');
      const final = newClasses.replace(/text-[^\s"]+/g, 'text-white');
      return `className="${final}"`;
    }
    return match;
  });
  // 9. Add font-mono tabular-nums to numeric displays (heuristic for $ or digits inside braces)
  const numberRegex = /\{\s*\$?\d[\d.,]*\s*\}/g;
  let match;
  while ((match = numberRegex.exec(content)) !== null) {
    const before = content.slice(0, match.index);
    const classAttr = before.match(/className="([^"]*)"/);
    if (classAttr && !/font-mono/.test(classAttr[1])) {
      const newClass = classAttr[1] + ' font-mono tabular-nums';
      content = content.replace(classAttr[0], `className="${newClass}"`);
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Patched ${filePath}`);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

walk(pagesDir);
console.log('Design remediation completed.');
