const { supabase } = require('../../backend/src/supabase');

async function checkAccounting() {
  console.log("=== 🔍 COA & JOURNAL DIAGNOSTIC ===");
  
  // 1. Check Accounts (COA)
  const { data: accounts, error: accErr } = await supabase.from('accounts').select('*');
  if (accErr) {
    console.error("❌ Accounts Error:", accErr.message);
  } else {
    console.log(`✅ Accounts Found: ${accounts.length} items`);
    if (accounts.length > 0) {
      console.log("First 3 accounts:", accounts.slice(0, 3));
    }
  }

  // 2. Check Journal Headers
  const { data: headers, error: headErr } = await supabase.from('journal_headers').select('*');
  if (headErr) {
    console.error("❌ Journal Headers Error:", headErr.message);
  } else {
    console.log(`✅ Journal Headers Found: ${headers.length} items`);
    if (headers.length > 0) {
      console.log("First 3 headers:", headers.slice(0, 3));
    }
  }

  // 3. Check Journal Lines
  const { data: lines, error: lineErr } = await supabase.from('journal_lines').select('*');
  if (lineErr) {
    console.error("❌ Journal Lines Error:", lineErr.message);
  } else {
    console.log(`✅ Journal Lines Found: ${lines.length} items`);
  }
}

checkAccounting();
