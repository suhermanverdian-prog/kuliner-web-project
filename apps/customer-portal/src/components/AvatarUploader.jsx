import React, { useRef } from 'react';

/**
 * AvatarUploader — Komponen lingkaran avatar dengan tombol kamera melayang.
 * Props:
 *   currentUrl  : string | null  — URL gambar avatar saat ini
 *   onUpload    : (File) => void — callback ketika file dipilih
 */
export default function AvatarUploader({ currentUrl, onUpload }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
  };

  return (
    <div className="relative w-20 h-20 group cursor-pointer" onClick={() => inputRef.current?.click()}>
      {/* Gambar / Placeholder */}
      {currentUrl ? (
        <img
          src={currentUrl}
          alt="Avatar"
          className="w-20 h-20 rounded-full object-cover border-2 border-amber-500"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center border-2 border-zinc-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      )}

      {/* Tombol kamera melayang */}
      <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-md group-hover:bg-amber-600 transition-colors active:scale-95">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>

      {/* Input file tersembunyi */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
