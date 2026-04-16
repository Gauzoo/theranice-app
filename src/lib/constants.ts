// ============================================================================
// Source unique de vérité pour toutes les constantes de l'application Theranice
// ============================================================================

// --- Types ---

export type Slot = 'morning' | 'afternoon' | 'fullday';
export type Room = 'room1' | 'room2' | 'large';

// --- Prix (en euros, HT) ---

export const MORNING_PRICES: Record<Room, number> = {
  room1: 30,
  room2: 30,
  large: 70,
};

export const AFTERNOON_PRICES: Record<Room, number> = {
  room1: 40,
  room2: 40,
  large: 70,
};

export const FULLDAY_PRICES: Record<Room, number> = {
  room1: 65,
  room2: 65,
  large: 130,
};

export function getPrice(slot: Slot, room: Room): number {
  if (slot === 'fullday') return FULLDAY_PRICES[room];
  if (slot === 'morning') return MORNING_PRICES[room];
  return AFTERNOON_PRICES[room];
}

// --- Labels salles ---

/** Labels courts pour l'affichage courant */
export const ROOM_LABELS: Record<Room, string> = {
  room1: 'Athéna',
  room2: 'Gaïa',
  large: 'Grande salle',
};

/** Labels formels pour factures et emails */
export const ROOM_LABELS_FORMAL: Record<Room, string> = {
  room1: 'Salon Athéna',
  room2: 'Salle Gaïa',
  large: 'Grande salle',
};

// --- Labels créneaux ---

/** Labels complets avec horaires */
export const SLOT_LABELS: Record<Slot, string> = {
  morning: 'Matin (7h30-13h)',
  afternoon: 'Après-midi (13h30-20h30)',
  fullday: 'Journée complète (7h30-20h30)',
};

/** Labels courts pour factures/récapitulatifs */
export const SLOT_LABELS_SHORT: Record<Slot, string> = {
  morning: '7h30 – 13h',
  afternoon: '13h30 – 20h30',
  fullday: '7h30 – 20h30',
};

/** Horaires d'accès réels (avec 30 min de marge) pour emails/réservations */
export const SLOT_ACCESS_TIMES: Record<Slot, string> = {
  morning: '7h – 13h30',
  afternoon: '13h – 21h',
  fullday: '7h – 21h',
};

// --- Config horaires (serveur) ---

/** Heure de début de chaque créneau (pour validation) */
export const SLOT_START_HOURS: Record<Slot, number> = {
  morning: 7,
  afternoon: 13,
  fullday: 7,
};

/** Heure de fin + marge pour crons (révocation Nuki, génération factures) */
export const SLOT_END_HOURS: Record<Slot, number> = {
  morning: 14,
  afternoon: 22,
  fullday: 22,
};

/** Heure de fin métier des créneaux (Paris) en minutes depuis minuit */
export const SLOT_END_MINUTES: Record<Slot, number> = {
  morning: 13 * 60,
  afternoon: 20 * 60 + 30,
  fullday: 20 * 60 + 30,
};

/**
 * Cutoff de fin de disponibilité opérationnelle (Paris) utilisé pour
 * la bascule à venir/passée et la révocation Nuki.
 */
export const SLOT_OPERATIONAL_CUTOFF_MINUTES: Record<Slot, number> = {
  morning: 13 * 60 + 30,
  afternoon: 22 * 60,
  fullday: 22 * 60,
};

/** Minutes depuis minuit pour l'API Nuki (avec 30 min de marge avant/après) */
export const NUKI_SLOT_TIMES: Record<Slot, { from: number; until: number }> = {
  morning:   { from: 420, until: 810 },   // 7h00 - 13h30
  afternoon: { from: 780, until: 1260 },  // 13h00 - 21h00
  fullday:   { from: 420, until: 1260 },  // 7h00 - 21h00
};

// --- Business ---

export const BUSINESS_NAME = 'Théranice';
export const BUSINESS_LEGAL_NAME = 'THERANICE';
export const BUSINESS_ADDRESS = '19 rue Michelet';
export const BUSINESS_CITY = 'Nice';
export const BUSINESS_POSTAL_CODE = '06100';
export const BUSINESS_REGION = 'Provence-Alpes-Côte d\'Azur';
export const BUSINESS_COUNTRY = 'FR';
export const BUSINESS_FULL_ADDRESS = `${BUSINESS_ADDRESS} – ${BUSINESS_POSTAL_CODE} ${BUSINESS_CITY}`;
export const BUSINESS_PHONE = '+33 6 65 46 26 42';
export const CONTACT_EMAIL = 'contact@theranice.fr';
export const SITE_URL = 'https://theranice.fr';
export const OPENING_HOURS = '7h30 à 20h30';
export const OPENING_HOURS_SCHEMA = 'Mo-Sa 07:30-20:30';

// --- Emails ---

/** Adresse d'expédition Resend — à passer sur le domaine vérifié quand configuré */
export const EMAIL_FROM = 'Theranice <contact@theranice.fr>';

// --- Politiques ---

export const CANCELLATION_PERIOD_DAYS = 14;

/** Durée maximale (minutes) d'un verrou temporaire pending_payment avant nettoyage/fallback */
export const PENDING_PAYMENT_TTL_MINUTES = 45;
