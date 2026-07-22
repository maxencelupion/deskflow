import { useEffect, useRef, useState } from "react"

export function useScrollDirection({ threshold = 8 } = {}) {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY

    function onScroll() {
      const y = window.scrollY
      const delta = y - lastY.current

      if (Math.abs(delta) < threshold) return

      setHidden(delta > 0 && y > 64)
      lastY.current = y
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold])

  return hidden
}
