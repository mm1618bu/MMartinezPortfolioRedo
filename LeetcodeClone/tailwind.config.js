export default {
  content: [
    './index.pug',
    './src/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0b0f1a',
        haze: '#f7f3ea',
        tide: '#2f6f6e',
        ember: '#ff6b4a',
        slate: '#1b2433'
      },
      boxShadow: {
        glow: '0 10px 30px rgba(47, 111, 110, 0.35)'
      }
    }
  },
  plugins: []
};
