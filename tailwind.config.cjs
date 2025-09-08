/**** Tailwind Config ****/
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '.dark &'],
  content: ['./client/**/*.{js,ts,jsx,tsx,html}', './imports/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
    },
  },
  plugins: [],
};
