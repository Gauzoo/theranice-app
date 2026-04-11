-- Prevent duplicate confirmed bookings for the same room and slot.
-- Run this in Supabase SQL editor.

-- 1) Audit duplicates before creating the unique index.
select
  date,
  slot,
  room,
  count(*) as duplicates
from bookings
where status = 'confirmed'
group by date, slot, room
having count(*) > 1
order by date, slot, room;

-- 2) Optional cleanup if duplicates are found.
-- Keeps the oldest booking (rn = 1) and cancels the rest.
-- Review the result of step 1 before running this block.
with ranked_duplicates as (
  select
    id,
    row_number() over (
      partition by date, slot, room
      order by created_at asc, id asc
    ) as rn
  from bookings
  where status = 'confirmed'
)
update bookings b
set status = 'cancelled'
from ranked_duplicates r
where b.id = r.id
  and r.rn > 1;

-- 3) Add a partial unique index to enforce the invariant at DB level.
create unique index if not exists bookings_unique_confirmed_date_slot_room_idx
  on bookings (date, slot, room)
  where status = 'confirmed';

-- 4) Validate that no duplicates remain.
select
  date,
  slot,
  room,
  count(*) as duplicates
from bookings
where status = 'confirmed'
group by date, slot, room
having count(*) > 1;
