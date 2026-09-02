import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { usePortalUrl } from "../lib/portal";

const NAV_LINKS = [
  { label: "Home", href: "#", active: true },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#reach" },
];

const SECTION_FOR_LABEL: Record<string, string> = {
  About: "about",
  Services: "services",
  Contact: "reach",
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Home");
  const portalUrl = usePortalUrl();

  // Scroll-spy: highlight the nav link of the section currently in view
  useEffect(() => {
    const sections = Object.entries(SECTION_FOR_LABEL)
      .map(([label, id]) => ({ label, el: document.getElementById(id) }))
      .filter((s): s is { label: string; el: HTMLElement } => s.el !== null);

    const onScroll = () => {
      // A section counts as "current" once its top passes 35% of the viewport
      const marker = window.scrollY + window.innerHeight * 0.35;
      let current = "Home";
      for (const { label, el } of sections) {
        if (el.offsetTop <= marker) current = label;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Close the mobile menu as soon as the user scrolls away
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [open]);

  return (
    <header className="sticky top-3 z-50">
      {/* Lime pill bar */}
      <div className="flex items-center justify-between gap-3 rounded-pill bg-lime px-4 py-2.5 sm:px-6 sm:py-3">
        {/* Brand */}
        <a href="#" className="flex shrink-0 items-center gap-2">
          <Logo className="h-7 w-7 text-forest" />
          <span className="text-[15px] font-bold text-forest sm:text-lg">
            Dr. (Maj) Nikhil Prakash
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              aria-current={active === label ? "true" : undefined}
              className={`flex items-center gap-1 text-[15px] transition-colors ${
                active === label
                  ? "font-bold text-forest"
                  : "text-ink/75 hover:text-forest"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href={portalUrl}
            className="group flex items-center gap-1.5 text-forest transition-opacity hover:opacity-70"
            aria-label="Login to patient portal"
          >
            <span className="text-left leading-tight">
              <span className="block text-[13px] font-bold underline-offset-4 group-hover:underline">
                Login
              </span>
            </span>
          </a>

          <a
            href="#book"
            className="hidden rounded-pill bg-forest px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep lg:inline-block"
          >
            Book appointment
          </a>

          {/* Mobile menu trigger — Lucide Menu / X icon */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-forest text-white transition-colors hover:bg-forest-deep sm:h-10 sm:w-10 lg:hidden"
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel — floats over the page (absolute) so it never pushes content down */}
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full z-50 mt-2 rounded-card bg-lime p-5 shadow-lg shadow-forest/10 lg:hidden"
        >
          <ul className="flex flex-col divide-y divide-forest/10">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active === label ? "true" : undefined}
                  className={`flex items-center justify-between py-3 text-base ${
                    active === label ? "font-bold text-forest" : "text-ink/75"
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={portalUrl}
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-pill border border-forest px-6 py-3 text-center text-sm font-semibold text-forest"
          >
            Login to portal
          </a>
          <a
            href="#book"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-pill bg-forest px-6 py-3 text-center text-sm font-semibold text-white"
          >
            Book appointment
          </a>
        </nav>
      )}
    </header>
  );
}
