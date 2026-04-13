import { type Slot } from '@/lib/constants';

type BookingAvailabilityRow = {
  slot: string;
};

export function isSlotAvailableWithGlobalExclusion(
  bookingsForDate: BookingAvailabilityRow[],
  slot: Slot
): boolean {
  if (slot === 'fullday') {
    return bookingsForDate.length === 0;
  }

  const hasFulldayBooking = bookingsForDate.some((booking) => booking.slot === 'fullday');
  if (hasFulldayBooking) {
    return false;
  }

  const hasSameSlotBooking = bookingsForDate.some((booking) => booking.slot === slot);
  return !hasSameSlotBooking;
}
