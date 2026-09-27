import {
  EnvelopeIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "./icons";
import { Logo } from "./Logo";
import { usePortalUrl } from "../lib/portal";

const PROVIDER_LINKS = ["MedPoint", "Resources", "For Provider", "Updates"];
type QuickLink = { label: string; href?: string; portal?: boolean };
const QUICK_LINKS: QuickLink[] = [
  { label: "About", href: "#about" },
  { label: "Contact us", href: "#reach" },
  { label: "Login to portal", portal: true }, // resolved to the dashboard URL at render time
  { label: "Booking information", href: "#book" },
];
const SOCIALS = [
  { label: "Facebook", Icon: FacebookIcon },
  { label: "LinkedIn", Icon: LinkedInIcon },
  { label: "Instagram", Icon: InstagramIcon },
  { label: "X", Icon: XIcon },
];

export default function Footer() {
  const portalUrl = usePortalUrl();

  return (
    <footer
      id="footer"
      className="relative overflow-hidden rounded-section bg-forest px-6 pb-40 pt-10 sm:px-10 sm:pt-14 lg:px-14"
    >
      <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:justify-between">
        {/* Brand */}
        <div>
          <a href="#" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-white" />
            <span className="text-lg font-bold text-white">
              Dr. (Maj) Nikhil Prakash
            </span>
          </a>
          {/* <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-white/65">
            You can find a doctor according to your complain and please arrange
            your schedule to meet.
          </p> */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-semibold text-white">Follow us</span>
            {SOCIALS.map(({ label, Icon }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white hover:text-forest"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Providers */}
        {/* <nav aria-label="Providers">
          <h3 className="text-base font-bold text-white">Providers</h3>
          <ul className="mt-5 space-y-3.5">
            {PROVIDER_LINKS.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="text-[14px] text-white/65 transition-colors hover:text-lime"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav> */}

        {/* Quick links */}
        <nav aria-label="Quick links">
          <h3 className="text-base font-bold text-white">Quick Link</h3>
          <ul className="mt-5 space-y-3.5">
            {QUICK_LINKS.map(({ label, href, portal }) => (
              <li key={label}>
                <a
                  href={portal ? portalUrl : href}
                  {...(portal
                    ? { target: "_blank" as const, rel: "noopener" as const }
                    : {})}
                  className="text-[14px] text-white/65 transition-colors hover:text-lime"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Newsletter */}
        {/* <div>
          <h3 className="text-base font-bold text-white">Newsletter</h3>
          <form
            className="mt-5 flex flex-col gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <div className="relative">
              <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email address"
                className="w-full rounded-pill border border-white/20 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/45 focus:border-lime focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-pill bg-white py-3 text-sm font-semibold text-forest transition-colors hover:bg-lime"
            >
              Subscribe Now
            </button>
          </form>
        </div> */}
      </div>

      {/* Copyright */}
      <p className="relative z-10 mt-12 text-center text-[13px] text-white/55">
        Copyright © 2026 Dr. (Maj) Nikhil Prakash | All Rights Reserved | Built
        with ❤️ by{" "}
        <a
          href="https://www.amankr.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-white/75 transition-colors hover:text-lime"
        >
          Aman
        </a>
      </p>

      {/* Giant watermark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-8 select-none whitespace-nowrap text-center text-[17vw] font-extrabold leading-none text-white/6"
      >
        Dr. (Maj) Nikhil Prakash
      </span>
    </footer>
  );
}
