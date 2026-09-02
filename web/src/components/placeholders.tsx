/* ============================================================
   Illustration placeholders — swap these for real photography
   by replacing the component contents with <img /> tags.
   ============================================================ */
import type { ReactNode } from "react";

type PortraitProps = {
  className?: string;
  /** "scrubs" = teal scrubs hero look, "coat" = white coat */
  tone?: "scrubs" | "coat";
  /** grayscale variant for B&W photography sections */
  mono?: boolean;
};

/** Abstract person illustration (head + shoulders with stethoscope). */
export function Portrait({ className = "", tone = "scrubs", mono = false }: PortraitProps) {
  const hair = mono ? "#3a3a3a" : "#4a382c";
  const skin = mono ? "#bdbdbd" : "#c99b78";
  const body = mono ? "#8f9a97" : tone === "scrubs" ? "#3ec2b8" : "#f5f8f6";
  const bodyEdge = tone === "coat" && !mono ? "#c7d6d2" : "none";
  const tube = mono ? "#5a5a5a" : "#0a3e36";

  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      {/* hair back */}
      <circle cx="110" cy="72" r="46" fill={hair} />
      {/* face */}
      <circle cx="110" cy="80" r="36" fill={skin} />
      {/* hair front */}
      <path d="M70 74a40 40 0 0 1 80 0c0-26-16-42-40-42S70 48 70 74Z" fill={hair} />
      {/* shoulders */}
      <path
        d="M34 220c0-52 34-76 76-76s76 24 76 76Z"
        fill={body}
        stroke={bodyEdge}
        strokeWidth={bodyEdge === "none" ? 0 : 2}
      />
      {/* v-neck for scrubs */}
      {tone === "scrubs" && <path d="M92 148l18 16 18-16" fill="none" stroke={mono ? "#6f7a77" : "#2aa79d"} strokeWidth="5" strokeLinecap="round" />}
      {/* stethoscope */}
      <path
        d="M88 158c0 20 10 32 22 32s22-12 22-32"
        fill="none"
        stroke={tube}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="110" cy="194" r="7" fill={tube} />
    </svg>
  );
}

type FrameProps = {
  className?: string;
  mono?: boolean;
  children?: ReactNode;
};

/** Rounded photo well with a soft palette-matched gradient. */
export function PhotoFrame({ className = "", mono = false, children }: FrameProps) {
  return (
    <div
      className={`relative overflow-hidden ${
        mono
          ? "bg-gradient-to-br from-[#e3e8e6] via-[#c9d2cf] to-[#a7b3af]"
          : "bg-gradient-to-br from-white via-mint-soft to-mint-deep"
      } ${className}`}
    >
      {/* soft light blobs, echoing studio photography */}
      <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/50 blur-xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-white/30 blur-xl" />
      {children}
    </div>
  );
}

/** Community health center building illustration. */
export function BuildingArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="220" fill="#dceef4" />
      <circle cx="52" cy="44" r="18" fill="#f3e9b8" />
      {/* main building */}
      <rect x="46" y="78" width="228" height="142" fill="#f4efe4" />
      <polygon points="38,78 160,30 282,78" fill="#b0563e" />
      {/* windows */}
      {[0, 1, 2, 3, 4].map((c) =>
        [0, 1].map((r) => (
          <rect
            key={`${c}-${r}`}
            x={66 + c * 40}
            y={100 + r * 44}
            width="24"
            height="30"
            rx="3"
            fill="#9db9c9"
          />
        ))
      )}
      {/* door + sign */}
      <rect x="142" y="176" width="36" height="44" rx="4" fill="#0a3e36" />
      <rect x="60" y="150" width="200" height="18" rx="9" fill="#ffffff" />
      <text x="160" y="163" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0a3e36" fontFamily="Helvetica, Arial, sans-serif">
        community health
      </text>
      {/* ground */}
      <rect y="214" width="320" height="6" fill="#c8dedc" />
    </svg>
  );
}
