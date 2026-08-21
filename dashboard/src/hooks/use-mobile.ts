import {useSyncExternalStore} from "react"

const MOBILE_BREAKPOINT = 768

const subscribe = (cb: () => void) => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", cb)
  return () => mql.removeEventListener("change", cb)
}
const getSnapshot = () =>
  window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches


export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
