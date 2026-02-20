export const GUEST_RESERVATION_COOKIE_PREFIX = "guest_reservation_";

export function getGuestReservationCookieName(appointmentId: string): string {
  return `${GUEST_RESERVATION_COOKIE_PREFIX}${appointmentId}`;
}

export function getGuestReservationCookieMaxAgeSeconds(
  reservationDurationMinutes: number,
): number {
  const minutes =
    Number.isFinite(reservationDurationMinutes) && reservationDurationMinutes > 0
      ? reservationDurationMinutes
      : 10;
  return Math.floor(minutes * 60);
}
