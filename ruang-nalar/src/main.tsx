import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { NAMA_WEB } from './config'
import { tangkapTautanAuth } from './lib/toko/tautan'

document.title = NAMA_WEB

// tautan dari email Supabase (atur ulang sandi / konfirmasi akun) harus ditangkap sebelum HashRouter menyala
tangkapTautanAuth()

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
