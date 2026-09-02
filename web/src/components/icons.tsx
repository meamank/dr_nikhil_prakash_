import type { SVGProps } from "react";

type Icon = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Sun-over-hills brand mark */
export function Logo(props: Icon) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <g {...stroke} strokeWidth={2.4}>
        <path d="M9 17a7 7 0 0 1 14 0" />
        <path d="M16 4v3M7.5 8.5 9.6 10.6M24.5 8.5 22.4 10.6M4 15h3M25 15h3" />
        <path d="M2 27c4.5-6 9.5-6 14-2 4.5-4 9.5-4 14 2" />
      </g>
    </svg>
  );
}

export function ArrowDownRight(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <g {...stroke} strokeWidth={2.4}>
        <path d="M6.5 6.5 17.5 17.5" />
        <path d="M17.5 9v8.5H9" />
      </g>
    </svg>
  );
}

export function ArrowRight(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <g {...stroke} strokeWidth={2.2}>
        <path d="M3.5 12h17" />
        <path d="m14 5.5 6.5 6.5-6.5 6.5" />
      </g>
    </svg>
  );
}

export function Asterisk(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <g {...stroke} strokeWidth={2.6}>
        <path d="M12 2.5v19M3.3 7.3l17.4 9.4M20.7 7.3 3.3 16.7" />
      </g>
    </svg>
  );
}

export function PinIcon(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.6" />
      </g>
    </svg>
  );
}

export function ChevronDown(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m6 9.5 6 6 6-6" {...stroke} strokeWidth={2.4} />
    </svg>
  );
}

export function ClockIcon(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <g {...stroke} strokeWidth={2.2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5.2l3.2 2" />
      </g>
    </svg>
  );
}

export function PhoneIcon(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M5.5 3.5h3l1.7 4.3-2.1 1.6a13.6 13.6 0 0 0 6.5 6.5l1.6-2.1 4.3 1.7v3a2 2 0 0 1-2.2 2A17.4 17.4 0 0 1 3.5 5.7a2 2 0 0 1 2-2.2Z"
        {...stroke}
      />
    </svg>
  );
}

export function EnvelopeIcon(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <g {...stroke}>
        <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
        <path d="m4 7.5 8 6 8-6" />
      </g>
    </svg>
  );
}

export function SunRays(props: Icon) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <g {...stroke} strokeWidth={2.4}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const x1 = 24 + Math.cos(a) * 10;
          const y1 = 24 + Math.sin(a) * 10;
          const x2 = 24 + Math.cos(a) * 20;
          const y2 = 24 + Math.sin(a) * 20;
          return <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} />;
        })}
      </g>
    </svg>
  );
}

/* ---------------- Social icons (filled) ---------------- */

export function FacebookIcon(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.5 8.2h2.3V5.1h-2.6c-2.4 0-3.9 1.6-3.9 4v2.1H8.1v3.1h2.2V22h3.2v-7.7h2.4l.5-3.1h-2.9V9.4c0-.8.4-1.2 1-1.2Z" />
    </svg>
  );
}

export function LinkedInIcon(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.9 8.6H3.8V20h3.1V8.6ZM5.3 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM13 8.6H10V20h3.1v-5.7c0-1.6.8-2.4 2-2.4s1.8.8 1.8 2.4V20H20v-6.3c0-3.2-1.7-4.7-4-4.7a3.4 3.4 0 0 0-3 1.6Z" />
    </svg>
  );
}

export function InstagramIcon(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <g {...stroke} strokeWidth={2}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function XIcon(props: Icon) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.7 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7.1-8.1L2.5 3h6.2l4.3 5.7L17.7 3Zm-1 16.2h1.7L7.9 4.7H6.1l10.6 14.5Z" />
    </svg>
  );
}
