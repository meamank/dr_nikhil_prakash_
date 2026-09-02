import { PhoneIcon, PinIcon } from "./icons";

const LOCATIONS = [
  {
    name: "Juran Chhapra",
    address: "Road No. 3, Juran Chhapra, Muzaffarpur",
    phone: "98013 17878",
    phoneHref: "tel:+919801317878",
    hours: "11:00 am – 6:00 pm · Saturday Closed",
    map: "/images/map-clinic-one.png",
  },
  {
    name: "Bhagwanpur",
    address: "Fardogola, Near CityKart, Rewa Road, Bhagwanpur, Muzaffarpur",
    phone: "98013 17878",
    phoneHref: "tel:+919801317878",
    hours: "7:00 pm – 10:00 pm · Daily",
    map: "/images/map-clinic-two.png",
  },
];

export default function ReachUs() {
  return (
    <section id="reach" className="px-1 py-6 lg:py-10">
      <h2 className="text-3xl font-bold leading-[1.12] tracking-tight text-forest sm:text-4xl">
        Find the clinic
      </h2>

      <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-2 lg:gap-10">
        {LOCATIONS.map(({ name, address, phone, phoneHref, hours, map }) => (
          <article key={name} className="flex flex-col">
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

            {/* Map image — reserved space; mt-auto pins it to the card bottom so both maps stay aligned */}
            <div className="mt-auto pt-5">
              <div className="aspect-[4/3] overflow-hidden rounded-card border border-dashed border-mint-deep bg-mint-soft sm:aspect-[16/10]">
                {/* To use: replace this placeholder block with
                    <img src="{map}" alt={`Map showing ${name} location`} className="h-full w-full object-cover" /> */}
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-mint-deep">
                  <PinIcon className="h-8 w-8" />
                  <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                    Map — {name}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
