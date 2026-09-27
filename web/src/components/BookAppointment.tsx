import { CalendarX2, MapPin } from "lucide-react";

const CLINICS = [
  {
    name: "Juran Chhapra",
    hours: "11 am – 6 pm · Saturday closed",
  },
  {
    name: "Bhagwanpur",
    hours: "7 pm – 10 pm · Sunday closed",
  },
];

export default function BookAppointment() {
  return (
    <section
      id="book"
      aria-labelledby="booking-status-title"
      className="grid gap-8 rounded-section bg-mint px-6 py-10 text-ink sm:px-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-12"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-accent">
          Appointment booking
        </p>
        <h2
          id="booking-status-title"
          className="mt-3 max-w-lg text-3xl font-bold leading-[1.12] tracking-tight text-forest sm:text-4xl"
        >
          Online appointment booking is temporarily paused
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink/70 sm:text-base">
          Appointments cannot be booked through the website right now. Please
          contact the clinic directly for appointment assistance.
        </p>

        <div className="mt-8 space-y-3">
          {CLINICS.map((clinic) => (
            <div
              key={clinic.name}
              className="flex items-start gap-3 rounded-2xl bg-white/55 px-4 py-3"
            >
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-teal-accent"
              />
              <div>
                <p className="font-semibold text-forest">{clinic.name}</p>
                <p className="mt-0.5 text-sm text-ink/60">{clinic.hours}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-72 flex-col items-center justify-center rounded-card bg-white p-6 text-center text-ink shadow-[0_12px_28px_-6px_rgba(6,34,29,0.35)] sm:p-8">
        <span className="grid size-16 place-items-center rounded-full bg-mint text-forest">
          <CalendarX2 aria-hidden="true" className="size-8" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-teal-accent">
          Booking unavailable
        </p>
        <h3 className="mt-2 text-2xl font-bold text-forest">
          We are not accepting online appointments
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/65">
          Online booking will return here when it becomes available again.
        </p>
        <a
          href="#reach"
          className="mt-6 rounded-pill bg-forest px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
        >
          View clinic contact details
        </a>
      </div>
    </section>
  );
}
