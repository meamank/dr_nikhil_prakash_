import { PhoneIcon, PinIcon } from "./icons";

const LOCATIONS = [
  {
    name: "Juran Chhapra",
    address: "Road No. 3, Juran Chhapra, Muzaffarpur",
    phone: "82358 21231",
    phoneHref: "tel:+918235821231",
    hours: "11:00 am – 6:00 pm · Saturday Closed",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d940.7833952471781!2d85.3752074081333!3d26.128517593591543!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed11c10c2c298d%3A0x43d53ddae8dfd046!2sDr.%20(Major)%20Nikhil%20Prakash!5e0!3m2!1sen!2sin!4v1788357086880!5m2!1sen!2sin",
  },
  {
    name: "Bhagwanpur",
    address: "Fardogola, Near CityKart, Rewa Road, Bhagwanpur, Muzaffarpur",
    phone: "82358 21231",
    phoneHref: "tel:+918235821231",
    hours: "7:00 pm – 10:00 pm · Daily",
    embedSrc:
      "https://www.google.com/maps?q=Fardogola,+Near+CityKart,+Rewa+Road,+Bhagwanpur,+Muzaffarpur&z=15&output=embed",
  },
];

export default function ReachUs() {
  return (
    <section id="reach" className="px-1 py-6 lg:py-10">
      <h2 className="text-3xl font-bold leading-[1.12] tracking-tight text-forest sm:text-4xl">
        Find the clinic
      </h2>

      <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-2 lg:gap-10">
        {LOCATIONS.map(
          ({ name, address, phone, phoneHref, hours, embedSrc }) => (
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

              {/* Map embed — mt-auto pins it to the card bottom so both maps stay aligned. */}
              <div className="mt-auto pt-5">
                {embedSrc ? (
                  <iframe
                    src={embedSrc}
                    title={`Map showing the ${name} clinic location`}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="aspect-[4/3] w-full rounded-card border border-mint-deep/20 sm:aspect-[16/10]"
                  />
                ) : (
                  <div className="aspect-[4/3] overflow-hidden rounded-card border border-dashed border-mint-deep bg-mint-soft sm:aspect-[16/10]">
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
