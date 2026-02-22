import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font, input, buton } from '../styles'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const email = username.trim().toLowerCase() + '@lgstakip.com'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Kullanıcı adı veya şifre hatalı')
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: renk.primaryBg, fontFamily: font.family }}>
      <div style={{ background: renk.white, padding: '48px 40px', borderRadius: '16px', width: '380px', boxShadow: renk.shadow }}>
        
        {/* Logo alanı */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: renk.primary, borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '16px' }}>
            📚
          </div>
          <h2 style={{ margin: 0, fontSize: font.size.xxl, color: renk.gray800, fontWeight: '700' }}>LGS Takip</h2>
          <p style={{ margin: '6px 0 0', color: renk.gray400, fontSize: font.size.md }}>Hesabınıza giriş yapın</p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: font.size.md, fontWeight: '500', color: renk.gray600 }}>Kullanıcı Adı</label>
          <input
            type="text"
            placeholder="kullaniciadi"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={input}
          />
        </div>

        <div style={{ marginTop: '4px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: font.size.md, fontWeight: '500', color: renk.gray600 }}>Şifre</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={input}
          />
        </div>

        {error && (
          <div style={{ background: renk.redLight, color: renk.red, padding: '10px 14px', borderRadius: '8px', fontSize: font.size.md, marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ ...buton.primary, width: '100%', padding: '12px', fontSize: font.size.lg, marginTop: '8px' }}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </div>
    </div>
  )
}