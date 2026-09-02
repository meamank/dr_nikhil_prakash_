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
 * Dev: derived from the current hostname (e.g. http://192.168.1.9:5173/login
 * when browsing from a phone on the LAN), so it works on any device.
 * Production: always PUBLIC_PORTAL_URL (the hydrated Header must NOT rewrite
 * it — the worker URL is the only correct portal address in prod).
 */
export function getPortalUrl(): string {
  if (import.meta.env.DEV && typeof window !== "undefined") {
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
