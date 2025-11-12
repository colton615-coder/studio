import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const getIsMobile = () => {
    if (typeof window === "undefined") return false
    // Prefer matchMedia; fallback to innerWidth for robustness
    try {
      return (
        window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches ||
        window.innerWidth < MOBILE_BREAKPOINT
      )
    } catch {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
  }

  // Initialize state synchronously to avoid first-tap mismatch on mobile
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(mql.matches)
    }

    // Ensure state is correct on mount
    setIsMobile(mql.matches)

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    // Safari < 14 fallback
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return isMobile
}
