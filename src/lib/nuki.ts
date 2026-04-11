/**
 * Nuki Web API - Intégration Smart Lock Pro + Keypad 2.0
 * 
 * Ce module gère la création et la suppression de codes PIN temporaires
 * sur le keypad Nuki associé à la serrure connectée du local Theranice.
 * 
 * API Docs: https://api.nuki.io/
 * Auth: Bearer Token (API Key Token)
 */

const NUKI_API_BASE = 'https://api.nuki.io';
const FIND_AUTH_RETRY_DELAYS_MS = [200, 400, 700];
const AVAILABILITY_RETRY_DELAYS_MS = [200, 400];

import { NUKI_SLOT_TIMES } from '@/lib/constants';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePinCode(code: number | string): string {
  const digits = String(code).replace(/\D/g, '');
  return digits.padStart(6, '0');
}

/**
 * Génère un code PIN aléatoire de 6 chiffres.
 * Évite les codes triviaux (000000, 111111, 123456, etc.)
 */
export function generatePinCode(): number {
  const trivialCodes = [
    0, 111111, 222222, 333333, 444444, 555555,
    666666, 777777, 888888, 999999,
    123456, 654321, 123123, 112233,
  ];
  
  let code: number;
  do {
    // Génère un nombre entre 100000 et 999999
    code = Math.floor(100000 + Math.random() * 900000);
  } while (trivialCodes.includes(code));
  
  return code;
}

/**
 * Formate un code PIN en string lisible (ex: "482 591")
 */
export function formatPinCode(code: number | string): string {
  const str = String(code).padStart(6, '0');
  return `${str.slice(0, 3)} ${str.slice(3)}`;
}

interface NukiAuthResult {
  success: boolean;
  authId?: string;
  code?: number;
  error?: string;
}

interface NukiProvisionResult {
  success: boolean;
  code?: number;
  authId?: string;
  error?: string;
  attempts: number;
}

/**
 * Crée une autorisation keypad temporaire sur la serrure Nuki.
 * 
 * @param name - Nom de l'autorisation (ex: "Booking-abc123 Martin")
 * @param code - Code PIN 6 chiffres
 * @param date - Date de la réservation (YYYY-MM-DD)
 * @param slot - Créneau (morning, afternoon, fullday)
 * @returns L'ID de l'autorisation créée
 */
export async function createNukiKeypadCode(
  name: string,
  code: number,
  date: string,
  slot: string
): Promise<NukiAuthResult> {
  const apiToken = process.env.NUKI_API_TOKEN;
  const smartlockId = process.env.NUKI_SMARTLOCK_ID;

  if (!apiToken || !smartlockId) {
    console.error('Nuki API not configured: NUKI_API_TOKEN or NUKI_SMARTLOCK_ID missing');
    return { success: false, error: 'Nuki API not configured' };
  }

  const slotTime = NUKI_SLOT_TIMES[slot as keyof typeof NUKI_SLOT_TIMES];
  if (!slotTime) {
    return { success: false, error: `Invalid slot: ${slot}` };
  }

  // Construit les dates de validité
  // allowedFromDate: début de la journée de réservation
  // allowedUntilDate: fin de la journée de réservation
  const allowedFromDate = `${date}T00:00:00.000Z`;
  const allowedUntilDate = `${date}T23:59:59.000Z`;

  const body = {
    name: name.substring(0, 32), // Max 32 chars pour Nuki
    type: 13,                    // 13 = keypad code
    code: code,
    remoteAllowed: true,
    enabled: true,
    allowedFromDate,
    allowedUntilDate,
    allowedFromTime: slotTime.from,
    allowedUntilTime: slotTime.until,
    // NOTE: Ne PAS envoyer allowedWeekDays - provoque un échec silencieux
    // avec les comptes B2C (subscription INACTIVE). Les dates from/until
    // suffisent pour limiter la validité du code.
  };

  try {
    console.log(`[Nuki] Creating keypad code for ${name} on ${date} (${slot})`);
    
    const response = await fetch(
      `${NUKI_API_BASE}/smartlock/${smartlockId}/auth`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Nuki] API error ${response.status}:`, errorText);
      return { 
        success: false, 
        error: `Nuki API error ${response.status}: ${errorText}` 
      };
    }

    // L'API retourne 204 Ok sans body, ou 200 avec le résultat
    // Pour récupérer l'authId, on doit lister les auths et trouver celui qu'on vient de créer
    // Ou si la réponse contient des données, on les utilise
    if (response.status === 204) {
      console.log(`[Nuki] Keypad code created successfully (204 No Content)`);
      const resolvedAuthId = await findAuthByCode(code);

      if (!resolvedAuthId) {
        console.warn(`[Nuki] Code ${formatPinCode(code)} created but authId could not be resolved yet`);
      }

      return { success: true, authId: resolvedAuthId || undefined, code };
    }

    // Certaines versions de l'API retournent le résultat
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const result = await response.json();
      console.log(`[Nuki] Keypad code created successfully:`, result);
      const directAuthId = result.id || result.authId;
      const authId = directAuthId ? String(directAuthId) : await findAuthByCode(code);

      return { 
        success: true, 
        authId: authId || undefined,
        code 
      };
    }

    console.log(`[Nuki] Keypad code created (status ${response.status})`);
    const fallbackAuthId = await findAuthByCode(code);
    return { success: true, authId: fallbackAuthId || undefined, code };

  } catch (error) {
    console.error('[Nuki] Network error creating keypad code:', error);
    return { 
      success: false, 
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` 
    };
  }
}

/**
 * Recherche l'auth ID d'un code keypad qu'on vient de créer.
 */
async function findAuthByCode(code: number): Promise<string | null> {
  const apiToken = process.env.NUKI_API_TOKEN;
  const smartlockId = process.env.NUKI_SMARTLOCK_ID;

  if (!apiToken || !smartlockId) return null;

  const normalizedCode = normalizePinCode(code);

  for (let attempt = 0; attempt < FIND_AUTH_RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(
        `${NUKI_API_BASE}/smartlock/${smartlockId}/auth?types=13`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
        }
      );

      if (response.ok) {
        const auths = await response.json();
        const match = Array.isArray(auths)
          ? auths.find((a: { code?: number | string; id?: string | number }) => {
              if (a.code == null) return false;
              return normalizePinCode(a.code) === normalizedCode;
            })
          : null;

        if (match?.id != null) {
          return String(match.id);
        }
      }
    } catch {
      // Best effort only, we'll retry shortly.
    }

    const delay = FIND_AUTH_RETRY_DELAYS_MS[attempt];
    if (attempt < FIND_AUTH_RETRY_DELAYS_MS.length - 1 && delay > 0) {
      await wait(delay);
    }
  }

  return null;
}

export async function findNukiAuthIdByAccessCode(
  accessCode: string | number | null | undefined
): Promise<string | null> {
  if (accessCode == null) return null;

  const digits = String(accessCode).replace(/\D/g, '');
  if (!digits) return null;

  const numericCode = Number.parseInt(digits, 10);
  if (!Number.isFinite(numericCode)) return null;

  return findAuthByCode(numericCode);
}

/**
 * Supprime (révoque) une autorisation keypad de la serrure Nuki.
 * Appelé après expiration de la réservation ou annulation.
 * 
 * @param authId - L'ID unique de l'autorisation à supprimer
 */
export async function deleteNukiKeypadCode(authId: string): Promise<boolean> {
  const apiToken = process.env.NUKI_API_TOKEN;
  const smartlockId = process.env.NUKI_SMARTLOCK_ID;

  if (!apiToken || !smartlockId) {
    console.error('[Nuki] API not configured');
    return false;
  }

  try {
    console.log(`[Nuki] Deleting keypad auth: ${authId}`);

    const response = await fetch(
      `${NUKI_API_BASE}/smartlock/${smartlockId}/auth/${authId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    if (response.ok || response.status === 204) {
      console.log(`[Nuki] Auth ${authId} deleted successfully`);
      return true;
    }

    console.error(`[Nuki] Delete failed with status ${response.status}`);
    return false;
  } catch (error) {
    console.error('[Nuki] Network error deleting auth:', error);
    return false;
  }
}

/**
 * Vérifie qu'un code PIN n'est pas déjà utilisé sur la serrure.
 */
export async function isCodeAvailableOnNuki(code: number): Promise<boolean> {
  const apiToken = process.env.NUKI_API_TOKEN;
  const smartlockId = process.env.NUKI_SMARTLOCK_ID;

  if (!apiToken || !smartlockId) return true; // Skip check if not configured

  let lastError: string | null = null;
  const normalizedCode = normalizePinCode(code);

  for (let attempt = 0; attempt <= AVAILABILITY_RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(
        `${NUKI_API_BASE}/smartlock/${smartlockId}/auth?types=13`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
        }
      );

      if (response.ok) {
        const auths = await response.json();
        const codeExists = Array.isArray(auths) && auths.some(
          (a: { code?: number | string; enabled?: boolean }) => {
            if (a.code == null) return false;
            const enabled = a.enabled !== false;
            return enabled && normalizePinCode(a.code) === normalizedCode;
          }
        );

        return !codeExists;
      }

      lastError = `Nuki availability check failed with status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown availability check error';
    }

    const delay = AVAILABILITY_RETRY_DELAYS_MS[attempt];
    if (delay) {
      await wait(delay);
    }
  }

  throw new Error(lastError || 'Unable to verify code availability on Nuki');
}

/**
 * Génère un code PIN unique (vérifie en BDD et sur Nuki).
 * 
 * @param supabase - Client Supabase avec service role
 * @returns Un code PIN garanti unique
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateUniquePinCode(
  supabase: any
): Promise<number> {
  const maxAttempts = 20;
  
  for (let i = 0; i < maxAttempts; i++) {
    const code = generatePinCode();
    
    // Vérifie en BDD qu'aucune réservation active n'utilise ce code
    const { data: existing } = await supabase
      .from('bookings')
      .select('access_code')
      .in('nuki_code_status', ['active', 'error', 'revoke_failed'])
      .not('access_code', 'is', null);
    
    const codeStr = normalizePinCode(code);
    const dbConflict = existing?.some((b: { access_code: string }) => {
      if (!b.access_code) return false;
      return normalizePinCode(b.access_code) === codeStr;
    });
    
    if (!dbConflict) {
      try {
        const nukiAvailable = await isCodeAvailableOnNuki(code);
        if (nukiAvailable) {
          return code;
        }
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error(
            `[Nuki] Impossible de vérifier l'unicité du code PIN: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
          );
        }
      }
    }
  }
  
  throw new Error('[Nuki] Impossible de générer un code PIN unique après plusieurs tentatives');
}

function isNukiCodeConflictError(errorMessage?: string): boolean {
  if (!errorMessage) return false;

  const lowerError = errorMessage.toLowerCase();
  return (
    lowerError.includes("parameter 'code' is not valid") ||
    (lowerError.includes('code') && lowerError.includes('not valid')) ||
    (lowerError.includes('code') && lowerError.includes('already')) ||
    lowerError.includes('duplicate')
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function provisionNukiKeypadCode(
  supabase: any,
  name: string,
  date: string,
  slot: string,
  maxAttempts = 4
): Promise<NukiProvisionResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let pinCode: number;

    try {
      pinCode = await generateUniquePinCode(supabase);
    } catch (error) {
      const generationError = error instanceof Error ? error.message : 'PIN generation failed';
      return {
        success: false,
        error: generationError,
        attempts: attempt,
      };
    }

    const createResult = await createNukiKeypadCode(name, pinCode, date, slot);

    if (createResult.success) {
      return {
        success: true,
        code: pinCode,
        authId: createResult.authId,
        attempts: attempt,
      };
    }

    lastError = createResult.error;
    if (!isNukiCodeConflictError(createResult.error)) {
      return {
        success: false,
        code: pinCode,
        error: createResult.error,
        attempts: attempt,
      };
    }

    console.warn(`[Nuki] PIN ${formatPinCode(pinCode)} rejected by API, retrying (${attempt}/${maxAttempts})`);
  }

  return {
    success: false,
    error: lastError || '[Nuki] Failed to create keypad code after retries',
    attempts: maxAttempts,
  };
}
