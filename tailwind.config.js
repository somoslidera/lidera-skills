/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lidera: {
          dark: '#0a0a0a', // Preto profundo
          gray: '#171717', // Cinza muito escuro para cards
          gold: {
            DEFAULT: '#D4AF37', // Dourado Clássico
            light: '#F3E5AB', // Champanhe
            dim: '#AA8C2C', // Dourado escuro
          }
        },
        skills: {
          light: '#F0F4F8', // Branco azulado (gelo)
          blue: {
            primary: '#0047AB', // Azul Cobalto
            secondary: '#007FFF', // Azul Azure
            dark: '#002E63'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}