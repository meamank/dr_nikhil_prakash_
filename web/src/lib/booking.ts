/**
 * Booking API client — talks to the Worker (/api/booking/*).
 * OTP is STUBBED: no verification step, book directly.
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

export async function createBookingAppointment(input: {
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

/** Today + 2 days in IST, as YYYY-MM-DD strings for the date picker. */
export function allowedBookingDates(): { min: string; max: string } {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const min = ist.toISOString().slice(0, 10);
  const maxD = new Date(ist.getTime() + 2 * 24 * 60 * 60 * 1000);
  return { min, max: maxD.toISOString().slice(0, 10) };
}
