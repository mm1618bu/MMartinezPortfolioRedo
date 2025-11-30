const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up proxy middleware...');
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      timeout: 300000, // 5 minutes
      proxyTimeout: 300000, // 5 minutes
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`→ Proxying: ${req.method} ${req.path} -> http://localhost:8000${req.path}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
      }
    })
  );
  
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
    })
  );
  
  console.log('✅ Proxy middleware configured');
};
