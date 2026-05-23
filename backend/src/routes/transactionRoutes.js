const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { validateBody } = require('../middleware/validate');
const transactionController = require('../controllers/transactionController');

// ====================================================================
// Zod Schema for POS Transaction Validation (KEN Enterprise Standard)
// ====================================================================
const transactionItemSchema = z.object({
    id: z.string().uuid("ID Menu harus berupa UUID yang valid"),
    qty: z.number().positive("Kuantitas barang harus lebih besar dari 0"),
    price: z.number().nonnegative("Harga barang tidak boleh bernilai negatif")
});

const posTransactionSchema = z.object({
    customer_name: z.string().optional().default("Tamu"),
    payment_method: z.string().optional().default("Tunai"),
    cashier_name: z.string().optional().default("System"),
    table_type: z.string().optional().default("Take Away"),
    discountAmount: z.number().nonnegative().optional().default(0),
    taxAmount: z.number().nonnegative().optional().default(0),
    uniqueCode: z.number().optional().default(0),
    total: z.number().positive("Total transaksi harus bernilai positif"),
    items: z.array(transactionItemSchema).min(1, "Transaksi minimal harus memiliki 1 barang"),
    created_at: z.string().optional()
});

/**
 * @route GET /api/transactions
 */
router.get('/', transactionController.getTransactions);

/**
 * @route GET /api/transactions/laporantrend
 */
router.get('/laporantrend', transactionController.getTrendReport);

/**
 * @route POST /api/transactions
 */
router.post('/', validateBody(posTransactionSchema), transactionController.createTransaction);

/**
 * @route PUT /api/transactions/:id/confirm
 */
router.put('/:id/confirm', transactionController.confirmPayment);

/**
 * @route PUT /api/transactions/:id/kds
 */
router.put('/:id/kds', transactionController.updateKdsStatus);

/**
 * @route POST /api/transactions/:id/request-void
 */
router.post('/:id/request-void', transactionController.requestVoid);

/**
 * @route POST /api/transactions/:id/approve-void
 */
router.post('/:id/approve-void', transactionController.approveVoid);

/**
 * @route GET /api/transactions/top-selling
 */
router.get('/top-selling', transactionController.getTopSelling);

module.exports = router;
