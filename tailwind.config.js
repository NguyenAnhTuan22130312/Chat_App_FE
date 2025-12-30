/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0084ff',
        'primary-light': '#0099ff',
        online: '#44b700',
        error: '#fa3e3e',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-particle': 'floatParticle 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        floatParticle: {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.8' },
          '50%': { transform: 'translateY(-15px)', opacity: '1' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
