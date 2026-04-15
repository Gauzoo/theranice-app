import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminPermission } from '@/lib/adminAuth';
import { deleteNukiKeypadCode } from '@/lib/nuki';
import { type Slot } from '@/lib/constants';
import { getParisNow, hasBookingEndedInParis } from '@/lib/bookingLifecycle';

const NUKI_API_BASE = 'https://api.nuki.io';

interface BookingRow {
  id: string;
  date: string;
  slot: Slot;
  status: string;
  access_code: string | null;
  nuki_auth_id: string | null;
  nuki_code_status: string | null;
}

interface NukiAuthEntry {
  id: string;
  code: string;
  enabled: boolean;
  name?: string;
}

interface BackfillItem {
  bookingId: string;
  code: string;
  authId: string;
  date: string;
  slot: Slot;
}

interface RevokeAction {
  authId: string;
  code: string;
  reason: 'orphan' | 'expired';
  bookingIds: string[];
}

function normalizeCode(code: string | number): string {
  const digits = String(code).replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  return digits.padStart(6, '0');
}

function isBookingExpired(booking: BookingRow, now: Date): boolean {
  return hasBookingEndedInParis(booking.date, booking.slot, now);
}

async function listNukiKeypadAuths(): Promise<NukiAuthEntry[]> {
  const apiToken = process.env.NUKI_API_TOKEN;
  const smartlockId = process.env.NUKI_SMARTLOCK_ID;

  if (!apiToken || !smartlockId) {
    throw new Error('NUKI_API_TOKEN or NUKI_SMARTLOCK_ID missing');
  }

  const response = await fetch(`${NUKI_API_BASE}/smartlock/${smartlockId}/auth?types=13`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nuki list auth failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    return [];
  }

  const parsed: NukiAuthEntry[] = [];
  for (const item of payload as Array<{ id?: string | number; code?: string | number; enabled?: boolean; name?: string }>) {
    if (item.id == null || item.code == null) {
      continue;
    }

    const normalizedCode = normalizeCode(item.code);
    if (!normalizedCode) {
      continue;
    }

    parsed.push({
      id: String(item.id),
      code: normalizedCode,
      enabled: item.enabled !== false,
      name: item.name,
    });
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false;

    const limitRaw = Number(body?.limit ?? 400);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.trunc(limitRaw), 25), 2000)
      : 400;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const [{ data: bookings, error: bookingsError }, nukiAuths] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, date, slot, status, access_code, nuki_auth_id, nuki_code_status')
        .in('nuki_code_status', ['active', 'revoke_failed'])
        .not('access_code', 'is', null),
      listNukiKeypadAuths(),
    ]);

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    const rows = (bookings || []) as BookingRow[];
    const now = new Date();
    const { date: today, minutesSinceMidnight } = getParisNow(now);
    const hour = Math.floor(minutesSinceMidnight / 60);
    const minute = minutesSinceMidnight % 60;

    const bookingsByCode = new Map<string, BookingRow[]>();
    const nukiByCode = new Map<string, NukiAuthEntry[]>();

    for (const auth of nukiAuths) {
      const existing = nukiByCode.get(auth.code) || [];
      existing.push(auth);
      nukiByCode.set(auth.code, existing);
    }

    for (const booking of rows) {
      if (!booking.access_code) continue;
      const normalizedCode = normalizeCode(booking.access_code);
      const existing = bookingsByCode.get(normalizedCode) || [];
      existing.push(booking);
      bookingsByCode.set(normalizedCode, existing);
    }

    const backfillAuthId: BackfillItem[] = [];
    for (const booking of rows) {
      if (booking.nuki_auth_id || !booking.access_code) {
        continue;
      }

      const normalizedCode = normalizeCode(booking.access_code);
      const authCandidates = nukiByCode.get(normalizedCode) || [];
      const auth = authCandidates.find((candidate) => candidate.enabled) || authCandidates[0];
      if (!auth) {
        continue;
      }

      backfillAuthId.push({
        bookingId: booking.id,
        code: normalizedCode,
        authId: auth.id,
        date: booking.date,
        slot: booking.slot,
      });
    }

    const revokeActions: RevokeAction[] = [];
    for (const auth of nukiAuths) {
      const matchingBookings = bookingsByCode.get(auth.code) || [];
      if (matchingBookings.length === 0) {
        revokeActions.push({
          authId: auth.id,
          code: auth.code,
          reason: 'orphan',
          bookingIds: [],
        });
        continue;
      }

      const hasNonExpiredBooking = matchingBookings.some(
        (booking) => !isBookingExpired(booking, now)
      );

      if (!hasNonExpiredBooking) {
        revokeActions.push({
          authId: auth.id,
          code: auth.code,
          reason: 'expired',
          bookingIds: matchingBookings.map((booking) => booking.id),
        });
      }
    }

    const summary = {
      dryRun,
      scope: {
        bookingsScanned: rows.length,
        nukiAuthsScanned: nukiAuths.length,
        parisToday: today,
        parisHour: hour,
        parisMinute: minute,
        previewLimit: limit,
      },
      planned: {
        backfillAuthId: backfillAuthId.length,
        revokeOrphans: revokeActions.filter((a) => a.reason === 'orphan').length,
        revokeExpired: revokeActions.filter((a) => a.reason === 'expired').length,
      },
    };

    if (dryRun) {
      return NextResponse.json({
        ...summary,
        preview: {
          backfillAuthId: backfillAuthId.slice(0, limit),
          revokeActions: revokeActions.slice(0, limit),
        },
      });
    }

    let backfillUpdated = 0;
    let backfillFailed = 0;

    for (const item of backfillAuthId) {
      const { error } = await supabase
        .from('bookings')
        .update({ nuki_auth_id: item.authId })
        .eq('id', item.bookingId);

      if (error) {
        backfillFailed += 1;
      } else {
        backfillUpdated += 1;
      }
    }

    let revoked = 0;
    let revokeFailed = 0;
    const actionDetails: Array<{ authId: string; reason: 'orphan' | 'expired'; success: boolean; error?: string }> = [];

    for (const action of revokeActions) {
      const ok = await deleteNukiKeypadCode(action.authId);

      if (ok) {
        revoked += 1;
        if (action.bookingIds.length > 0) {
          await supabase
            .from('bookings')
            .update({ nuki_code_status: 'revoked', nuki_auth_id: action.authId })
            .in('id', action.bookingIds);
        }

        actionDetails.push({ authId: action.authId, reason: action.reason, success: true });
        continue;
      }

      revokeFailed += 1;
      if (action.bookingIds.length > 0) {
        await supabase
          .from('bookings')
          .update({ nuki_code_status: 'revoke_failed', nuki_auth_id: action.authId })
          .in('id', action.bookingIds);
      }

      actionDetails.push({
        authId: action.authId,
        reason: action.reason,
        success: false,
        error: 'Suppression Nuki non confirmee',
      });
    }

    return NextResponse.json({
      ...summary,
      dryRun: false,
      applied: {
        backfillUpdated,
        backfillFailed,
        revoked,
        revokeFailed,
      },
      details: actionDetails.slice(0, limit),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
