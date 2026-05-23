const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\HENI\\Downloads\\Pelatihan\\apk\\Coffeeshop\\frontend\\src\\pages\\ShiftPage.jsx', 'utf8');
const lines = content.split(/\r?\n/);
for (let i = 259; i < 298; i++) {
  console.log(`Line ${i + 1}: [${lines[i]}]`);
}
