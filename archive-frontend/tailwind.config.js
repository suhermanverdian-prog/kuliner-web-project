module.exports = {
  darkMode: 'class', // enable class strategy for dark mode
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        zinc: require('tailwindcss/colors').zinc,
        amber: require('tailwindcss/colors').amber,
      },
      spacing: {
        2: '8px',   // 8px
        4: '16px',  // 16px
        6: '24px',  // 24px
        8: '32px',  // 32px
      },
      borderRadius: {
        lg: '0.5rem',   // 8px
        md: '0.375rem', // 6px
        sm: '0.125rem', // 2px
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
