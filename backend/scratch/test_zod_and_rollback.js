const { supabase } = require('../src/supabase');
const express = require('express');
const router = require('../src/routes/transactionRoutes');

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

async function runTests() {
    console.log('🧪 ===================================================');
    console.log('👑 KEN ENTERPRISE — TRANSACTION HARDENING TEST SUITE');
    console.log('=======================================================\n');

    // Ambil stack router handler untuk rute POST '/'
    const postRoute = router.stack.find(s => s.route && s.route.path === '/' && s.route.methods.post);
    if (!postRoute) {
        console.error('❌ Gagal melacak rute POST / di router.');
        return;
    }
    const stack = postRoute.route.stack;

    // Helper untuk menjalankan seluruh rantai middleware Express (validateBody -> controller)
    async function executeStack(req, res) {
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

    // ====================================================================
    // TEST 1: Zod Schema Validation (Data Kotor / Format Tidak Valid)
    // ====================================================================
    console.log('🔹 TEST 1: Mengirimkan Payload Kotor (menu_id non-UUID & Harga Minus)...');
    
    const req1 = {
        body: {
            customerName: 'Pelanggan Uji Zod',
            paymentMethod: 'QRIS',
            total: 25000,
            items: [
                {
                    id: 'bukan-uuid-legal', // Zod harus mendeteksi format non-UUID ini!
                    qty: -2,                // Zod harus menolak kuantitas minus!
                    price: -12500           // Zod harus menolak harga minus!
                }
            ]
        },
        userContext: {
            tenantId: '00000000-0000-0000-0000-000000000000',
            role: 'kasir'
        },
        headers: {},
        app: {
            get: () => null // Mock socket.io
        }
    };
    
    const res1 = mockResponse();
    await executeStack(req1, res1);
    await res1.promise;

    if (res1.statusCode === 400) {
        console.log('✅ TEST 1 BERHASIL: Server menolak data kotor dengan 400 Bad Request!');
        console.log('📊 Rincian Detail Peringatan Zod:', JSON.stringify(res1.body, null, 2));
    } else {
        console.error(`❌ TEST 1 GAGAL: Server merespon dengan status ${res1.statusCode} instead of 400.`);
    }

    // ====================================================================
    // TEST 2: Strict Transaction Rollback (Header Dihapus jika Detail Gagal)
    // ====================================================================
    console.log('\n🔹 TEST 2: Menguji Strict Rollback (Menyisipkan ID Menu Valid tapi Memicu Kegagalan Simpan Detail)...');

    // Gunakan UUID v4 yang sah secara struktural tetapi tidak ada di database menu
    const fakeMenuUuid = 'a1adbbd1-f485-49d9-ad1e-a22021aa5a7f';

    const req2 = {
        body: {
            customerName: 'Pelanggan Uji Rollback',
            paymentMethod: 'Tunai',
            cashierName: 'Auditor System',
            total: 50000,
            items: [
                {
                    id: fakeMenuUuid, // Format UUID valid, tapi menu tidak terdaftar
                    qty: 2,
                    price: 25000
                }
            ]
        },
        userContext: {
            tenantId: '00000000-0000-0000-0000-000000000000',
            role: 'kasir'
        },
        headers: {},
        app: {
            get: () => null
        }
    };

    const res2 = mockResponse();
    await executeStack(req2, res2);
    await res2.promise;

    if (res2.statusCode === 500) {
        console.log('✅ TEST 2 BERHASIL: Transaksi dibatalkan dengan 500 Internal Error!');
        console.log('📊 Respon Kesalahan:', JSON.stringify(res2.body, null, 2));

        // Verifikasi secara riil apakah Header Transaksi benar-benar bersih / di-rollback dari database cloud
        console.log('\n📡 Memeriksa database Supabase Cloud untuk memverifikasi apakah header dibersihkan...');
        const { data, error } = await supabase
            .from('transactions')
            .select('id, order_number')
            .eq('customer_name', 'Pelanggan Uji Rollback');

        if (error) {
            console.error('❌ Gagal menanyakan database:', error.message);
        } else if (data.length === 0) {
            console.log('🏆 ROLLBACK TERVERIFIKASI MUTLAK! Tidak ada header transaksi yatim-piatu tersisa di database.');
        } else {
            console.error('❌ ERROR INTEGRITAS: Header transaksi gagal di-rollback dan tertinggal di database:', data);
        }
    } else {
        console.error(`❌ TEST 2 GAGAL: Server merespon dengan status ${res2.statusCode} instead of 500.`);
    }

    console.log('\n=======================================================');
    console.log('🏁 PENGUJIAN SELESAI');
    console.log('=======================================================\n');
}

runTests();
