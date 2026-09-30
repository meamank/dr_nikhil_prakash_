import { EnvelopeIcon } from "./icons";

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden rounded-section bg-grape px-6 pb-24 pt-14 text-center sm:pb-28 sm:pt-20 lg:pb-32">
      {/* Giant headline — 11.5vw keeps the longest word ("APPOINTMENT") inside the viewport on mobile */}
      <h2 className="mx-auto max-w-5xl text-[11.5vw] font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-[11vw] lg:text-[118px]">
        Book Your Appointment
      </h2>

      {/* 3D mascot overlapping the headline — bottom fades into the section via mask ("fog" effect) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-1 mx-auto flex justify-center">
        <img
          src="/images/3d-doctor.png"
          alt="Friendly 3D doctor character giving a thumbs up"
          width={900}
          height={900}
          loading="lazy"
          decoding="async"
          className="h-72 w-auto drop-shadow-2xl sm:h-96 lg:h-104"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 30%, transparent 80%)",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 30%, transparent 80%)",
          }}
        />
      </div>

      {/* Rotating contact badge — top-right on mobile, vertically centered right on desktop */}
      <a
        href="#reach"
        aria-label="Contact us"
        className="group absolute right-4 top-6 lg:right-8 lg:top-1/2 lg:-translate-y-1/2"
      >
        <span className="relative grid h-20 w-20 place-items-center lg:h-32 lg:w-32">
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full animate-spin-slow text-white motion-reduce:animate-none"
            aria-hidden="true"
          >
            <defs>
              <path
                id="cta-circle"
                d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
              />
            </defs>
            {/* rotate(-90) shifts the path start from 9 o'clock to 12 o'clock */}
            <g transform="rotate(-90 50 50)">
              <text
                fill="currentColor"
                fontSize="10.5"
                fontWeight="700"
                letterSpacing="2.5"
              >
                <textPath
                  href="#cta-circle"
                  textLength="238"
                  lengthAdjust="spacingAndGlyphs"
                >
                  • Contact Us • Contact Us
                </textPath>
              </text>
            </g>
          </svg>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-forest transition-transform group-hover:scale-110 lg:h-14 lg:w-14">
            <EnvelopeIcon className="h-4 w-4 lg:h-6 lg:w-6" />
          </span>
        </span>
      </a>

      {/* CTA button — soft elevation shadow lifts it off the mascot image behind it */}
      <a
        href="#doctors"
        className="relative z-10 mt-16 inline-block rounded-pill bg-forest px-8 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_-6px_rgba(6,34,29,0.55)] transition-all hover:-translate-y-0.5 hover:bg-forest-deep hover:shadow-[0_16px_34px_-6px_rgba(6,34,29,0.6)] active:translate-y-0 active:shadow-[0_8px_20px_-6px_rgba(6,34,29,0.55)] sm:mt-20"
      >
        Locate Us
      </a>
    </section>
  );
}
