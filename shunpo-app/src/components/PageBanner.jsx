import { Bubbles, Waves } from '@/components/BeachScene'

export function PageBanner({ title, subtitle, image }) {
  return (
    <div className="relative overflow-hidden bg-primary py-8 text-primary-foreground">
      <Bubbles />
      <Waves />
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-4 md:px-10">
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold">{title}</p>
          {subtitle && <p className="text-sm text-primary-foreground/80">{subtitle}</p>}
        </div>
        {image && <img src={image} alt="" className="hidden h-28 w-28 shrink-0 sm:block" />}
      </div>
    </div>
  )
}
