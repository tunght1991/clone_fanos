import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const indexPath = join(rootDir, 'index.html');
const port = Number(process.env.PORT ?? 4173);
const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

async function readAsset(filePath) {
  try {
    return await readFile(filePath);
  } catch {
    return readFile(indexPath);
  }
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', 'http://localhost');
  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;

  if (pathname === '/config.js') {
    const body = `window.__ADMIN_CONFIG__ = ${JSON.stringify({
      API_BASE_URL: apiBaseUrl,
    })};\n`;

    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(body);
    return;
  }

  const assetPath = join(rootDir, pathname);
  const filePath = extname(assetPath) ? assetPath : indexPath;
  const body = await readAsset(filePath);

  res.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath)] ?? 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
});

server.listen(port, () => {
  console.log(`Admin app running at http://localhost:${port}`);
});
