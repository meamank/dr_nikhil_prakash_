import { MapPin } from "lucide-react";
import { PhotoFrame } from "./placeholders";

export default function Hero() {
  return (
    <section className="grid gap-4 min-[760px]:grid-cols-[minmax(0,1fr)_270px] lg:grid-cols-[minmax(0,1fr)_330px]">
      {/* Main mint hero card */}
      <div className="relative overflow-hidden rounded-card bg-mint sm:rounded-section">
        <div className="relative z-10 max-w-md p-6 sm:max-w-none sm:p-10 min-[760px]:px-8 lg:p-10">
          <div className="lg:grid lg:grid-cols-[minmax(0,46%)_minmax(0,54%)]">
            {/* Copy */}
            <div>
              <h1 className="text-[clamp(30px,3.75vw,48px)] font-bold leading-[1.06] tracking-tight text-forest min-[760px]:text-[30px] lg:text-[clamp(34px,3.75vw,48px)]">
                <span className="block whitespace-nowrap max-[360px]:whitespace-normal">
                  Medicine that starts
                </span>
                <span className="block whitespace-nowrap max-[360px]:whitespace-normal">
                  with listening
                </span>
              </h1>
              <p className="max-w-[32ch] mt-5 text-[15px] leading-relaxed text-ink/70 sm:text-base lg:max-w-[34ch]">
                Unhurried consultations, plain-language explanations, and care
                that starts with your story - not a prescription.
              </p>
              <div className="mt-7 flex flex-col items-start gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                <a
                  href="#book"
                  className="rounded-pill bg-forest px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                >
                  Book appointment
                </a>
                <a
                  href="#about"
                  className="rounded-pill border border-forest/40 px-10 py-3 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-white"
                >
                  About doctor
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor illustration — anchored flush to the card's bottom edge on
            all breakpoints, like the reference (desktop: right half, cut off
            by the card's bottom; mobile/tablet: bottom-right) */}
        <img
          src="/images/doctor.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 w-55 max-[400px]:w-48 sm:w-80 min-[760px]:w-64 lg:left-[44%] lg:right-auto lg:w-[55%] lg:max-w-none"
        />
      </div>

      {/* Right rail */}
      <div className="flex flex-col gap-4">
        {/* Provider spotlight card */}
        <article className="rounded-card bg-white p-3 sm:p-4">
          <PhotoFrame className="aspect-4/3 rounded-[22px]">
            <div className="h-full overflow-hidden bg-mint">
              <img
                src="/images/portrait.svg"
                alt="Portrait of Dr. (Maj) Nikhil Prakash"
                className="h-full w-full object-cover object-top"
              />
            </div>
          </PhotoFrame>
          <div className="px-2 pb-2 pt-4">
            <h3 className="text-xl font-bold text-ink">
              Dr. (Maj) Nikhil Prakash
            </h3>
            <h4 className="text-sm font-semibold text-forest">
              Consultant Physician
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/60">
              Stomach, Kidney and Arthritis specialist.
            </p>
            <div className="mt-1.5 border-t border-ink/10 pt-1.5">
              <p className="text-sm leading-relaxed text-ink/60">
                MBBS <span className="ml-2">(AFMC, Pune)</span>
              </p>
              <p className="text-sm leading-relaxed text-ink/60">
                MD <span className="ml-6">(Research & Referral, Delhi)</span>
              </p>
            </div>
          </div>
        </article>

        {/* Open clinic ticket — tilted */}
        <div className="rounded-[26px] bg-forest px-6 py-3 text-white shadow-xl shadow-forest/20">
          <div className="flex items-center gap-3">
            <MapPin color="var(--color-lime)" size="18" />
            <div>
              <p className="text-sm font-semibold">Road No.3, Juran Chhapra</p>
              <p className="text-xs opacity-50">
                11 A.M - 6 P.M · Saturday Closed
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <MapPin color="var(--color-lime)" size="18" />
            <div>
              <p className="text-sm font-semibold">Bhagwanpur</p>
              <p className="text-xs opacity-50">
                7 P.M - 10 P.M · Sunday Closed
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
