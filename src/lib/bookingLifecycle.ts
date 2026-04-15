import { SLOT_OPERATIONAL_CUTOFF_MINUTES, type Slot } from '@/lib/constants';

const PARIS_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface ParisNowSnapshot {
  date: string;
  minutesSinceMidnight: number;
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const value = parts.find((part) => part.type === type)?.value;
  if (value) {
    return value;
  }

  return type === 'year' ? '1970' : '00';
}

export function isKnownSlot(slot: string): slot is Slot {
  return slot === 'morning' || slot === 'afternoon' || slot === 'fullday';
}

export function getParisNow(now: Date = new Date()): ParisNowSnapshot {
  const parts = PARIS_DATE_TIME_FORMATTER.formatToParts(now);
  const year = getPart(parts, 'year');
  const month = getPart(parts, 'month');
  const day = getPart(parts, 'day');
  const hour = Number.parseInt(getPart(parts, 'hour'), 10);
  const minute = Number.parseInt(getPart(parts, 'minute'), 10);

  return {
    date: `${year}-${month}-${day}`,
    minutesSinceMidnight: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
  };
}

export function hasBookingEndedInParis(
  bookingDate: string,
  slot: Slot,
  now: Date = new Date()
): boolean {
  const parisNow = getParisNow(now);

  if (bookingDate < parisNow.date) {
    return true;
  }

  if (bookingDate > parisNow.date) {
    return false;
  }

  const cutoffMinutes = SLOT_OPERATIONAL_CUTOFF_MINUTES[slot] ?? 22 * 60;
  return parisNow.minutesSinceMidnight >= cutoffMinutes;
}
