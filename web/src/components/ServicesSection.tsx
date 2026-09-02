import { PhotoFrame, Portrait } from "./placeholders";

export default function ServicesSection() {
  return (
    <section
      id="services"
      className="rounded-section bg-forest p-6 sm:p-10 lg:p-14"
    >
      {/* Section header */}
      <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
        Our Service
      </p>
      <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[40px]">
        How the visit works:
        <br />a simple process that puts you first.
      </h2>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">
        From easy scheduling to thoughtful follow-up, every step is clear, calm,
        and centered on you — so you feel heard, supported, and cared for
        without the rush.
      </p>

      {/* Cards */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {/* Primary care — photo card with purple offset */}

        <article className="flex min-h-70 flex-col justify-end rounded-card bg-lime p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-8">
          <h3 className="text-[26px] font-bold leading-[1.15] tracking-tight text-ink">
            Primary Care
          </h3>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
            Care for Your Everyday Health Needs.
          </p>
        </article>

        {/* Urgent care — lime */}
        <article className="flex min-h-70 flex-col justify-end rounded-card bg-lime p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-8">
          <h3 className="text-[26px] font-bold leading-[1.15] tracking-tight text-ink">
            Tests & Medicines
          </h3>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
            Tests only when they change the plan
          </p>
        </article>

        {/* Care coordination — mint */}
        <article className="flex min-h-70 flex-col justify-end rounded-card bg-mint p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-8">
          <h3 className="text-[26px] font-bold leading-[1.15] tracking-tight text-ink">
            Follow-up & Coordination
          </h3>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
            One doctor who remembers your history
          </p>
        </article>
      </div>
    </section>
  );
}
