import { PhoneIcon, SunRays } from "./icons";
import { PhotoFrame } from "./placeholders";

const CREDENTIALS = [
  { label: "MBBS", detail: "AFMC, Pune" },
  { label: "MD", detail: "Research & Referral, Delhi" },
  { label: "Ex-Army", detail: "Major, Indian Army" },
  { label: "Specialist", detail: "Stomach · Kidney · Arthritis" },
];

export default function TrustedNetwork() {
  return (
    <section
      id="about"
      className="grid items-center gap-8 py-6 lg:grid-cols-2 lg:gap-12 lg:py-10"
    >
      {/* Copy */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-accent">
          About doctor
        </p>
        <h2 className="mt-3 max-w-md text-3xl font-bold leading-[1.12] tracking-tight text-forest sm:text-4xl">
          The doctor, not the queue.
        </h2>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink sm:text-base">
          Most visits to a doctor end before they begin — three minutes, a
          scribbled slip, and a doorway. This practice is built the other way
          around: enough time to hear the whole story, and the patience to treat
          the person, not just the report.
        </p>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink/70 sm:text-base">
          Dr. (Maj) Nikhil Prakash practises general medicine — the everyday,
          first-line kind. Fevers that won't settle, blood pressures that creep,
          sugars that drift. The work is careful diagnosis, honest explanation,
          and the smallest effective treatment.
        </p>

        {/* Credentials */}
        <dl className="mt-7 grid max-w-lg grid-cols-2 gap-3">
          {CREDENTIALS.map(({ label, detail }) => (
            <div key={label} className="rounded-card bg-mint px-4 py-3 sm:px-5">
              <dt className="text-[13px] font-bold uppercase tracking-wide text-forest">
                {label}
              </dt>
              <dd className="mt-0.5 text-sm text-ink/70">{detail}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex flex-wrap items-center gap-5">
          <a
            href="#book"
            className="rounded-pill bg-forest px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
          >
            Book an appointment
          </a>
          <a
            href="tel:+919801317878"
            className="flex items-center gap-2 text-[15px] font-semibold text-teal-accent transition-opacity hover:opacity-75"
          >
            <PhoneIcon className="h-4 w-4" />
            98013 17878
          </a>
        </div>
      </div>

      {/* Photo panel */}
      <div className="relative rounded-4xl bg-mint p-4 sm:p-6">
        <SunRays className="absolute -top-2 right-4 h-14 w-14 text-mint-deep sm:right-8" />
        <PhotoFrame className="aspect-4/3 rounded-[26px]">
          <div className="h-full overflow-hidden bg-mint">
            <img
              src="/images/portrait.svg"
              alt="Dr. (Maj) Nikhil Prakash — Consultant Physician"
              className="h-full w-full object-cover object-top"
            />
          </div>
        </PhotoFrame>
      </div>
    </section>
  );
}
