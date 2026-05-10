@echo off
echo Menyiapkan Sistem BrewMaster Coffee Shop...
echo.

:: Menjalankan Backend di jendela terminal baru
echo 1. Menjalankan Server Database (Backend)...
start "BrewMaster Backend" cmd /k "cd backend && node src/server.js"

:: Menjalankan Frontend di jendela terminal baru (Force Port 5175)
echo 2. Menjalankan Tampilan Aplikasi (Frontend pada Port 5175)...
start "BrewMaster Frontend" cmd /k "cd frontend && npm run dev -- --port 5175"

:: Memberikan waktu sejenak agar server siap (3 detik)
echo 3. Menunggu server siap...
timeout /t 3 /nobreak > nul

:: Membuka browser secara otomatis ke alamat aplikasi
echo 4. Membuka Browser...
start http://localhost:5175

echo.
echo Aplikasi berhasil dijalankan pada http://localhost:5175!
echo Anda bisa menutup jendela hitam ini, tapi biarkan 2 jendela lainnya tetap terbuka.
timeout /t 3 > nul
exit
