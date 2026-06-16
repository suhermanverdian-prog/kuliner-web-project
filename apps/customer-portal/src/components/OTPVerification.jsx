import React from 'react';

/**
 * OTPVerification — Input kode OTP 6-digit dengan tombol Verifikasi.
 * Props:
 *   code      : string             — nilai OTP saat ini
 *   onChange  : (code: string) => void
 *   onVerify  : () => void          — dipanggil saat tombol Verifikasi diklik
 */
export default function OTPVerification({ code, onChange, onVerify }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-zinc-400">Kode OTP telah dikirim ke nomor HP Anda.</p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          placeholder="Masukkan 6 digit OTP"
          className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 font-mono tabular-nums tracking-widest placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
        />
        <button
          type="button"
          onClick={onVerify}
          className="px-4 py-2 rounded bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 active:scale-95 transition-all dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-lg shadow-amber-500/20"
        >
          Verifikasi
        </button>
      </div>
    </div>
  );
}
