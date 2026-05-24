const { supabase } = require('../supabase');

/**
 * journalGuard – ensures that any INSERT/UPDATE to `journals` maintains
 * total debit == total credit. It should be used on routes that manually
 * create journal entries (e.g., GRN, Invoice payment).
 */
module.exports = async (req, res, next) => {
  // Only act on mutating methods that contain a `lines` array in body
  const mutating = ['POST', 'PUT', 'PATCH'].includes(req.method);
  if (!mutating) return next();

  const { lines } = req.body;
  if (!Array.isArray(lines)) return next();

  const debitTotal = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const creditTotal = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

  if (debitTotal !== creditTotal) {
    console.warn('🚨 [JournalGuard] Debit/Credit mismatch', { debitTotal, creditTotal });
    return res.status(400).json({ error: 'Journal entry is not balanced (debit ≠ credit).' });
  }

  // If balanced, let route continue
  next();
};
