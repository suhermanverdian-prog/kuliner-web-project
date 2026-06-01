export default {
  plugins: {
    '@tailwindcss/postcss': {
      // Disable lightningcss on non-Windows platforms (e.g. Vercel Linux)
      lightningcss: false,
    },
    autoprefixer: {},
  },
}
