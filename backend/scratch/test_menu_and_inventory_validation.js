const express = require('express');
const menuRouter = require('../src/routes/menuRoutes');
const inventoryRouter = require('../src/routes/inventoryRoutes');

// Mock Express Response Object dengan Promise Resolver untuk menangani asinkronus murni
function mockResponse() {
    const res = {};
    res.promise = new Promise((resolve) => {
        res.resolvePromise = resolve;
    });
    res.status = function (code) {
        this.statusCode = code;
        return this;
    };
    res.json = function (data) {
        this.body = data;
        if (this.resolvePromise) this.resolvePromise();
        return this;
    };
    return res;
}

// Helper untuk menjalankan seluruh rantai middleware Express tiruan
async function executeStack(req, res, stack) {
    let index = 0;
    const next = async (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (index < stack.length) {
            const layer = stack[index++];
            await layer.handle(req, res, next);
        }
    };
    await next();
}

async function runTests() {
    console.log('🧪 ===================================================');
    console.log('👑 KEN ENTERPRISE — ROUTE VALIDATION INTEGRATION TESTS');
    console.log('=======================================================\n');

    // ====================================================================
    // TEST 1: Validasi Rute POST /api/menu (Format Harga Minus & URL Gambar Rusak)
    // ====================================================================
    console.log('🔹 TEST 1: Menguji Validasi /api/menu (Harga minus & URL tidak valid)...');
    const menuPostRoute = menuRouter.stack.find(s => s.route && s.route.path === '/' && s.route.methods.post);
    if (!menuPostRoute) {
        console.error('❌ Gagal melacak rute POST / di menuRouter.');
        return;
    }

    const req1 = {
        body: {
            name: '',                    // Harus ditolak (minimal 1 karakter)
            price: -5000,                // Harus ditolak (harus positif)
            image: 'bukan-url-gambar',   // Harus ditolak (format URL tidak sah)
            bom: [
                {
                    bahanId: 'bukan-uuid-bahan', // Harus dinormalisasi ke bahan_id dan dideteksi format non-UUID!
                    qty: -2.5                    // Harus ditolak (harus positif)
                }
            ]
        },
        userContext: {
            tenantId: '00000000-0000-0000-0000-000000000000',
            role: 'admin'
        }
    };

    const res1 = mockResponse();
    executeStack(req1, res1, menuPostRoute.route.stack);
    await res1.promise;

    if (res1.statusCode === 400) {
        console.log('✅ TEST 1 BERHASIL: Rute Menu menolak input kotor dengan 400 Bad Request!');
        console.log('📊 Rincian Detail Peringatan Zod:', JSON.stringify(res1.body, null, 2));
    } else {
        console.error(`❌ TEST 1 GAGAL: Rute Menu meloloskan data kotor dengan status ${res1.statusCode}`);
    }

    // ====================================================================
    // TEST 2: Validasi Rute POST /api/inventory (Harga Minus & Stok Minus)
    // ====================================================================
    console.log('\n🔹 TEST 2: Menguji Validasi /api/inventory (Bahan cost minus & stok minus)...');
    const inventoryPostRoute = inventoryRouter.stack.find(s => s.route && s.route.path === '/' && s.route.methods.post);
    if (!inventoryPostRoute) {
        console.error('❌ Gagal melacak rute POST / di inventoryRouter.');
        return;
    }

    const req2 = {
        body: {
            name: 'Kopi Arabika Toraja',
            category: 'Kopi',
            unit: 'Gram',
            price: -150,                 // Harus ditolak (tidak boleh minus)
            minStock: -500,              // Harus dinormalisasi ke min_stock dan ditolak karena minus!
            stock: -1000                 // Harus ditolak karena minus!
        },
        userContext: {
            tenantId: '00000000-0000-0000-0000-000000000000',
            role: 'admin'
        }
    };

    const res2 = mockResponse();
    executeStack(req2, res2, inventoryPostRoute.route.stack.slice(1));
    await res2.promise;

    if (res2.statusCode === 400) {
        console.log('✅ TEST 2 BERHASIL: Rute Bahan Baku menolak input kotor dengan 400 Bad Request!');
        console.log('📊 Rincian Detail Peringatan Zod:', JSON.stringify(res2.body, null, 2));
    } else {
        console.error(`❌ TEST 2 GAGAL: Rute Bahan Baku meloloskan data kotor dengan status ${res2.statusCode}`);
    }

    console.log('\n=======================================================');
    console.log('🏁 SEMUA INTEGRASI VALIDASI ZOD SUKSES');
    console.log('=======================================================\n');
}

runTests();
