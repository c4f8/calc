import type { SVGProps } from 'react'
import type { GoodIcon } from '@/types/domain'

function BaseIcon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export const iconLabels: Record<GoodIcon, string> = {
  plan: 'Планировка',
  chair: '3D',
  materials: 'Материалы',
  helmet: 'Надзор',
  ruler: 'Обмер',
  light: 'Свет',
  box: 'Комплектация',
  plant: 'Декор',
  dots: 'Другое',
}

export const iconOptions: GoodIcon[] = ['plan', 'chair', 'materials', 'helmet', 'ruler', 'light', 'box', 'plant', 'dots']

export function GoodGlyph({ name, className }: { name: GoodIcon; className?: string }) {
  switch (name) {
    case 'plan':
      return (
        <BaseIcon className={className}>
          <path d="M6 5h20v22H6z" />
          <path d="M15 5v8h11" />
          <path d="M15 19v8" />
          <path d="M6 16h7" />
          <path d="M20 19h6" />
        </BaseIcon>
      )
    case 'chair':
      return (
        <BaseIcon className={className}>
          <path d="M10 6h12l-1 10H11z" />
          <path d="M9 16h14l-2 5H11z" />
          <path d="M12 21v5" />
          <path d="M20 21v5" />
          <path d="M8 26h16" />
        </BaseIcon>
      )
    case 'materials':
      return (
        <BaseIcon className={className}>
          <path d="M12 5h8l4 7-4 7h-8l-4-7z" />
          <path d="M8 20h8l4 7h-8z" />
          <path d="M20 20h4l-4 7h-4z" />
        </BaseIcon>
      )
    case 'helmet':
      return (
        <BaseIcon className={className}>
          <path d="M8 18a8 8 0 0 1 16 0" />
          <path d="M12 18V9" />
          <path d="M20 18V9" />
          <path d="M6 21h20" />
          <path d="M8 21v3h16v-3" />
        </BaseIcon>
      )
    case 'ruler':
      return (
        <BaseIcon className={className}>
          <path d="M7 22 22 7l4 4-15 15z" />
          <path d="m13 16 2 2" />
          <path d="m16 13 2 2" />
          <path d="m19 10 2 2" />
        </BaseIcon>
      )
    case 'light':
      return (
        <BaseIcon className={className}>
          <path d="M11 14a5 5 0 1 1 10 0c0 2.3-1.4 3.4-2.4 4.6-.6.7-.8 1.4-.8 2.4h-3.6c0-1-.2-1.7-.8-2.4C12.4 17.4 11 16.3 11 14Z" />
          <path d="M13.5 24h5" />
          <path d="M14.5 27h3" />
          <path d="M16 4V2" />
          <path d="m8 7-2-2" />
          <path d="m24 7 2-2" />
          <path d="M6 15H3" />
          <path d="M29 15h-3" />
        </BaseIcon>
      )
    case 'box':
      return (
        <BaseIcon className={className}>
          <path d="m16 4 10 6v12l-10 6-10-6V10z" />
          <path d="M6 10l10 6 10-6" />
          <path d="M16 16v12" />
        </BaseIcon>
      )
    case 'plant':
      return (
        <BaseIcon className={className}>
          <path d="M12 27h8l1-8H11z" />
          <path d="M16 19V8" />
          <path d="M16 12c-5 0-7-3-7-7 5 0 7 3 7 7Z" />
          <path d="M16 15c5 0 7-3 7-7-5 0-7 3-7 7Z" />
        </BaseIcon>
      )
    case 'dots':
      return (
        <BaseIcon className={className}>
          <path d="M8 16h.01" />
          <path d="M16 16h.01" />
          <path d="M24 16h.01" />
        </BaseIcon>
      )
  }
}
