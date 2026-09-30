import { Asterisk } from "./icons";

const STATS = [
  "15+ Years of Experience",
  "50K+ Patients Served",
  "No Emergency services, No Hospitalizations",
  "Medicines and Tests available at the clinic",
];

export default function StatsBar() {
  const track = [...STATS, ...STATS];

  return (
    <section
      className="overflow-hidden rounded-pill bg-forest py-4"
      aria-label="Network statistics"
    >
      <div className="flex w-max animate-marquee items-center gap-12 pr-12 motion-reduce:animate-none">
        {track.map((stat, i) => (
          <span
            key={`${stat}-${i}`}
            className="flex items-center gap-3 whitespace-nowrap text-sm font-semibold text-white sm:text-[15px]"
          >
            <Asterisk className="h-4 w-4 text-lime" />
            {stat}
          </span>
        ))}
      </div>
    </section>
  );
}
