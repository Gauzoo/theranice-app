import { NextRequest } from 'next/server';

const INTERNAL_API_HEADER = 'x-internal-api-key';

function resolveInternalSecret(): string | null {
  const configured = process.env.INTERNAL_API_SECRET?.trim();
  if (configured) {
    return configured;
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  return cronSecret || null;
}

export function isInternalApiRequest(request: NextRequest): boolean {
  const secret = resolveInternalSecret();
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  const headerSecret = request.headers.get(INTERNAL_API_HEADER)?.trim();
  if (headerSecret && headerSecret === secret) {
    return true;
  }

  const authorization = request.headers.get('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim() === secret;
  }

  return false;
}

export function getInternalApiHeaders(): Record<string, string> {
  const secret = resolveInternalSecret();
  if (!secret) {
    return {};
  }

  return {
    [INTERNAL_API_HEADER]: secret,
  };
}
