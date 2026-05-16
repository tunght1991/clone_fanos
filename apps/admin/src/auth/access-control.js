import { DEFAULT_ADMIN_ROUTE, PUBLIC_ROUTES } from '../config.js';

export function normalizeAdminPath(pathname) {
  const normalized = pathname?.trim() || '';
  if (!normalized || normalized === '/') {
    return DEFAULT_ADMIN_ROUTE;
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export function resolveRouteAccess(pathname, sessionState) {
  const path = normalizeAdminPath(pathname);
  const isPublicRoute = PUBLIC_ROUTES.has(path);

  if (isPublicRoute) {
    return {
      route: path,
      view: path.slice(1),
      redirectTo: null,
      requiresAdmin: false,
    };
  }

  if (sessionState?.status === 'authenticated') {
    return {
      route: path,
      view: path.slice(1),
      redirectTo: null,
      requiresAdmin: true,
    };
  }

  if (sessionState?.status === 'forbidden') {
    return {
      route: '/forbidden',
      view: 'forbidden',
      redirectTo: '/forbidden',
      requiresAdmin: false,
    };
  }

  return {
    route: '/login',
    view: 'login',
    redirectTo: '/login',
    requiresAdmin: false,
  };
}
