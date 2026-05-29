const AccountingRepository = require('../../backend/src/repositories/accountingRepository');

async function testLocal() {
  console.log("=== 🔍 TESTING ACCOUNTING REPOSITORY DIRECTLY ===");
  try {
    const data = await AccountingRepository.getAccounts('fba884db-967a-4e9f-bad8-79211f6b2cc6');
    console.log("✅ Accounts Loaded Successfully:", data.length);
    console.log("First Account:", data[0]);
  } catch (err) {
    console.error("❌ Repository Threw Error:");
    console.error(err);
  }
}

testLocal();
