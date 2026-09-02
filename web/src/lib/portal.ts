import { useEffect, useState } from "react";

/**
 * Port the patient portal (dashboard / Vite app) runs on in development.
 */
const PORTAL_PORT = 5173;

const FALLBACK_PORTAL_URL =
  (import.meta.env.PUBLIC_PORTAL_URL as string | undefined) ??
  `http://localhost:${PORTAL_PORT}/login`;

/**
 * URL of the patient portal login page.
 *
 * In the browser it points at the same hostname the site was opened from
 * (e.g. http://192.168.1.9:5173/login when browsing from a phone on the LAN),
 * so the link keeps working on any device. During SSR / without a window it
 * falls back to PUBLIC_PORTAL_URL or localhost.
 */
export function getPortalUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${PORTAL_PORT}/login`;
  }
  return FALLBACK_PORTAL_URL;
}

/**
 * Hook version of getPortalUrl — returns the SSR-safe fallback first, then
 * swaps to the hostname-derived URL after mount (avoids hydration mismatch).
 */
export function usePortalUrl(): string {
  const [url, setUrl] = useState(FALLBACK_PORTAL_URL);

  useEffect(() => {
    setUrl(getPortalUrl());
  }, []);

  return url;
}
