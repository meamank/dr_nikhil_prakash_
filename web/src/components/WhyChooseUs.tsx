import { ArrowRight } from "./icons";
import { BuildingArt, PhotoFrame } from "./placeholders";

export default function WhyChooseUs() {
  return (
    <section className="rounded-section bg-mint p-6 sm:p-10 lg:p-14">
      <h2 className="max-w-2xl text-3xl font-bold uppercase leading-tight tracking-tight text-forest sm:text-4xl">
        Why Choose Us
      </h2>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/70">
        Dr. (Maj) Nikhil Prakash, IPA Is A Not-For-Profit Network Of FQHCs And
        CHCs. For Over 30 Years, We’ve Helped Health Centers Deliver Quality,
        Value-Based Care —
      </p>

      <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid lg:grid-cols-3 lg:flex-1">
          {/* Photo card */}
          <article className="relative min-h-[260px] overflow-hidden rounded-card shadow-[8px_10px_0_0_#0a3e36] transition-transform duration-300 hover:-translate-y-1">
            <BuildingArt className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-mint-deep/80 via-transparent to-transparent" />
            <h3 className="absolute inset-x-0 bottom-0 p-6 text-2xl font-bold italic leading-tight text-white drop-shadow-md">
              Community Health Centers
            </h3>
          </article>

          {/* Lime card */}
          <article className="flex min-h-[260px] flex-col justify-end rounded-card bg-lime p-7 transition-transform duration-300 hover:-translate-y-1">
            <h3 className="text-[24px] font-bold leading-[1.15] tracking-tight text-ink">
              Community Health Centers
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
              24/7 Hospital & Urgent Care for Life’s Unexpected Moments.
            </p>
          </article>

          {/* Purple card */}
          <article className="flex min-h-[260px] flex-col justify-end rounded-card bg-grape p-7 transition-transform duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
            <h3 className="text-[24px] font-bold leading-[1.15] tracking-tight text-ink">
              Care Coordination
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
              Personalized Support to Navigate Your Health Journey.
            </p>
          </article>
        </div>

        {/* Arrow affordance */}
        <div className="hidden shrink-0 items-center lg:flex">
          <a
            href="#"
            aria-label="See more reasons"
            className="grid h-14 w-14 place-items-center rounded-pill text-forest transition-transform hover:translate-x-1"
          >
            <ArrowRight className="h-7 w-7" />
          </a>
        </div>
      </div>
    </section>
  );
}
