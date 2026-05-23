const fs = require('fs');
const path = require('path');

const pagesDir = 'c:/Users/HENI/Downloads/Pelatihan/apk/Coffeeshop/frontend/src/pages';

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Sederhana tapi efektif untuk mendeteksi useEffect
  let index = 0;
  while (index < content.length) {
    const ueIdx = content.indexOf('useEffect', index);
    if (ueIdx === -1) break;
    
    // Cari bracket pembuka dari useEffect(
    const openParenIdx = content.indexOf('(', ueIdx);
    if (openParenIdx === -1) {
      index = ueIdx + 9;
      continue;
    }
    
    // Temukan baris keberadaan
    const lineNum = content.substring(0, ueIdx).split('\n').length;
    
    // Mari kita hitung tanda kurung untuk mencari penutup useEffect
    let parenCount = 1;
    let curr = openParenIdx + 1;
    let bracketContent = '';
    while (curr < content.length && parenCount > 0) {
      const char = content[curr];
      if (char === '(') parenCount++;
      else if (char === ')') parenCount--;
      
      if (parenCount > 0) {
        bracketContent += char;
      }
      curr++;
    }
    
    // bracketContent sekarang berisi isi parameter useEffect
    // Kita ingin melihat apakah ada parameter kedua setelah callback function
    const trimContent = bracketContent.trim();
    
    // Mari kita cek apakah parameter kedua ada, atau hanya ada callback
    // Pola callback: () => { ... } atau async () => { ... } atau function() { ... }
    // Jika tidak ada koma di luar callback, maka TIDAK ADA array dependensi!
    
    // Hitung kurung kurawal pembuka/penutup untuk melompati callback body
    let braceCount = 0;
    let hasCommaAfterCallback = false;
    let commaIndex = -1;
    
    for (let i = 0; i < trimContent.length; i++) {
      const c = trimContent[i];
      if (c === '{') braceCount++;
      else if (c === '}') braceCount--;
      
      if (braceCount === 0 && c === ',' && i > 5) {
        hasCommaAfterCallback = true;
        commaIndex = i;
        break;
      }
    }
    
    if (!hasCommaAfterCallback) {
      console.log(`[ALERT] useEffect TANPA DEPENDENCY ARRAY di ${path.basename(filePath)}:L${lineNum}`);
      // Print cuplikan kodenya
      const snippet = lines.slice(Math.max(0, lineNum - 1), Math.min(lines.length, lineNum + 10)).join('\n');
      console.log(snippet);
      console.log('--------------------------------------------------');
    } else {
      // Ada koma! Mari kita ambil bagian setelah koma untuk memeriksa dependensinya
      const deps = trimContent.substring(commaIndex + 1).trim();
      // Jika dependensinya mengandung fungsi yang dideklarasikan secara lokal, kita tandai
      if (deps && deps !== '[]') {
        console.log(`[INFO] useEffect dengan dependensi di ${path.basename(filePath)}:L${lineNum} -> [${deps}]`);
      }
    }
    
    index = ueIdx + 9;
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      scanFile(fullPath);
    }
  }
}

console.log('--- MEMULAI AUDIT KODE HOOK FRONTEND ---');
walkDir(pagesDir);
console.log('--- AUDIT HOOK SELESAI ---');
