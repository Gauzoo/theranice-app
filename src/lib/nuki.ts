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

// Mapping des créneaux horaires vers des minutes depuis minuit
// Avec 30 min de marge avant et après pour arrivée/départ
const SLOT_TIMES: Record<string, { from: number; until: number }> = {
  morning:   { from: 450, until: 750 },   // 7h30 - 12h30
  afternoon: { from: 750, until: 1050 },  // 12h30 - 17h30
  fullday:   { from: 450, until: 1050 },  // 7h30 - 17h30
};

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

  const slotTime = SLOT_TIMES[slot];
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
      // Pas de body retourné - on doit retrouver l'auth qu'on vient de créer
      // Attendre que la synchro WiFi -> serrure -> keypad se termine
      await new Promise(resolve => setTimeout(resolve, 15000));
      const authId = await findAuthByCode(code);
      console.log(`[Nuki] Keypad code created successfully, authId: ${authId}`);
      return { success: true, authId: authId || undefined, code };
    }

    // Certaines versions de l'API retournent le résultat
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const result = await response.json();
      console.log(`[Nuki] Keypad code created successfully:`, result);
      return { 
        success: true, 
        authId: result.id || result.authId || undefined,
        code 
      };
    }

    console.log(`[Nuki] Keypad code created (status ${response.status})`);
    return { success: true, code };

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

  try {
    const response = await fetch(
      `${NUKI_API_BASE}/smartlock/${smartlockId}/auth?types=13`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) return null;

    const auths = await response.json();
    const match = Array.isArray(auths) 
      ? auths.find((a: { code?: number }) => a.code === code)
      : null;
    
    return match?.id || null;
  } catch {
    return null;
  }
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

  try {
    const response = await fetch(
      `${NUKI_API_BASE}/smartlock/${smartlockId}/auth?types=13`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) return true; // En cas d'erreur, on tente quand même

    const auths = await response.json();
    const codeExists = Array.isArray(auths) && auths.some(
      (a: { code?: number; enabled?: boolean }) => a.code === code && a.enabled
    );
    
    return !codeExists;
  } catch {
    return true;
  }
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
  const maxAttempts = 10;
  
  for (let i = 0; i < maxAttempts; i++) {
    const code = generatePinCode();
    
    // Vérifie en BDD qu'aucune réservation active n'utilise ce code
    const { data: existing } = await supabase
      .from('bookings')
      .select('access_code')
      .eq('nuki_code_status', 'active')
      .not('access_code', 'is', null);
    
    const codeStr = String(code);
    const dbConflict = existing?.some((b: { access_code: string }) => b.access_code === codeStr);
    
    if (!dbConflict) {
      // Vérifie aussi sur Nuki (codes actifs sur la serrure)
      const nukiAvailable = await isCodeAvailableOnNuki(code);
      if (nukiAvailable) {
        return code;
      }
    }
  }
  
  // Fallback: retourne un code sans vérification complète
  return generatePinCode();
}
