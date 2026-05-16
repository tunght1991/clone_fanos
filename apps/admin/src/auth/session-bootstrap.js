import { HttpError } from '../api/http.js';

function isHttpError(error, status) {
  return error instanceof HttpError && error.status === status;
}

function hasStatus(error, status) {
  return Boolean(error && typeof error === 'object' && 'status' in error && error.status === status);
}

async function validateTokens(authApi, accessToken) {
  const [user, admin] = await Promise.all([
    authApi.getMe(accessToken),
    authApi.getAdminMe(accessToken),
  ]);

  return { user, admin };
}

async function validateStoredSession(authApi, storedSession) {
  try {
    const verified = await validateTokens(authApi, storedSession.accessToken);
    return {
      status: 'authenticated',
      session: {
        ...storedSession,
        ...verified,
      },
    };
  } catch (error) {
    if (isHttpError(error, 403) || hasStatus(error, 403)) {
      return {
        status: 'forbidden',
        session: null,
      };
    }

    if (!isHttpError(error, 401) && !hasStatus(error, 401) && !isHttpError(error, 403) && !hasStatus(error, 403)) {
      return {
        status: 'unauthenticated',
        session: null,
      };
    }

    return {
      status: 'needs-refresh',
      session: null,
    };
  }
}

export async function bootstrapAdminSession({ store, authApi }) {
  const storedSession = store.read();
  if (!storedSession) {
    return {
      status: 'unauthenticated',
      session: null,
    };
  }

  const validated = await validateStoredSession(authApi, storedSession);
  if (validated.status === 'authenticated' || validated.status === 'forbidden') {
    if (validated.status !== 'authenticated') {
      store.clear();
    } else {
      store.write(validated.session);
    }

    return validated;
  }

  if (!storedSession.refreshToken) {
    store.clear();
    return {
      status: 'unauthenticated',
      session: null,
    };
  }

  try {
    const refreshed = await authApi.refresh(storedSession.refreshToken);
    const nextSession = {
      ...storedSession,
      ...refreshed,
    };

    store.write(nextSession);

    const revalidated = await validateStoredSession(authApi, nextSession);
    if (revalidated.status === 'authenticated') {
      store.write(revalidated.session);
      return revalidated;
    }

    store.clear();
    return revalidated.status === 'forbidden'
      ? revalidated
      : {
          status: 'unauthenticated',
          session: null,
        };
  } catch (error) {
    store.clear();

    if (isHttpError(error, 403) || hasStatus(error, 403)) {
      return {
        status: 'forbidden',
        session: null,
      };
    }

    return {
      status: 'unauthenticated',
      session: null,
    };
  }
}
