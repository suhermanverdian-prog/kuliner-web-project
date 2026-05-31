const fs = require('fs');
const path = require('path');
const lucide = require('./node_modules/lucide-react/dist/cjs/lucide-react.js');
const LUCIDE_ICONS = new Set(Object.keys(lucide).filter(k => /^[A-Z]/.test(k) && typeof lucide[k] === 'function'));

function getAllFiles(dir, ext) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fp = path.join(dir, file);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) results = results.concat(getAllFiles(fp, ext));
      else if (ext.some(e => file.endsWith(e))) results.push(fp);
    });
  } catch(e) {}
  return results;
}

const files = getAllFiles('src', ['.jsx', '.tsx']);
const realErrors = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const importedLucide = new Map();
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    m[1].split(',').forEach(entry => {
      const trimmed = entry.trim();
      if (!trimmed) return;
      const parts = trimmed.split(/\s+as\s+/);
      const alias = (parts.length > 1 ? parts[1] : parts[0]).trim();
      if (alias) importedLucide.set(alias, true);
    });
  }
  const localDefs = new Set();
  const localFnRegex = /(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/g;
  while ((m = localFnRegex.exec(content)) !== null) localDefs.add(m[1]);

  const jsxUsages = new Set();
  const jsxRx = /<([A-Z][a-zA-Z0-9]*)/g;
  while ((m = jsxRx.exec(content)) !== null) {
    if (LUCIDE_ICONS.has(m[1])) jsxUsages.add(m[1]);
  }

  jsxUsages.forEach(icon => {
    if (!importedLucide.has(icon) && !localDefs.has(icon)) {
      realErrors.push(path.basename(file) + ' -> <' + icon + '>');
    }
  });
});

console.log('=== ICON AUDIT FINAL ===');
console.log('Files dipindai:', files.length);
console.log('Total icon Lucide di package:', LUCIDE_ICONS.size);
if (realErrors.length === 0) {
  console.log('STATUS: BERSIH - Tidak ada icon yang benar-benar missing!');
} else {
  console.log('KRITIS - Missing icons (akan crash ReferenceError):');
  realErrors.forEach(e => console.log('  ' + e));
}
