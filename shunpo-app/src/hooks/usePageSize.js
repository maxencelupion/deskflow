import { useMediaQuery } from '@/hooks/useMediaQuery'

export function usePageSize() {
  const isMobile = useMediaQuery('(max-width: 639px)')
  return isMobile ? 3 : 5
}
