import { useEffect, useState } from 'react'
import Spline from '@splinetool/react-spline'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

function useAuth() {
  const [tokens, setTokens] = useState(() => {
    const raw = localStorage.getItem('petify_tokens')
    return raw ? JSON.parse(raw) : null
  })

  const save = (t) => {
    setTokens(t)
    localStorage.setItem('petify_tokens', JSON.stringify(t))
  }

  const clear = () => {
    setTokens(null)
    localStorage.removeItem('petify_tokens')
  }

  return { tokens, save, clear }
}

function App() {
  const { tokens, save, clear } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [images, setImages] = useState([])

  const isAuthed = !!tokens?.access_token

  async function register() {
    setBusy(true)
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) throw new Error('Register failed')
      save(await res.json())
    } catch (e) {
      alert(e.message)
    } finally { setBusy(false) }
  }

  async function login() {
    setBusy(true)
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) throw new Error('Login failed')
      save(await res.json())
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  async function buyCredits() {
    setBusy(true)
    try {
      const res = await fetch(`${BACKEND_URL}/credits/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access_token}` },
        body: JSON.stringify({ credits: 5, provider: 'stripe', amount_cents: 500, currency: 'usd' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      alert(`Balance: ${data.balance}`)
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  async function generate() {
    setBusy(true)
    try {
      const res = await fetch(`${BACKEND_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access_token}` },
        body: JSON.stringify({ prompt: 'Cute corgi astronaut in watercolor', style: 'watercolor', hd: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      setImages((prev) => [data, ...prev])
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative min-h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/O-AdlP9lTPNz-i8a/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />
        <div className="relative z-10 flex min-h-[70vh] items-center justify-center px-6">
          <div className="max-w-3xl w-full text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">Petify AI</h1>
            <p className="text-lg md:text-xl text-white/80 mb-8">AI Pet Image Generator and Customizer</p>
            {!isAuthed ? (
              <div className="mx-auto max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 flex gap-2">
                <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="flex-1 bg-transparent outline-none px-3 py-2 border border-white/10 rounded" />
                <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="flex-1 bg-transparent outline-none px-3 py-2 border border-white/10 rounded" />
                <button onClick={login} disabled={busy} className="px-4 py-2 bg-white text-slate-900 rounded font-medium">Log in</button>
                <button onClick={register} disabled={busy} className="px-4 py-2 bg-orange-400 text-slate-900 rounded font-medium">Sign up</button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <button onClick={buyCredits} className="px-4 py-2 rounded bg-white text-slate-900">Buy 5 credits</button>
                <button onClick={generate} className="px-4 py-2 rounded bg-orange-400 text-slate-900">Generate</button>
                <button onClick={clear} className="px-4 py-2 rounded border border-white/20">Logout</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {images.length > 0 && (
        <section className="px-6 py-10">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <img src={img.output_url} className="w-full h-64 object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default App
