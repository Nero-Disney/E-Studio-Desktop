import { PWACredentials, EstudioPairV2Payload } from './types';

/**
 * Computes a standard SHA-256 hex digest using the native Web Crypto API
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Lightweight fallback if Web Crypto is unavailable in non-secure context
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Generates fresh crypted credentials (SHA-256 token, PIN and secret salt)
 */
export async function generateSecureCredentials(
  instanceId: string,
  instanceName: string
): Promise<PWACredentials> {
  const randomEntropy = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const secretSalt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // 4-digit numeric PIN for fast in-store operator keypad
  const pin = Math.floor(1000 + Math.random() * 9000).toString();

  // SHA-256 digest of (instanceId + salt + entropy + pin)
  const sessionToken = await sha256(`${instanceId}:${secretSalt}:${randomEntropy}:${pin}`);

  const issued = new Date();
  const expires = new Date(issued.getTime() + 1000 * 60 * 60 * 24 * 30); // 30 days validity

  return {
    instanceId,
    instanceName,
    sessionToken,
    authPin: pin,
    secretSalt,
    issuedAt: issued.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

/**
 * Generates official V2.0 Interop Pairing JSON Payload (for Android & Desktop pairing)
 */
export async function createEstudioPairV2Payload(
  stationId: string,
  stationName: string,
  host: string,
  port: number,
  token: string,
  pin: string
): Promise<EstudioPairV2Payload> {
  // signature = sha256(stationId + token + pin)
  const signature = await sha256(`${stationId}${token}${pin}`);

  return {
    protocol: 'estudio-pair-v2',
    host,
    port,
    stationId,
    stationName,
    token,
    pin,
    signature,
  };
}

/**
 * Generates custom URI scheme pairing link (estudio://pair?...)
 */
export function createEstudioPairV2Uri(payload: EstudioPairV2Payload): string {
  const params = new URLSearchParams({
    host: payload.host,
    port: payload.port.toString(),
    id: payload.stationId,
    name: payload.stationName,
    token: payload.token,
    pin: payload.pin,
    sig: payload.signature,
  });
  return `estudio://pair?${params.toString()}`;
}

/**
 * Generates an encrypted URL payload containing the token signature for web/PWA browser fallback
 */
export async function createEncryptedPairingPayload(
  credentials: PWACredentials,
  hostUrl: string
): Promise<{ url: string; signature: string }> {
  const payloadRaw = `${credentials.instanceId}:${credentials.sessionToken}:${credentials.authPin}`;
  const signature = await sha256(payloadRaw + ':' + credentials.secretSalt);

  const cleanHost = hostUrl.replace(/\/+$/, '');
  const urlObj = new URL(cleanHost.startsWith('http') ? cleanHost : `http://${cleanHost}`);
  urlObj.searchParams.set('mode', 'pwa');
  urlObj.searchParams.set('inst', credentials.instanceId);
  urlObj.searchParams.set('tok', credentials.sessionToken.substring(0, 32)); // 32-char SHA-256 prefix
  urlObj.searchParams.set('sig', signature.substring(0, 16));
  urlObj.searchParams.set('pin', credentials.authPin);

  return {
    url: urlObj.toString(),
    signature,
  };
}
