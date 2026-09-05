import { useState } from "react";
import {
  allowedBookingDates,
  createBookingAppointment,
  isValidMobile,
  type ClinicId,
} from "../lib/booking";

const STEPS = [
  { n: "1", title: "Share details" },
  { n: "2", title: "Get queue number" },
  { n: "3", title: "Meet doctor" },
];

const CLINICS: { id: ClinicId; label: string; hours: string }[] = [
  {
    id: "juran_chhapra",
    label: "Juran Chhapra",
    hours: "11 am – 6 pm · Sat closed",
  },
  { id: "bhagwanpur", label: "Bhagwanpur", hours: "7 pm – 10 pm · Daily" },
];

const inputClasses =
  "w-full rounded-2xl border border-ink/10 bg-shell/60 px-4 py-3 text-[15px] text-ink placeholder:text-ink/40 focus:border-forest focus:bg-white focus:outline-none";

const labelClasses =
  "mb-1.5 block text-[13px] font-bold uppercase tracking-wide text-forest";

export default function BookAppointment() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female" | "other">("");
  const [clinic, setClinic] = useState<ClinicId>("juran_chhapra");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    queueNumber: number;
    date: string;
    clinicLabel: string;
  } | null>(null);

  const { min, max } = allowedBookingDates();
  const [date, setDate] = useState(min);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Enter the patient's full name");
      return;
    }
    if (!isValidMobile(mobile)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    if (!date) {
      setError("Pick a date (today + next 2 days)");
      return;
    }
    const ageNum = age.trim() === "" ? undefined : Number(age);
    if (
      ageNum !== undefined &&
      (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 130)
    ) {
      setError("Enter a valid age");
      return;
    }
    setBusy(true);
    try {
      const res = await createBookingAppointment({
        patientName: name.trim(),
        address: address.trim() || undefined,
        mobile: mobile.trim(),
        patientGender: gender || undefined,
        patientAgeYears: ageNum,
        clinic,
        date,
      });
      setResult({
        queueNumber: res.queueNumber,
        date,
        clinicLabel: CLINICS.find((c) => c.id === clinic)?.label ?? clinic,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Booking failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="book"
      className="grid gap-8 rounded-section bg-mint px-6 py-10 text-ink sm:px-10 sm:py-14 lg:grid-cols-2 lg:gap-12"
    >
      {/* Left — pitch + steps */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-accent">
          Book appointment
        </p>
        <h2 className="mt-3 max-w-md text-3xl font-bold leading-[1.12] tracking-tight text-forest sm:text-4xl">
          Booking takes two minutes
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink/70 sm:text-base">
          Tell us when and where — get your queue number instantly.
        </p>

        <ol className="mt-8 space-y-4">
          {STEPS.map(({ n, title }) => (
            <li key={n} className="flex items-center gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest text-base font-extrabold text-lime">
                {n}
              </span>
              <span className="text-lg font-semibold text-forest sm:text-xl">
                {title}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Right — booking form */}
      <div className="rounded-card bg-white p-6 text-ink shadow-[0_12px_28px_-6px_rgba(6,34,29,0.35)] sm:p-8">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        {result ? (
          <div
            role="status"
            className="flex h-full min-h-72 flex-col items-center justify-center text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-accent">
              Booking confirmed
            </p>
            <p className="mt-3 text-[15px] text-ink/70">Your queue number</p>
            <p className="mt-1 text-7xl font-extrabold tabular-nums text-forest">
              {result.queueNumber}
            </p>
            <p className="mt-3 max-w-xs text-[15px] text-ink/70">
              {result.clinicLabel} · {result.date}
            </p>
            <p className="mt-2 max-w-xs text-[13px] text-ink/55">
              Show this at the clinic counter. Your PID is issued when you pay.
            </p>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setName("");
                setAddress("");
                setMobile("");
                setAge("");
                setGender("");
                setDate("");
              }}
              className="mt-6 text-sm font-semibold text-teal-accent underline-offset-4 hover:underline"
            >
              Book another appointment
            </button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <div>
              <label htmlFor="book-name" className={labelClasses}>
                Name
              </label>
              <input
                id="book-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Patient's full name"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="book-address" className={labelClasses}>
                Address
              </label>
              <textarea
                id="book-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, locality, city"
                className={`${inputClasses} resize-none`}
              />
            </div>

            <div>
              <span className={labelClasses}>Clinic</span>
              <div className="grid gap-2">
                {CLINICS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClinic(c.id)}
                    aria-pressed={clinic === c.id}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      clinic === c.id
                        ? "border-forest bg-mint"
                        : "border-ink/10 bg-shell/60 hover:border-forest"
                    }`}
                  >
                    <span className="block text-[15px] font-bold text-forest">
                      {c.label}
                    </span>
                    <span className="block text-[13px] text-ink/55">
                      {c.hours}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="book-date" className={labelClasses}>
                Date
              </label>
              <input
                id="book-date"
                type="date"
                required
                value={date}
                min={min}
                max={max}
                onChange={(e) => setDate(e.target.value)}
                className={inputClasses}
              />
              <p className="mt-2 text-[13px] text-ink/55">
                Booking open for today and the next 2 days.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="book-mobile" className={labelClasses}>
                  Mobile
                </label>
                <input
                  id="book-mobile"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="book-age" className={labelClasses}>
                  Age
                </label>
                <input
                  id="book-age"
                  type="number"
                  min={0}
                  max={130}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Years"
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <span className={labelClasses}>Gender</span>
              <div className="flex gap-2">
                {(["male", "female", "other"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(gender === g ? "" : g)}
                    aria-pressed={gender === g}
                    className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold capitalize transition-colors ${
                      gender === g
                        ? "border-forest bg-forest text-white"
                        : "border-ink/10 bg-shell/60 text-ink hover:border-forest"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 rounded-pill bg-forest px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:opacity-60"
            >
              {busy ? "Booking…" : "Book appointment"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
