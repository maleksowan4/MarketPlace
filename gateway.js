const http = require('http');

const PORT = process.env.GATEWAY_PORT || process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5003',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:5004',
  wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:5005',
  complaint: process.env.COMPLAINT_SERVICE_URL || 'http://localhost:5006',
};

const server = http.createServer((req, res) => {
  // CORS Headers support
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const path = req.url;
  const method = req.method;

  // 0. Gateway Health Check Endpoint
  if (path === '/health' || path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'api-gateway' }));
    return;
  }

  let targetServiceUrl = SERVICES.auth; // Default to Auth Service

  // 0. Static Uploads Routing for User/Shop logos & Product images
  if (path.startsWith('/api/uploads/user') || path.startsWith('/uploads/user')) {
    targetServiceUrl = SERVICES.user;
  } else if (path.startsWith('/api/uploads/product') || path.startsWith('/uploads/product')) {
    targetServiceUrl = SERVICES.product;
  }
  // 1. User / Shop Service
  else if (
    path.startsWith('/api/users/profile') ||
    (path === '/api/users' && method === 'GET') ||
    path.startsWith('/api/admin/sellers') ||
    path.startsWith('/api/admin/buyers') ||
    path.startsWith('/api/admin/users/block') ||
    path.startsWith('/api/admin/shops/block') ||
    path.startsWith('/api/shops')
  ) {
    targetServiceUrl = SERVICES.user;
  }
  // 2. Product Service
  else if (
    path.startsWith('/api/products') ||
    path.startsWith('/api/admin/products')
  ) {
    targetServiceUrl = SERVICES.product;
  }
  // 3. Order Service
  else if (path.startsWith('/api/orders')) {
    targetServiceUrl = SERVICES.order;
  }
  // 4. Wallet Service
  else if (path.startsWith('/api/wallet')) {
    targetServiceUrl = SERVICES.wallet;
  }
  // 5. Complaint Service
  else if (
    path.startsWith('/api/complaints') ||
    path.startsWith('/api/admin/complaints')
  ) {
    targetServiceUrl = SERVICES.complaint;
  }

  // --- ENDPOINT REWRITING RULES ---
  let rewrittenUrl = path;

  // Uploads path rewriting to microservices public/uploads/ directory
  if (path.startsWith('/api/uploads/user') || path.startsWith('/uploads/user')) {
    rewrittenUrl = path.replace(/^\/(api\/)?uploads\/user(\/uploads)?/, '/uploads');
  } else if (path.startsWith('/api/uploads/product') || path.startsWith('/uploads/product')) {
    rewrittenUrl = path.replace(/^\/(api\/)?uploads\/product(\/uploads)?/, '/uploads');
  }

  // GET /api/shops/:shopId/products -> GET /api/products/shop/:shopId
  const shopProductsMatch = path.match(/^\/api\/shops\/([0-9]+)\/products$/);
  if (shopProductsMatch) {
    const shopId = shopProductsMatch[1];
    rewrittenUrl = `/api/products/shop/${shopId}`;
    targetServiceUrl = SERVICES.product;
  }

  // GET /api/orders/buyer -> GET /api/orders
  if (path === '/api/orders/buyer') {
    rewrittenUrl = '/api/orders';
  }

  // GET /api/wallet -> GET /api/wallet/balance
  if (path === '/api/wallet') {
    rewrittenUrl = '/api/wallet/balance';
  }

  const targetUrl = new URL(targetServiceUrl);
  const targetPort = targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80);

  console.log(`[Gateway] Proxying ${method} ${path} -> ${targetUrl.origin}${rewrittenUrl}`);

  const options = {
    hostname: targetUrl.hostname,
    port: parseInt(targetPort),
    path: rewrittenUrl,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[Gateway Error] Failed to proxy request to ${targetUrl.origin}: ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Gateway Proxy Error', error: err.message }));
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
  console.log(`🚀 Gateway Proxy is running on port ${PORT}`);
  console.log(`- Services discovery routes configured`);
});
