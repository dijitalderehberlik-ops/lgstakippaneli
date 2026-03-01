import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { font } from '../styles'

const inputS = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: 'Inter, Segoe UI, sans-serif',
  color: '#1e293b', boxSizing: 'border-box', outline: 'none', background: '#fff',
}

function Bolum({ icon, baslik, aciklama, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '20px' }}>{icon}</div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>{baslik}</div>
          {aciklama && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{aciklama}</div>}
        </div>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  )
}

export default function AdminSettings({ onBack }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  // Öğrenci ekleme
  const [ekFullName, setEkFullName] = useState('')
  const [ekUsername, setEkUsername] = useState('')
  const [ekPassword, setEkPassword] = useState('')
  const [ekError, setEkError] = useState('')
  const [ekSuccess, setEkSuccess] = useState('')
  const [ekLoading, setEkLoading] = useState(false)

  // Şifre sıfırlama
  const [sifreOgrenci, setSifreOgrenci] = useState(null)
  const [yeniSifre, setYeniSifre] = useState('')
  const [sifreError, setSifreError] = useState('')
  const [sifreSuccess, setSifreSuccess] = useState('')

  // Silme
  const [silOnay1, setSilOnay1] = useState(null) // ilk onay
  const [silOnay2, setSilOnay2] = useState(null) // ikinci onay (yazmak)
  const [silYazilan, setSilYazilan] = useState('')
  const [silError, setSilError] = useState('')

  // Admin şifre
  const [mevcutSifre, setMevcutSifre] = useState('')
  const [adminYeniSifre, setAdminYeniSifre] = useState('')
  const [adminSifre2, setAdminSifre2] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents() {
    const { data } = await supabase.from('students').select('*').eq('role', 'student').order('full_name')
    setStudents(data || [])
    setLoading(false)
  }

  // ─── YENİ ÖĞRENCİ EKLE ─────────────────────────────────────────────────────
  async function handleEkle() {
    setEkError(''); setEkSuccess('')
    if (!ekFullName || !ekUsername || !ekPassword) { setEkError('Tüm alanları doldurun'); return }
    if (ekPassword.length < 6) { setEkError('Şifre en az 6 karakter olmalı'); return }
    setEkLoading(true)
    const email = ekUsername.trim().toLowerCase() + '@lgstakip.com'
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password: ekPassword, email_confirm: true })
    if (authError) { setEkError('Kullanıcı oluşturulamadı: ' + authError.message); setEkLoading(false); return }
    const { error: dbError } = await supabase.from('students').insert({ id: data.user.id, full_name: ekFullName, username: ekUsername.trim().toLowerCase(), role: 'student' })
    if (dbError) { setEkError('Veritabanına eklenemedi: ' + dbError.message); setEkLoading(false); return }
    setEkSuccess(ekFullName + ' başarıyla eklendi ✓')
    setEkFullName(''); setEkUsername(''); setEkPassword('')
    setEkLoading(false)
    fetchStudents()
  }

  // ─── ŞİFRE SIFIRLAMA ────────────────────────────────────────────────────────
  async function handleSifreSifirla() {
    setSifreError(''); setSifreSuccess('')
    if (!yeniSifre) { setSifreError('Yeni şifre girin'); return }
    if (yeniSifre.length < 6) { setSifreError('Şifre en az 6 karakter olmalı'); return }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(sifreOgrenci.id, { password: yeniSifre })
    if (error) { setSifreError('Şifre değiştirilemedi: ' + error.message); return }
    setSifreSuccess('Şifre başarıyla değiştirildi ✓')
    setYeniSifre('')
  }

  // ─── ÖĞRENCİ SİL ────────────────────────────────────────────────────────────
  function handleSilAd1(student) {
    setSilOnay1(student); setSilOnay2(null); setSilYazilan(''); setSilError('')
  }
  function handleSilAd2() {
    setSilOnay2(silOnay1); setSilYazilan('')
  }
  async function handleSilOnayla() {
    if (silYazilan !== silOnay2.full_name) { setSilError('Yazılan isim eşleşmiyor'); return }
    setSilError('')
    await supabaseAdmin.auth.admin.deleteUser(silOnay2.id)
    await supabase.from('students').delete().eq('id', silOnay2.id)
    setSilOnay1(null); setSilOnay2(null); setSilYazilan(''); setSifreOgrenci(null)
    fetchStudents()
  }

  // ─── ADMİN ŞİFRE ────────────────────────────────────────────────────────────
  async function handleAdminSifre() {
    setAdminError(''); setAdminSuccess('')
    if (!mevcutSifre || !adminYeniSifre || !adminSifre2) { setAdminError('Tüm alanları doldurun'); return }
    if (adminYeniSifre !== adminSifre2) { setAdminError('Yeni şifreler eşleşmiyor'); return }
    if (adminYeniSifre.length < 6) { setAdminError('Şifre en az 6 karakter olmalı'); return }

    const { data: { session } } = await supabase.auth.getSession()
    const email = session?.user?.email
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password: mevcutSifre })
    if (loginErr) { setAdminError('Mevcut şifre yanlış'); return }

    const { error } = await supabase.auth.updateUser({ password: adminYeniSifre })
    if (error) { setAdminError('Şifre değiştirilemedi: ' + error.message); return }
    setAdminSuccess('Admin şifresi başarıyla güncellendi ✓')
    setMevcutSifre(''); setAdminYeniSifre(''); setAdminSifre2('')
  }

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif' }}>
      {/* Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: '#64748b', fontSize: '14px', fontFamily: 'Inter, Segoe UI, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Öğrenciler
        </button>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>⚙️ Yönetici Ayarları</h2>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Öğrenci yönetimi ve hesap işlemleri</div>
        </div>
      </div>

      {/* Silme modalı aşama 1 */}
      {silOnay1 && !silOnay2 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px' }}>
            <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b', textAlign: 'center', marginBottom: '8px' }}>Öğrenciyi silmek istediğinizden emin misiniz?</div>
            <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '20px' }}>
              <strong style={{ color: '#ef4444' }}>{silOnay1.full_name}</strong> öğrencisinin tüm verileri <strong>kalıcı olarak silinecek</strong>. Bu işlem geri alınamaz.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setSilOnay1(null)} style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Inter, Segoe UI, sans-serif', fontWeight: '600' }}>İptal</button>
              <button onClick={handleSilAd2} style={{ flex: 1, padding: '11px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Inter, Segoe UI, sans-serif', fontWeight: '700' }}>Devam Et →</button>
            </div>
          </div>
        </div>
      )}

      {/* Silme modalı aşama 2 */}
      {silOnay2 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '28px' }}>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#ef4444', marginBottom: '12px' }}>🗑️ Son Onay</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.6' }}>
              Silme işlemini onaylamak için aşağıya öğrencinin tam adını yazın:
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '14px', fontWeight: '700', color: '#ef4444', textAlign: 'center', letterSpacing: '0.3px' }}>
              {silOnay2.full_name}
            </div>
            <input
              value={silYazilan}
              onChange={e => setSilYazilan(e.target.value)}
              placeholder="Adı buraya yazın..."
              style={{ ...inputS, marginBottom: '10px', borderColor: silYazilan && silYazilan !== silOnay2.full_name ? '#fca5a5' : '#e2e8f0' }}
            />
            {silError && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '10px' }}>{silError}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setSilOnay1(null); setSilOnay2(null); setSilYazilan('') }} style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Inter, Segoe UI, sans-serif', fontWeight: '600' }}>İptal</button>
              <button onClick={handleSilOnayla} disabled={!silYazilan} style={{ flex: 1, padding: '11px', background: silYazilan === silOnay2.full_name ? '#ef4444' : '#fca5a5', color: '#fff', border: 'none', borderRadius: '10px', cursor: silYazilan === silOnay2.full_name ? 'pointer' : 'not-allowed', fontFamily: 'Inter, Segoe UI, sans-serif', fontWeight: '700' }}>
                Kalıcı Olarak Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YENİ ÖĞRENCİ */}
      <Bolum icon="➕" baslik="Yeni Öğrenci Ekle" aciklama="Sisteme yeni bir öğrenci kaydı oluşturun">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '440px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Ad Soyad *</label>
            <input value={ekFullName} onChange={e => setEkFullName(e.target.value)} placeholder="örn: Ahmet Yılmaz" style={inputS} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Kullanıcı Adı *</label>
            <input value={ekUsername} onChange={e => setEkUsername(e.target.value)} placeholder="örn: ahmet123" style={inputS} />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Giriş e-postası: {ekUsername ? ekUsername.trim().toLowerCase() + '@lgstakip.com' : '...'}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Şifre *</label>
            <input type="password" value={ekPassword} onChange={e => setEkPassword(e.target.value)} placeholder="En az 6 karakter" style={inputS} />
          </div>
          {ekError && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{ekError}</div>}
          {ekSuccess && <div style={{ background: '#f0fdf4', color: '#10b981', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{ekSuccess}</div>}
          <button onClick={handleEkle} disabled={ekLoading} style={{ padding: '12px', background: ekLoading ? '#99f6e4' : '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', cursor: ekLoading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'Inter, Segoe UI, sans-serif' }}>
            {ekLoading ? 'Ekleniyor...' : '+ Öğrenci Ekle'}
          </button>
        </div>
      </Bolum>

      {/* ŞİFRE SIFIRLAMA */}
      <Bolum icon="🔑" baslik="Öğrenci Şifre Sıfırlama" aciklama="Bir öğrencinin giriş şifresini değiştirin">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '440px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Öğrenci Seç</label>
            <select
              value={sifreOgrenci?.id || ''}
              onChange={e => { const s = students.find(x => x.id === e.target.value); setSifreOgrenci(s || null); setSifreError(''); setSifreSuccess(''); setYeniSifre('') }}
              style={{ ...inputS }}
            >
              <option value="">— Öğrenci seçin —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name} (@{s.username})</option>)}
            </select>
          </div>
          {sifreOgrenci && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Yeni Şifre</label>
                <input type="password" value={yeniSifre} onChange={e => setYeniSifre(e.target.value)} placeholder="En az 6 karakter" style={inputS} />
              </div>
              {sifreError && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{sifreError}</div>}
              {sifreSuccess && <div style={{ background: '#f0fdf4', color: '#10b981', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{sifreSuccess}</div>}
              <button onClick={handleSifreSifirla} style={{ padding: '11px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'Inter, Segoe UI, sans-serif' }}>
                🔑 Şifreyi Güncelle
              </button>
            </>
          )}
        </div>
      </Bolum>

      {/* ÖĞRENCİ SİL */}
      <Bolum icon="🗑️" baslik="Öğrenci Sil" aciklama="Öğrenciyi ve tüm verilerini kalıcı olarak silin">
        {loading ? (
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>Yükleniyor...</div>
        ) : students.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>Kayıtlı öğrenci yok.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '500px' }}>
            {students.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '10px', padding: '12px 16px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{s.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>@{s.username}</div>
                </div>
                <button
                  onClick={() => handleSilAd1(s)}
                  style={{ padding: '7px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'Inter, Segoe UI, sans-serif' }}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}
      </Bolum>

      {/* ADMİN ŞİFRE */}
      <Bolum icon="🛡️" baslik="Admin Şifre Değiştir" aciklama="Kendi hesabınızın şifresini güncelleyin">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '440px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Mevcut Şifre</label>
            <input type="password" value={mevcutSifre} onChange={e => setMevcutSifre(e.target.value)} placeholder="Mevcut şifreniz" style={inputS} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Yeni Şifre</label>
            <input type="password" value={adminYeniSifre} onChange={e => setAdminYeniSifre(e.target.value)} placeholder="En az 6 karakter" style={inputS} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Yeni Şifre (Tekrar)</label>
            <input type="password" value={adminSifre2} onChange={e => setAdminSifre2(e.target.value)} placeholder="Şifreyi tekrar girin" style={inputS} />
          </div>
          {adminError && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{adminError}</div>}
          {adminSuccess && <div style={{ background: '#f0fdf4', color: '#10b981', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{adminSuccess}</div>}
          <button onClick={handleAdminSifre} style={{ padding: '12px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'Inter, Segoe UI, sans-serif' }}>
            🛡️ Şifreyi Güncelle
          </button>
        </div>
      </Bolum>
    </div>
  )
}
