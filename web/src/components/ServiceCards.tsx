import { ArrowDownRight } from "./icons";

const CARDS = [
  {
    title: "General Medicine",
    desc: "Fever, infections, and everyday illness — diagnosed carefully, treated conservatively.",
    bg: "bg-lime",
  },
  {
    title: "Stomach & Kidney Care",
    desc: "Specialized treatment for digestive and renal health issues.",
    bg: "bg-white",
  },
  {
    title: "Diabetes & Hypertension",
    desc: "Specialized treatment for diabetes and hypertension.",
    bg: "bg-grape",
  },
  {
    title: "Arthritis & Joint Care",
    desc: "Specialized treatment for arthritis and joint-related conditions.",
    bg: "bg-teal-accent",
  },
];

export default function ServiceCards() {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 min-[1024px]:grid-cols-3 min-[1256px]:grid-cols-4 lg:gap-5"
      aria-label="Medicine services"
    >
      {CARDS.map((card) => (
        <a
          key={card.title}
          href="#"
          className={`group flex min-h-55 flex-col justify-between rounded-card p-6 transition-transform duration-300 hover:-translate-y-1 sm:min-h-62.5 sm:p-7 ${card.bg}`}
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="max-w-55 text-[26px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[28px]">
              {card.title}
            </h3>
            <ArrowDownRight className="mt-1 h-7 w-7 shrink-0 text-forest transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
          </div>
          <p className="mt-8 max-w-62.5 text-[15px] leading-relaxed text-ink/70">
            {card.desc}
          </p>
        </a>
      ))}
    </section>
  );
}
