import { PhoneIcon, PinIcon } from "./icons";

const LOCATIONS = [
  {
    name: "Fardo Gola",
    address: "Fardo Gola, Near CityKart, Rewa Road, Muzaffarpur, Bihar",
    phone: "82358 21231",
    phoneHref: "tel:+918235821231",
    hours: "6:00 pm – 10:00 pm · Sunday Closed",
    embedSrc:
      "https://www.google.com/maps?q=Fardo+Gola,+Near+CityKart,+Rewa+Road,+Muzaffarpur&z=15&output=embed",
  },
  // {
  //   name: "Juran Chhapra",
  //   address: "Road No. 3, Juran Chhapra, Muzaffarpur",
  //   phone: "82358 21231",
  //   phoneHref: "tel:+918235821231",
  //   hours: "11:00 am – 6:00 pm · Saturday Closed",
  //   embedSrc:
  //     "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d940.7833952471781!2d85.3752074081333!3d26.128517593591543!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed11c10c2c298d%3A0x43d53ddae8dfd046!2sDr.%20(Major)%20Nikhil%20Prakash!5e0!3m2!1sen!2sin!4v1788357086880!5m2!1sen!2sin",
  // },
];

export default function ReachUs() {
  return (
    <section id="reach" className="px-1 py-6 lg:py-10">
      <h2 className="text-3xl font-bold leading-[1.12] tracking-tight text-forest sm:text-4xl">
        Find the clinic
      </h2>

      <div className="mt-8 space-y-8 sm:mt-10">
        {LOCATIONS.map(
          ({ name, address, phone, phoneHref, hours, embedSrc }) => (
            <article
              key={name}
              className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10"
            >
              <div>
                <h3 className="text-xl font-bold text-forest sm:text-2xl">
                  {name}
                </h3>

                {/* Address */}
                <div className="mt-4 flex items-start gap-2.5">
                  <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
                  <div>
                    <p className="max-w-xs text-[15px] leading-relaxed text-ink/80">
                      {address}
                    </p>
                    <p className="mt-1 text-[13px] text-ink/55">{hours}</p>
                  </div>
                </div>

                {/* Contact */}
                <a
                  href={phoneHref}
                  className="mt-3 inline-flex items-center gap-2 text-[15px] font-semibold text-teal-accent transition-opacity hover:opacity-75"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {phone}
                </a>
              </div>

              {/* Map */}
              <div className="aspect-[4/3] min-w-0 overflow-hidden rounded-card border border-mint-deep/20 bg-mint-soft sm:aspect-[16/10]">
                {embedSrc ? (
                  <button
                    type="button"
                    data-map-src={embedSrc}
                    data-map-title={`Map showing the ${name} clinic location`}
                    aria-label={`Load the ${name} clinic map`}
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 p-6 text-teal-accent transition-colors hover:bg-mint-deep/10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-teal-accent"
                  >
                    <PinIcon className="h-10 w-10" />
                    <span className="text-base font-semibold">
                      Click to load map
                    </span>
                    <span className="text-sm text-ink/55">{name}</span>
                  </button>
                ) : (
                  <div className="h-full w-full">
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-mint-deep">
                      <PinIcon className="h-8 w-8" />
                      <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                        Map — {name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
