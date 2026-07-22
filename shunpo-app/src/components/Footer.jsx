export function Footer() {
  return (
    <footer className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-center px-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Maxence Lupion
      </div>
    </footer>
  )
}
