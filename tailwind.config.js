/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/main/src/**/*.{js,ts,jsx,tsx}',
    './src/renderer/shared/**/*.{js,ts,jsx,tsx}',
    './src/renderer/notification/**/*.{js,ts,jsx,tsx}',
    './src/renderer/main/index.html',
    './src/renderer/notification/index.html'
  ],
  theme: {
    extend: {
      colors: {
        buildkite: {
          green: '#14cc80',
          red: '#f83f23',
          yellow: '#ffba00',
          dark: '#1a1a2e',
          surface: '#16213e',
          border: '#2a2a4a'
        }
      },
      animation: {
        'progress-pulse': 'progressPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite'
      },
      keyframes: {
        progressPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      }
    }
  },
  plugins: []
}
