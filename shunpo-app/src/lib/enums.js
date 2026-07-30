// Mirrors the Postgres enums in supabase/migrations/20260721131256_schema_init.sql

export const USER_ROLE = {
  MEMBER: 'member',
  MANAGER: 'manager',
  ADMIN: 'admin',
}

export const USER_ROLE_LABELS = {
  [USER_ROLE.MEMBER]: 'Member',
  [USER_ROLE.MANAGER]: 'Manager',
  [USER_ROLE.ADMIN]: 'Admin',
}

export const RESOURCE_TYPE = {
  OFFICE: 'office',
  ROOM: 'room',
}

export const RESOURCE_TYPES = Object.values(RESOURCE_TYPE)

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED_NOT_CHARGED: 'cancelled_not_charged',
  CANCELLED_CHARGED: 'cancelled_charged',
}

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.CANCELLED_NOT_CHARGED]: 'Cancelled',
  [BOOKING_STATUS.CANCELLED_CHARGED]: 'Cancelled but charged',
}
