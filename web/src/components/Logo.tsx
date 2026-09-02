import type { CSSProperties } from "react";

const MASK_STYLE: CSSProperties = {
  aspectRatio: "504 / 449",
  WebkitMaskImage: "url('/images/logo.svg')",
  maskImage: "url('/images/logo.svg')",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
};

/**
 * Dr. (Maj) Nikhil Prakash logo mark. Rendered via CSS mask so the artwork lives in
 * public/images/logo.svg while the color stays controllable through
 * `currentColor` — pass a text color class (e.g. "text-forest").
 * Always give it a height (e.g. "h-8") — width follows the 504:449 ratio.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Dr. (Maj) Nikhil Prakash logo"
      className={`inline-block bg-current align-middle ${className}`}
      style={MASK_STYLE}
    />
  );
}
