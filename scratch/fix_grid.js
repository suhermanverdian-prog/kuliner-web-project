const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../frontend/src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

let changedFiles = 0;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace spacing utilities to strictly follow 4-based tailwind units (1 unit = 4px, so multiple of 4 units = 16px, 24px, 32px etc which are multiples of 8px)
  // p-5 -> p-6
  // p-3 -> p-4
  // We want to replace exact class names, so we use regex word boundaries
  
  const replacements = {
    'p-5': 'p-6',
    'p-3': 'p-4',
    'gap-5': 'gap-6',
    'gap-3': 'gap-4',
    'm-5': 'm-6',
    'm-3': 'm-4',
    'mt-5': 'mt-6',
    'mt-3': 'mt-4',
    'mb-5': 'mb-6',
    'mb-3': 'mb-4',
    'ml-5': 'ml-6',
    'ml-3': 'ml-4',
    'mr-5': 'mr-6',
    'mr-3': 'mr-4',
    'px-5': 'px-6',
    'px-3': 'px-4',
    'py-5': 'py-6',
    'py-3': 'py-4',
  };

  for (const [oldClass, newClass] of Object.entries(replacements)) {
      // Look for the class with word boundaries to avoid replacing parts of other words (like group-hover:p-5)
      // Actually tailwind classes might have prefixes like md:p-5.
      // So look for (?<=[\s"']|^)([a-z:]+)?oldClass(?=[\s"']|$)
      // Simplified: regex that matches spaces or quotes before, and spaces or quotes after.
      const regex = new RegExp(`(?<=[\\s"'\\\`]|^)([a-z:]+)?${oldClass}(?=[\\s"'\\\`]|$)`, 'g');
      content = content.replace(regex, `$1${newClass}`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles++;
    console.log(`Updated grid spacing in: ${file}`);
  }
}

console.log(`\nGrid refactoring complete. ${changedFiles} files updated.`);
