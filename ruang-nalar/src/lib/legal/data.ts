// Menggabungkan identitas pengelola (config) dan kontak (profil) menjadi data yang dipakai dokumen hukum.

import { useMemo } from 'react'
import { NAMA_WEB } from '../../config'
import { useProfil } from '../profil'
import { useIdentitas } from './identitas'
import type { DataLegal } from './dokumen'

export function useDataLegal(): DataLegal {
  const id = useIdentitas()
  const profil = useProfil()
  return useMemo(() => ({ nama: NAMA_WEB, pengelola: id.pengelola, kota: id.kota, email: profil.kontakEmail }), [id.pengelola, id.kota, profil.kontakEmail])
}
