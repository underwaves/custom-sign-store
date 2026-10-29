/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: 'var(--color-brand-pink, #F7B7C8)',
          'pink-dark': 'var(--color-brand-pink-dark, #E58CA5)',
          'pink-light': 'var(--color-brand-pink-light, #FDECEF)',
          cream: 'var(--color-brand-cream, #FFF9F5)',
          'cream-warm': 'var(--color-brand-cream-warm, #FBF2EA)',
          brown: 'var(--color-brand-brown, #5D473A)',
          'brown-soft': 'var(--color-brand-brown-soft, #8B7365)',
          gray: 'var(--color-brand-gray, #F4F1EE)',
          mint: 'var(--color-brand-mint, #B8E4D0)',
          lavender: 'var(--color-brand-lavender, #DCD2F5)',
        },
      },
      fontFamily: {
        sans: ['"Prompt"', '"Noto Sans Thai"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        pastel: '0 8px 28px -6px rgba(93, 71, 58, 0.08), 0 2px 6px -1px rgba(247, 183, 200, 0.14)',
        'pastel-lg': '0 16px 38px -8px rgba(93, 71, 58, 0.12), 0 4px 12px -2px rgba(247, 183, 200, 0.2)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
