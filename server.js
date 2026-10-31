const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = 3000;
const HOST = 'localhost';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const ROUTE_MAP = {
  '/home': 'home.html',
  '/about': 'about.html',
  '/contact': 'contact.html'
};

async function serveFile(res, filePath, contentType, statusCode = 200) {
  try {
    const content = await fs.readFile(filePath);
    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'Content-Length': Buffer.byteLength(content),
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(content);
  } catch (error) {
    console.error(`Unable to serve ${filePath}:`, error.message);
    serveErrorPage(res, 500, 'Internal Server Error');
  }
}

async function serve404Page(res) {
  const notFoundPath = path.join(PUBLIC_DIR, '404.html');
  try {
    const content = await fs.readFile(notFoundPath);
    res.writeHead(404, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': Buffer.byteLength(content),
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
}

function serveErrorPage(res, statusCode, message, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...extraHeaders
  });
  res.end(`${statusCode} - ${message}`);
}

const server = http.createServer(async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      serveErrorPage(res, 405, 'Method Not Allowed', { 'Allow': 'GET, HEAD' });
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || HOST}`);
    let pathname = parsedUrl.pathname;

    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    if (pathname === '/') {
      res.writeHead(302, {
        'Location': '/home',
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end('Redirecting to /home...');
      return;
    }

    if (ROUTE_MAP[pathname]) {
      const fileName = ROUTE_MAP[pathname];
      const filePath = path.join(PUBLIC_DIR, fileName);
      await serveFile(res, filePath, 'text/html; charset=utf-8', 200);
      return;
    }

    const sanitizedSubPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const candidateFilePath = path.join(PUBLIC_DIR, sanitizedSubPath);

    if (!candidateFilePath.startsWith(PUBLIC_DIR)) {
      await serve404Page(res);
      return;
    }

    let fileStat;
    try {
      fileStat = await fs.stat(candidateFilePath);
    } catch {
      fileStat = null;
    }

    if (fileStat && fileStat.isFile()) {
      const ext = path.extname(candidateFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      await serveFile(res, candidateFilePath, contentType, 200);
      return;
    }

    await serve404Page(res);
  } catch (fatalError) {
    console.error('Unexpected server error:', fatalError);
    serveErrorPage(res, 500, 'Internal Server Error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`GOOGOOEXAMPLEGAAGAA server running on http://${HOST}:${PORT}`);
  console.log(`Routes available: /home, /about, /contact, / (redirects to /home)`);
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
