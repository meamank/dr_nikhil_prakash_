import { useState } from "react";
import { PhotoFrame, Portrait } from "./placeholders";

const TABS = [
  "Primary Care",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Dental Care",
  "Telehealth",
  "Mental Health",
  "ENT",
] as const;

const CARD_STYLES = ["bg-lime", "bg-white", "bg-mint-soft", "bg-mint"];

type Doctor = { name: string; role: string };

const BASE_DOCTORS: Doctor[] = [
  { name: "Dr. Olivia Lim, M.Ord.", role: "Surgery Specialist" },
  { name: "Dr. Pimple Popper.", role: "Psychiatrist" },
  { name: "Dr. Sherry Ross.", role: "Gynecologist" },
  { name: "Dr. Jen Gunter", role: "Neurologies" },
];

function doctorsForTab(tab: string): Doctor[] {
  if (tab === "Primary Care") return BASE_DOCTORS;
  return BASE_DOCTORS.map((doc, i) => ({
    name: doc.name,
    role: `${TABS[i % TABS.length]} Specialist`,
  }));
}

export default function DoctorsSection() {
  const [active, setActive] = useState<string>("Primary Care");
  const doctors = doctorsForTab(active);
  const activeIndex = TABS.indexOf(active as (typeof TABS)[number]);

  return (
    <section id="doctors" className="py-6 lg:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-forest sm:text-4xl">
            Meet Our Trusted Doctors
          </h2>
          <p className="mt-2 text-[15px] text-ink/65">
            Personalized Care From Experienced Specialists.
          </p>
        </div>
        <a
          href="#"
          className="rounded-pill border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-forest hover:text-forest"
        >
          View All Services
        </a>
      </div>

      {/* Category tabs */}
      <div
        className="tab-rail mt-8 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Doctor specialties"
      >
        {TABS.map((tab) => {
          const isActive = tab === active;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab)}
              className={`shrink-0 rounded-pill px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-forest font-semibold text-white"
                  : "text-ink/45 hover:text-forest"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Doctor cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {doctors.map((doc, i) => (
          <article
            key={`${active}-${doc.name}`}
            className={`group rounded-[26px] p-3 transition-transform duration-300 hover:-translate-y-1 ${CARD_STYLES[i % CARD_STYLES.length]}`}
          >
            <PhotoFrame className="aspect-[4/5] rounded-[20px]">
              <div className="grid h-full place-items-end justify-center">
                <Portrait tone="coat" className="h-[88%] w-auto" />
              </div>
            </PhotoFrame>
            <div className="px-2 pb-2 pt-4">
              <h3 className="text-[17px] font-bold text-ink">{doc.name}</h3>
              <p className="mt-0.5 text-sm text-ink/60">({doc.role})</p>
            </div>
          </article>
        ))}
      </div>

      {/* Carousel progress */}
      <div className="mt-8 h-1 w-full overflow-hidden rounded-pill bg-ink/10">
        <div
          className="h-full rounded-pill bg-teal-accent transition-all duration-300"
          style={{ width: `${((activeIndex + 1) / TABS.length) * 100}%` }}
        />
      </div>
    </section>
  );
}
