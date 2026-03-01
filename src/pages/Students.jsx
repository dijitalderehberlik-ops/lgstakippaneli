import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { font } from '../styles'
import StudentDetail from './StudentDetail'

function formatTarih(isoStr) {
  if (!isoStr) return null
  const [y, m, d] = isoStr.split('-')
  return `${d}.${m}.${y}`
}

function YeniOgrenciModal({ onClose, onSaved }) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    setError(''); setSuccess('')
    if (!fullName || !username || !password) { setError('Tüm alanları doldurun'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
    setLoading(true)
    const email = username.trim().toLowerCase() + '@lgstakip.com'
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })
    if (authError) { setError('Kullanıcı oluşturulamadı: ' + authError.message); setLoading(false); return }
    const { error: dbError } = await supabase.from('students').insert({ id: data.user.id, full_name: fullName, username: username.trim().toLowerCase(), role: 'student' })
    if (dbError) { setError('Veritabanına eklenemedi: ' + dbError.message); setLoading(false); return }
    setSuccess(fullName + ' başarıyla eklendi ✓')
    setFullName(''); setUsername(''); setPassword('')
    setLoading(false)
    onSaved()
  }

  const inputS = { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: font.family, color: '#1e293b', boxSizing: 'border-box', outline: 'none' }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>Yeni Öğrenci Ekle</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Giriş bilgilerini belirleyin</div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Ad Soyad *</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="örn: Ahmet Yılmaz" style={inputS} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Kullanıcı Adı *</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="örn: ahmet123" style={inputS} />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Giriş: {username ? username.trim().toLowerCase() + '@lgstakip.com' : '...'}</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Şifre *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter" style={inputS} />
          </div>
          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}
          {success && <div style={{ background: '#f0fdf4', color: '#10b981', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{success}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={handleAdd} disabled={loading} style={{ flex: 1, padding: '12px', background: loading ? '#99f6e4' : '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: font.family }}>
              {loading ? 'Ekleniyor...' : '+ Öğrenci Ekle'}
            </button>
            <button onClick={onClose} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: font.family }}>İptal</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OgrenciKarti({ student, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const [sonTarih, setSonTarih] = useState(null)

  useEffect(() => {
    async function fetchSonTarih() {
      const [{ data: d1 }, { data: d2 }] = await Promise.all([
        supabase.from('daily_study').select('date').eq('student_id', student.id).order('date', { ascending: false }).limit(1),
        supabase.from('brans_denemeler').select('tarih').eq('student_id', student.id).order('tarih', { ascending: false }).limit(1),
      ])
      const tarihler = []
      if (d1?.[0]?.date) tarihler.push(d1[0].date)
      if (d2?.[0]?.tarih) tarihler.push(d2[0].tarih)
      if (tarihler.length > 0) setSonTarih(tarihler.sort().reverse()[0])
    }
    fetchSonTarih()
  }, [student.id])

  const initials = student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      onClick={() => onSelect(student.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: hovered ? '#0d9488' : '#e2e8f0',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: hovered ? '0 8px 24px rgba(13,148,136,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Avatar */}
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: hovered ? '#0d9488' : '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: hovered ? '#fff' : '#0d9488', transition: 'all 0.15s ease', flexShrink: 0 }}>
          {initials}
        </div>
        {/* Bilgi */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {student.full_name}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>@{student.username}</div>
        </div>
        {/* Ok */}
        <div style={{ color: hovered ? '#0d9488' : '#e2e8f0', fontSize: '18px', transition: 'color 0.15s ease', flexShrink: 0 }}>›</div>
      </div>

      {/* Son veri girişi */}
      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sonTarih ? '#10b981' : '#e2e8f0', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          {sonTarih ? `Son veri: ${formatTarih(sonTarih)}` : 'Henüz veri girilmemiş'}
        </span>
      </div>
    </div>
  )
}

export default function Students({ onNavigate }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAcik, setModalAcik] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [arama, setArama] = useState('')

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents() {
    const { data } = await supabase.from('students').select('*').order('full_name')
    setStudents(data || [])
    setLoading(false)
  }

  if (selectedStudent) return <StudentDetail studentId={selectedStudent} onBack={() => setSelectedStudent(null)} />

  const ogrenciler = students.filter(s => s.role === 'student' && s.full_name.toLowerCase().includes(arama.toLowerCase()))

  return (
    <div style={{ fontFamily: font.family }}>
      {modalAcik && (
        <YeniOgrenciModal
          onClose={() => setModalAcik(false)}
          onSaved={fetchStudents}
        />
      )}

      {/* Başlık */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#1e293b', margin: '0 0 4px' }}>Öğrenciler</h2>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>{students.filter(s => s.role === 'student').length} öğrenci kayıtlı</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {onNavigate && (
            <button onClick={() => onNavigate('admin')} style={{ padding: '10px 18px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: font.family, display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚙️ Yönetici Ayarları
            </button>
          )}
          <button onClick={() => setModalAcik(true)} style={{ padding: '10px 18px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: font.family, display: 'flex', alignItems: 'center', gap: '6px' }}>
            + Yeni Öğrenci
          </button>
        </div>
      </div>

      {/* Arama */}
      <div style={{ marginBottom: '20px' }}>
        <input
          value={arama}
          onChange={e => setArama(e.target.value)}
          placeholder="🔍  Öğrenci ara..."
          style={{ width: '100%', maxWidth: '360px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: font.family, color: '#1e293b', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* Kartlar */}
      {loading ? (
        <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>
      ) : ogrenciler.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
          {arama ? 'Arama sonucu bulunamadı.' : 'Henüz öğrenci eklenmemiş.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {ogrenciler.map(s => (
            <OgrenciKarti key={s.id} student={s} onSelect={setSelectedStudent} />
          ))}
        </div>
      )}
    </div>
  )
}
