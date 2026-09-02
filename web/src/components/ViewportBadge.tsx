import { useEffect, useState } from "react";

function breakpointFor(width: number): string {
  if (width < 640) return "< sm";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  return "xl";
}

export default function ViewportBadge() {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      className="fixed left-1/2 top-2 z-60 -translate-x-1/2 rounded-pill bg-forest px-3 py-1.5 font-mono text-xs font-semibold text-white shadow-lg"
      role="status"
    >
      {size.w ? `${size.w}×${size.h} · ${breakpointFor(size.w)}` : "…"}
    </div>
  );
}
