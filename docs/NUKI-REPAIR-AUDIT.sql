-- NUKI baseline audit (run before and after /api/admin/repair-nuki-codes)

-- 1) Global status distribution
select
  coalesce(nuki_code_status, 'null') as nuki_code_status,
  count(*) as total
from bookings
group by 1
order by total desc;

-- 2) Active-like bookings with missing auth id
select
  count(*) as missing_auth_id_active_like
from bookings
where nuki_code_status in ('active', 'revoke_failed')
  and access_code is not null
  and nuki_auth_id is null;

-- 3) Duplicate access_code among active-like records
select
  access_code,
  count(*) as total,
  array_agg(id order by date) as booking_ids
from bookings
where nuki_code_status in ('active', 'revoke_failed')
  and access_code is not null
group by access_code
having count(*) > 1
order by total desc;

-- 4) Codes in error state (often useful to inspect)
select
  id,
  date,
  slot,
  status,
  access_code,
  nuki_auth_id,
  nuki_code_status
from bookings
where nuki_code_status = 'error'
order by date desc
limit 200;

-- 5) Recently impacted rows (last 30 days)
select
  id,
  date,
  slot,
  status,
  access_code,
  nuki_auth_id,
  nuki_code_status,
  created_at,
  cancelled_at
from bookings
where created_at >= now() - interval '30 days'
  and nuki_code_status in ('active', 'error', 'revoke_failed', 'revoked')
order by created_at desc
limit 500;
