/**
 * TI-84 Plus CE - Local Host Server
 * Serves HTTP (8080) & trusted Cloudflare Tunnel with live terminal QR Code for iPhone PWA installation
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

const HTTP_PORT = process.env.PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
const ROOT_DIR = __dirname;

// Common MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.h84statej': 'application/json',
  '.h84state': 'application/octet-stream'
};

// Find local Wi-Fi / LAN IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, ip: iface.address });
      }
    }
  }

  addresses.sort((a, b) => {
    const isWifiA = /wi-?fi|wlan/i.test(a.name);
    const isWifiB = /wi-?fi|wlan/i.test(b.name);
    if (isWifiA && !isWifiB) return -1;
    if (!isWifiA && isWifiB) return 1;
    return 0;
  });

  return addresses;
}

// Request Handler
function handleRequest(req, res) {
  let reqUrl = req.url.split('?')[0].split('#')[0];
  if (reqUrl === '/') reqUrl = '/index.html';

  const safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${reqUrl}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    };

    if (filePath.endsWith('sw.js') || filePath.endsWith('index.html') || filePath.endsWith('manifest.json')) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

// Read local SSL certs if present
let sslOptions = null;
const keyPath = path.join(ROOT_DIR, 'server.key');
const certPath = path.join(ROOT_DIR, 'server.crt');
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  try {
    sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
  } catch (e) {}
}

// Start HTTP Server
const httpServer = http.createServer(handleRequest);
httpServer.listen(HTTP_PORT, '0.0.0.0', async () => {
  const localIPs = getLocalIPs();
  const primaryIP = localIPs.length > 0 ? localIPs[0].ip : 'localhost';

  console.log('\n======================================================');
  console.log('       TI-84 Plus CE Graphing Calculator Server       ');
  console.log('======================================================\n');
  console.log(`Local Access:      http://localhost:${HTTP_PORT}`);
  console.log(`Local Wi-Fi HTTP:  http://${primaryIP}:${HTTP_PORT}`);

  // Try creating trusted Cloudflare Tunnel for Apple-trusted SSL
  try {
    const { startTunnel } = await import('untun');
    const tunnel = await startTunnel({ port: HTTP_PORT });
    const tunnelUrl = await tunnel.getURL();

    console.log('\n------------------------------------------------------');
    console.log('  TRUSTED SECURE URL (Apple-Approved for Offline PWA):');
    console.log(`  ${tunnelUrl}`);
    console.log('------------------------------------------------------\n');
    console.log('  Point your iPhone Camera at this QR Code:\n');

    const qr = await QRCode.toString(tunnelUrl, { type: 'terminal', small: true });
    console.log(qr);

    console.log('======================================================');
    console.log('  How to Make It 100% Offline on Your iPhone:         ');
    console.log(`  1. Scan the QR code to open: ${tunnelUrl}`);
    console.log('  2. In Safari, tap the Share Button (box with arrow).');
    console.log('  3. Scroll down and tap "Add to Home Screen".        ');
    console.log('  4. Tap "Add".                                       ');
    console.log('  5. Open the new "TI-84 CE" app from your Home Screen');
    console.log('     once so all assets cache.                        ');
    console.log('  6. That\'s it! You can now turn on AIRPLANE MODE or  ');
    console.log('     shut down your computer — the app will open and  ');
    console.log('     work 100% offline, anywhere!                     ');
    console.log('======================================================\n');
  } catch (err) {
    console.log('\nCould not start online tunnel; falling back to local network.');
    const fallbackUrl = `http://${primaryIP}:${HTTP_PORT}`;
    console.log(`Local URL: ${fallbackUrl}`);
    try {
      const qr = await QRCode.toString(fallbackUrl, { type: 'terminal', small: true });
      console.log(qr);
    } catch (e) {}
  }
});

// Start HTTPS Server
if (sslOptions) {
  const httpsServer = https.createServer(sslOptions, handleRequest);
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {});
}
