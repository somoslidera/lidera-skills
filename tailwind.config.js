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
          dark: '#0A1128', // Navy Blue profundo (fundo principal)
          gray: '#162447', // Navy Blue escuro (cards)
          'gray-light': '#1F3A5F', // Navy Blue médio (bordas)
          'gray-hover': '#274472', // Navy Blue claro (hover)
          gold: {
            DEFAULT: '#D4AF37', // Dourado Clássico
            light: '#F3E5AB', // Champanhe
            dim: '#AA8C2C', // Dourado escuro
            400: '#E5C158', // Dourado claro
            500: '#D4AF37', // Dourado principal
            600: '#B8941F', // Dourado escuro
            300: '#F3E5AB', // Dourado muito claro
          }
        },
        navy: {
          900: '#0A1128', // Navy Blue profundo
          800: '#162447', // Navy Blue escuro
          700: '#1F3A5F', // Navy Blue médio
          600: '#274472', // Navy Blue claro
        },
        gold: {
          300: '#F3E5AB', // Dourado muito claro
          400: '#E5C158', // Dourado claro
          500: '#D4AF37', // Dourado principal
          600: '#B8941F', // Dourado escuro
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