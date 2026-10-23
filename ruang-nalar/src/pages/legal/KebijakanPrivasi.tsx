import { useMemo } from 'react'
import { HalamanLegal } from '../../components/legal/HalamanLegal'
import { kebijakanPrivasi } from '../../lib/legal/dokumen'
import { useDataLegal } from '../../lib/legal/data'

export function KebijakanPrivasi() {
  const d = useDataLegal()
  const dok = useMemo(() => kebijakanPrivasi(d), [d])
  return <HalamanLegal dok={dok} lain={{ ke: '/syarat-ketentuan', teks: 'Baca Syarat & Ketentuan' }} />
}
