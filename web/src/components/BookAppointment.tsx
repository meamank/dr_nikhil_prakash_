import { useState } from "react";

const STEPS = [
  { n: "1", title: "Pick a slot" },
  { n: "2", title: "Share details" },
  { n: "3", title: "Meet doctor" },
];

const inputClasses =
  "w-full rounded-2xl border border-ink/10 bg-shell/60 px-4 py-3 text-[15px] text-ink placeholder:text-ink/40 focus:border-forest focus:bg-white focus:outline-none";

export default function BookAppointment() {
  const [sent, setSent] = useState(false);

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
          Tell us when and where — we confirm your slot the same day.
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

      {/* Right — request form */}
      <div className="rounded-card bg-white p-6 text-ink shadow-[0_12px_28px_-6px_rgba(6,34,29,0.35)] sm:p-8">
        {sent ? (
          <div
            role="status"
            className="flex h-full min-h-72 flex-col items-center justify-center text-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-lime text-2xl">
              ✓
            </span>
            <h3 className="mt-4 text-xl font-bold text-forest">
              Request received
            </h3>
            <p className="mt-2 max-w-xs text-[15px] text-ink/70">
              We'll call you shortly to confirm your slot. Thank you!
            </p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div>
              <label
                htmlFor="book-name"
                className="mb-1.5 block text-[13px] font-bold uppercase tracking-wide text-forest"
              >
                Name
              </label>
              <input
                id="book-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your full name"
                className={inputClasses}
              />
            </div>

            <div>
              <label
                htmlFor="book-mobile"
                className="mb-1.5 block text-[13px] font-bold uppercase tracking-wide text-forest"
              >
                Mobile
              </label>
              <input
                id="book-mobile"
                name="mobile"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                placeholder="10-digit mobile number"
                pattern="[0-9+\\-\\s]{10,15}"
                className={inputClasses}
              />
            </div>

            <div>
              <label
                htmlFor="book-address"
                className="mb-1.5 block text-[13px] font-bold uppercase tracking-wide text-forest"
              >
                Address
              </label>
              <textarea
                id="book-address"
                name="address"
                required
                rows={3}
                placeholder="Street, locality, city"
                className={`${inputClasses} resize-none`}
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-pill bg-forest px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
            >
              Request appointment
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
