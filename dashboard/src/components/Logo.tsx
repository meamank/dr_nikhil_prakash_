import type { CSSProperties } from "react"

import logoUrl from "@/assets/logo_32.svg"

const maskStyle: CSSProperties = {
  aspectRatio: "504 / 449",
  WebkitMaskImage: `url("${logoUrl}")`,
  maskImage: `url("${logoUrl}")`,
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  maskSize: "contain",
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-current ${className}`}
      style={maskStyle}
    />
  )
}
