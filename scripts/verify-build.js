/**
 * 👑 KEN ENTERPRISE — ELITE BUILD & REPO STATE VERIFIER
 * LONG-TERM RESILIENCE & QUALITY ASSURANCE PROTOCOL
 */
const { execSync } = require('child_process');
const path = require('path');

// Visual styling helper
const style = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  zincBg: '\x1b[48;5;236m',
  amberText: '\x1b[38;5;214m',
  zincText: '\x1b[38;5;244m',
  emeraldText: '\x1b[38;5;46m',
  roseText: '\x1b[38;5;196m',
};

console.log(`\n${style.bold}${style.zincBg}${style.amberText} 👑 KEN ENTERPRISE — DEPLOYMENT INTEGRITY CHECKS ${style.reset}\n`);

// 1. Check for untracked/uncommitted source files
try {
  console.log(`${style.zincText}[1/3] Memeriksa status repositori Git...${style.reset}`);
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  
  if (status) {
    const lines = status.split('\n');
    const sourceChanges = lines.filter(line => {
      const file = line.substring(3);
      return (file.startsWith('frontend/src/') || file.startsWith('backend/src/')) && 
             !file.includes('coverage/') && 
             !file.includes('package-lock.json');
    });

    if (sourceChanges.length > 0) {
      console.warn(`${style.bold}${style.roseText}⚠️ WARNING: Terdapat perubahan kode sumber yang belum di-commit:${style.reset}`);
      sourceChanges.forEach(change => console.log(`   ${change}`));
      console.log(`\n${style.bold}${style.amberText}💡 Rekomendasi: Harap lakukan 'git add .' dan commit perubahan sebelum melakukan push untuk menghindari ghost code di Vercel!${style.reset}\n`);
    } else {
      console.log(`${style.emeraldText}✅ Bersih: Tidak ada perubahan kode aplikasi yang belum di-commit.${style.reset}`);
    }
  } else {
    console.log(`${style.emeraldText}✅ Bersih: Semua perubahan sudah di-commit secara rapi.${style.reset}`);
  }
} catch (err) {
  console.log(`${style.zincText}ℹ️ Git tidak terdeteksi atau tidak diinisialisasi dalam path ini.${style.reset}`);
}

// 2. Dry-Run Vite Production Build
try {
  console.log(`\n${style.zincText}[2/3] Menguji kompilasi build produksi frontend (Vite/Rollup)...${style.reset}`);
  console.log(`${style.zincText}     Menjalankan 'npm run build' di folder frontend...${style.reset}`);
  
  execSync('npm run build --prefix frontend', { stdio: 'inherit' });
  
  console.log(`\n${style.emeraldText}✅ SUCCESS: Kompilasi frontend berhasil dengan status 100% prima!${style.reset}`);
} catch (err) {
  console.error(`\n${style.bold}${style.roseText}🚨 ERROR: Kompilasi frontend GAGAL!${style.reset}`);
  console.error(`${style.roseText}Ada kesalahan sintaksis, duplikasi import, atau file hilang di kode Anda. Perbaiki sebelum melakukan push!${style.reset}`);
  process.exit(1);
}

// 3. Final Verification
console.log(`\n${style.bold}${style.emeraldText}[3/3] VERIFIKASI SELESAI: Kode aman dan siap disebarkan ke Vercel! 🚀${style.reset}\n`);
process.exit(0);
