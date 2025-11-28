/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Ativa o modo escuro via classe CSS
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores do Tema Escuro (Dark)
        lidera: {
          dark: '#121212', // Aprox 93-95% Gray/Black
          gray: '#1E1E1E', // Painéis
          gold: '#D4AF37',
          'gold-light': '#F2E29F',
        },
        // Cores do Tema Claro (Light)
        skills: {
          light: '#F8FAFC', // Branco gelo fundo
          white: '#FFFFFF', // Painéis
          blue: {
            primary: '#0F52BA', // Azul Safira
            secondary: '#4CA1AF', // Azul degradê
            dark: '#1e3a8a'
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