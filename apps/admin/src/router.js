import { normalizeAdminPath } from './auth/access-control.js';

function parseSearchParams(searchParams) {
  const result = {};
  for (const [key, value] of searchParams.entries()) {
    result[key] = value;
  }

  return result;
}

export function parseAdminLocation(locationLike) {
  const hash = locationLike.hash ?? '';
  const rawPath = hash.startsWith('#') ? hash.slice(1) : hash;
  const normalizedRawPath = rawPath || '/';
  const [pathnamePart, queryString = ''] = normalizedRawPath.split('?');
  const pathname = normalizeAdminPath(pathnamePart);
  const searchParams = new URLSearchParams(queryString);

  return {
    pathname,
    search: parseSearchParams(searchParams),
    hash: `#${pathname}${queryString ? `?${queryString}` : ''}`,
  };
}

export function createHashNavigator(locationLike) {
  function navigate(pathname, search = {}) {
    const query = new URLSearchParams(search);
    const queryString = query.toString();
    locationLike.hash = `#${normalizeAdminPath(pathname)}${queryString ? `?${queryString}` : ''}`;
  }

  return {
    navigate,
  };
}
