const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../frontend/src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

let changedFiles = 0;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace colors
  content = content.replace(/(bg|text|border|ring|shadow|fill)-(emerald|blue|purple|indigo|slate|amber)-(400|500|600|700|800)(\/[0-9]+)?/g, (match, type, color, weight, opacity) => {
     // If it's amber, keep it (amber is accent, but maybe we want to keep raw amber classes since they are allowed)
     if (color === 'amber') return match;

     // Convert emerald and blue to accent
     if (color === 'emerald' || color === 'blue') {
         // text-emerald-600 -> text-accent
         // bg-emerald-500/10 -> bg-accent/10
         // shadow-emerald-200 -> shadow-accent/20 (handled via generic replace)
         return `${type}-accent${opacity || ''}`;
     }
     
     // Convert purple, indigo, slate to zinc
     // bg-indigo-600 -> bg-zinc-800
     // text-indigo-600 -> text-zinc-900 (or text-primary)
     if (type === 'text') return `text-primary${opacity || ''}`;
     return `${type}-zinc-800${opacity || ''}`;
  });

  // Handle specific shadow colors
  content = content.replace(/shadow-(emerald|blue|purple|indigo)-(200|300|500)(\/[0-9]+)?/g, (match, color, weight, opacity) => {
     return `shadow-accent/20`;
  });
  
  // Handle some specific error/success logic that uses hardcoded tailwind
  content = content.replace(/bg-error(\/[0-9]+)?/g, 'bg-destructive$1');
  content = content.replace(/text-error/g, 'text-destructive');
  content = content.replace(/border-error/g, 'border-destructive');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles++;
    console.log(`Updated colors in: ${file}`);
  }
}

console.log(`\nRefactoring complete. ${changedFiles} files updated.`);
