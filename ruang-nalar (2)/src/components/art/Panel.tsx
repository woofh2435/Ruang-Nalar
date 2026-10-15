import type { CSSProperties, ElementType, ReactNode } from 'react'

export type WarnaPanel = 'kertas' | 'biru' | 'malam' | 'kuning' | 'jingga' | 'ungu'

interface Props {
  warna?: WarnaPanel
  /** kemiringan dalam derajat, seperti guntingan kertas yang ditempel */
  miring?: number
  as?: ElementType
  className?: string
  style?: CSSProperties
  children?: ReactNode
  [k: string]: unknown
}

/** Panel kolase: latarnya bertepi cat (filter di CSS), isinya tetap tajam. */
export function Panel({ warna = 'kertas', miring = 0, as: Tag = 'div', className = '', style, children, ...sisa }: Props) {
  return (
    <Tag className={`panel panel-${warna} ${className}`} style={{ ...(miring ? { transform: `rotate(${miring}deg)` } : null), ...style }} {...sisa}>
      {children}
    </Tag>
  )
}
