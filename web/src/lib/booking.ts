/**
 * Booking API client — talks to the Worker (/api/booking/*).
 * Public appointments require WhatsApp OTP verification first.
 *
 * Dev: worker on :8787 next to Astro on :4321.
 * Prod: PUBLIC_API_URL (the worker URL) baked at build time.
 */

const API_BASE =
  (import.meta.env.PUBLIC_API_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:8787" : "");

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export function normalizeMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

export function isValidMobile(input: string): boolean {
  const n = normalizeMobile(input);
  return !!n && /^[6-9]\d{9}$/.test(n);
}

export type ClinicId = "juran_chhapra" | "bhagwanpur";

export function clinicClosureMessage(
  clinic: ClinicId,
  date: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (clinic === "juran_chhapra" && weekday === 6) {
    return "Juran Chhapra clinic is closed on Saturdays";
  }
  if (clinic === "bhagwanpur" && weekday === 0) {
    return "Fardo Gola clinic is closed on Sundays";
  }
  return null;
}

export async function requestBookingOtp(mobile: string, patientName: string) {
  return post<{ ok: true; expiresInSec: number }>("/api/booking/otp/request", {
    mobile,
    patientName,
  });
}

export async function verifyBookingOtp(mobile: string, code: string) {
  return post<{ ok: true; bookingToken: string; mobile: string }>(
    "/api/booking/otp/verify",
    { mobile, code },
  );
}

export async function createBookingAppointment(input: {
  bookingToken: string;
  patientName: string;
  address?: string;
  mobile: string;
  patientGender?: "male" | "female" | "other";
  patientAgeYears?: number;
  clinic: ClinicId;
  date: string; // YYYY-MM-DD, today + 2 days max
}) {
  return post<{
    ok: true;
    appointmentId: string;
    queueNumber: number;
    status: string;
  }>("/api/booking/appointments", input);
}

function todayIST(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

/** Today + 2 days in IST, as YYYY-MM-DD strings for the date picker. */
export function allowedBookingDates(): { min: string; max: string } {
  const min = todayIST();
  return { min, max: addCalendarDays(min, 2) };
}
