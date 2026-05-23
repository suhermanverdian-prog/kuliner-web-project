// hardening_ui.js – batch script to apply KEN Enterprise UI hardening
// Run with: `node scripts/hardening_ui.js`

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Directory containing JSX pages
const pagesDir = path.resolve(__dirname, '..', 'src', 'pages');

// Helper to replace patterns safely
function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  replacements.forEach(({ regex, replacement, description }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
    }
  });
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✔ Updated ${path.basename(filePath)} – applied transformations`);
  }
}

// Define transformation rules (ordered)
const rules = [
  // 1. Muted text → adaptive zinc contrast
  {
    regex: /text-muted-foreground/g,
    replacement: 'text-zinc-500 dark:text-zinc-400',
    description: 'Replace muted text color'
  },
  // 2. Remove opacity utilities from text elements (common values)
  { regex: /\s+opacity-(30|40|50|60|70|80|90)/g, replacement: '', description: 'Remove opacity classes' },
  // 3. Standardize border radius for cards/panels
  { regex: /rounded-(2xl|xl|3xl|full|[0-9]+xl)/g, replacement: 'rounded-lg', description: 'Enforce 8px radius' },
  // 4. Ensure button radius is 8px (rounded-lg) – keep any existing rounded-md
  { regex: /<Button([^>]*)className="([^"]*)"/g, replacement: (match, p1, p2) => {
      let classes = p2.split(/\s+/);
      if (!classes.includes('rounded-lg') && !classes.includes('rounded-md')) {
        classes.push('rounded-lg');
      }
      return `<Button${p1}className="${classes.join(' ')}"`;
    }, description: 'Add rounded-lg to Button components' },
  // 5. Primary CTA button styling – add Amber accent if missing
  { regex: /<Button([^>]*)>([^<]*)(Buka|Tutup|Export|Simpan|Kirim|Add|Create|Save|Submit)([^<]*)<\/Button>/g,
    replacement: (match, p1, before, word, after) => {
      // Ensure bg-amber-500 and text-white are present
      let classAttrMatch = p1.match(/className="([^"]*)"/);
      if (classAttrMatch) {
        let classes = classAttrMatch[1].split(/\s+/);
        if (!classes.some(c => c.startsWith('bg-amber-'))){
          classes.push('bg-amber-500','text-white','hover:bg-amber-600','dark:bg-amber-400','dark:text-zinc-900','dark:hover:bg-amber-500','rounded-lg','shadow-lg','shadow-amber-500/20','dark:shadow-amber-400/10','active:scale-95');
        }
        const newClass = classes.join(' ');
        const newAttr = p1.replace(/className="[^"]*"/, `className="${newClass}"`);
        return `<Button${newAttr}>${before}${word}${after}</Button>`;
      }
      return match;
    }, description: 'Enforce Amber primary button styling' },
  // 6. Remove shadow classes in dark mode – replace with border when dark:
  { regex: /dark:shadow-[^\s"]+/g, replacement: '', description: 'Remove dark shadows' },
  // 7. Replace hard‑coded bg‑white / bg‑zinc‑50 with semantic bg‑card
  { regex: /bg-(white|zinc-50)/g, replacement: 'bg-card', description: 'Use semantic background' },
  // 8. Replace hard‑coded text‑white on non‑amber backgrounds with adaptive zinc
  { regex: /text-white(?!.*dark:)/g, replacement: 'text-zinc-900 dark:text-white', description: 'Adaptive text color' },
];

// Process all .jsx files
glob('*.jsx', { cwd: pagesDir }, (err, files) => {
  if (err) throw err;
  files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    replaceInFile(filePath, rules);
  });
  console.log('✅ UI hardening complete. Please run the application and manually verify button semantics and any edge‑case styles.');
});
