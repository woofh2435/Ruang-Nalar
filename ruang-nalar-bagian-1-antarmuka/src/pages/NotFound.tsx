import { Link } from 'react-router-dom'
import { Nalar } from '../components/nalar/Nalar'
import { useNalar } from '../components/nalar/NalarContext'
import { Panel } from '../components/art/Panel'
import { TEMA } from '../lib/tema'
import { useEffect } from 'react'

export function NotFound({ judul = 'Halaman ini tidak ketemu', pesan = 'Mungkin alamatnya salah ketik, atau ebooknya sudah dihapus.' }: { judul?: string; pesan?: string }) {
  const { setMood } = useNalar()
  useEffect(() => {
    setMood('sedih', 6000)
  }, [setMood])
  return (
    <div className="wadah flex min-h-[80vh] flex-col items-center justify-center gap-8 pb-16 pt-24 text-center">
      <div className="w-[min(320px,80vw)]">
        <Nalar kulit={TEMA.malam.kulit} ukuran="besar" gelembung={false} />
      </div>
      <Panel warna="kertas" miring={-1} className="max-w-md px-6 py-6">
        <h1 className="cat-judul m-0 font-display text-3xl font-black">{judul}</h1>
        <p className="mt-2">{pesan}</p>
        <Link to="/" className="tombol tombol-primer mt-4">
          Kembali ke rak buku
        </Link>
      </Panel>
    </div>
  )
}
