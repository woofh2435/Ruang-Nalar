import { useMemo } from 'react'
import { HalamanLegal } from '../../components/legal/HalamanLegal'
import { syaratKetentuan } from '../../lib/legal/dokumen'
import { useDataLegal } from '../../lib/legal/data'

export function SyaratKetentuan() {
  const d = useDataLegal()
  const dok = useMemo(() => syaratKetentuan(d), [d])
  return <HalamanLegal dok={dok} lain={{ ke: '/kebijakan-privasi', teks: 'Baca Kebijakan Privasi' }} />
}
