// migrate.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://ixpamdylbkfukofexcgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGFtZHlsYmtmdWtvZmV4Y2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2NzkzOCwiZXhwIjoyMDkzNDQzOTM4fQ.4rBCdxI1_uEIQwb2cE3RaAgfkfpD-kp4wwOw6eBzMxA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const uploadsDir = 'c:/Users/HENI/Downloads/Pelatihan/apk/Coffeeshop/frontend/public/uploads';

async function startMigration() {
  console.log('🚀 Memulai migrasi gambar menu ke Supabase Storage...');

  try {
    // 1. Buat Bucket 'menu-images' jika belum ada
    console.log('📦 Membuat bucket "menu-images"...');
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('menu-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists') || bucketError.message.includes('Duplicate')) {
        console.log('ℹ️ Bucket "menu-images" sudah ada, melanjutkan...');
      } else {
        console.error('❌ Gagal membuat bucket:', bucketError.message);
        return;
      }
    } else {
      console.log('✅ Bucket "menu-images" berhasil dibuat!');
    }

    // 2. Cek isi direktori lokal
    if (!fs.existsSync(uploadsDir)) {
      console.error('❌ Folder uploads tidak ditemukan di path:', uploadsDir);
      return;
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 Ditemukan ${files.length} file di folder uploads lokal.`);

    // Upload semua file ke bucket 'menu-images'
    for (const filename of files) {
      const filePath = path.join(uploadsDir, filename);
      const fileBuffer = fs.readFileSync(filePath);

      console.log(`⏳ Mengupload ${filename}...`);

      let contentType = 'image/jpeg';
      if (filename.endsWith('.webp')) contentType = 'image/webp';
      else if (filename.endsWith('.png')) contentType = 'image/png';

      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(filename, fileBuffer, {
          contentType,
          upsert: true // Overwrite jika sudah ada
        });

      if (error) {
        console.error(`❌ Gagal mengupload ${filename}:`, error.message);
      } else {
        console.log(`✅ Berhasil mengupload ${filename} -> Path: ${data.path}`);
      }
    }

    // 3. Update database URL gambar di tabel menu
    console.log('🔄 Memulai pembaruan alamat URL gambar di tabel menu...');

    const { data: menus, error: fetchError } = await supabase
      .from('menu')
      .select('id, name, image');

    if (fetchError) {
      console.error('❌ Gagal mengambil data menus dari database:', fetchError.message);
      return;
    }

    console.log(`📊 Memproses ${menus.length} data menu di database...`);

    for (const menu of menus) {
      if (!menu.image) continue;

      const cleanPath = menu.image.replace(/^\/+/, ''); // bersihkan slash di depan jika ada

      // Cek format "/uploads/nama-file.webp" atau "uploads/nama-file.webp"
      if (cleanPath.startsWith('uploads/')) {
        // Ambil nama filenya saja (misal: "cafe_latte.webp")
        const filename = cleanPath.split('/').pop();
        const newUrl = `${supabaseUrl}/storage/v1/object/public/menu-images/${filename}`;

        console.log(`📝 Mengupdate menu: "${menu.name}"`);
        console.log(`   Sebelum: ${menu.image}`);
        console.log(`   Sesudah: ${newUrl}`);

        const { error: updateError } = await supabase
          .from('menu')
          .update({ image: newUrl })
          .eq('id', menu.id);

        if (updateError) {
          console.error(`   ❌ Gagal update menu "${menu.name}":`, updateError.message);
        } else {
          console.log(`   ✅ Sukses update menu "${menu.name}"`);
        }
      } else {
        console.log(`ℹ️ Lewati menu "${menu.name}" karena URL sudah absolute atau bukan format uploads lokal: ${menu.image}`);
      }
    }

    console.log('🎉 Migrasi Selesai Dengan Sukses!');
  } catch (err) {
    console.error('❌ Terjadi error tak terduga:', err);
  }
}

startMigration();
