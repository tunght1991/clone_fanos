import { createAdminApp } from './app.js';

const app = createAdminApp({
  baseUrl: globalThis.__ADMIN_CONFIG__?.API_BASE_URL ?? '',
});
app.start();
