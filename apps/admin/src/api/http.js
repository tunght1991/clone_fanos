export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    return '';
  }

  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { data: text } : {};
}

export async function requestJson(fetchImpl, baseUrl, path, options = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const response = await fetchImpl(`${normalizedBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new HttpError(
      response.status,
      payload?.error?.message ?? response.statusText ?? 'Request failed',
      payload?.error?.details ?? payload,
    );
  }

  return payload?.data ?? payload;
}

export async function requestEnvelopeJson(fetchImpl, baseUrl, path, options = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const response = await fetchImpl(`${normalizedBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new HttpError(
      response.status,
      payload?.error?.message ?? response.statusText ?? 'Request failed',
      payload?.error?.details ?? payload,
    );
  }

  return payload;
}
