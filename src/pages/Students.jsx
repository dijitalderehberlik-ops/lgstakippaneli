import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { renk, font, input, buton } from '../styles'
import StudentDetail from './StudentDetail'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [resetStudent, setResetStudent] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetError, setResetError] = useState('')

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents() {
    const { data } = await supabase.from('students').select('*').order('full_name')
    setStudents(data || [])
    setLoading(false)
  }

  async function handleAddStudent() {
    setError('')
    setSuccess('')
    if (!fullName || !username || !password) { setError('Tüm alanları doldurun'); return }

    const email = username.trim().toLowerCase() + '@lgstakip.com'
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })
    if (authError) { setError('Kullanıcı oluşturulamadı: ' + authError.message); return }

    const { error: dbError } = await supabase.from('students').insert({ id: data.user.id, full_name: fullName, username: username.trim().toLowerCase(), role: 'student' })
    if (dbError) { setError('Veritabanına eklenemedi: ' + dbError.message); return }

    setSuccess(fullName + ' başarıyla eklendi')
    setFullName('')
    setUsername('')
    setPassword('')
    fetchStudents()
  }

  async function handleDelete(id, name) {
    if (!window.confirm(name + ' silinsin mi?')) return
    await supabaseAdmin.auth.admin.deleteUser(id)
    await supabase.from('students').delete().eq('id', id)
    fetchStudents()
  }

  async function handleResetPassword() {
    setResetError('')
    setResetSuccess('')
    if (!newPassword) { setResetError('Yeni şifre girin'); return }
    if (newPassword.length < 6) { setResetError('Şifre en az 6 karakter olmalı'); return }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(resetStudent.id, { password: newPassword })
    if (error) { setResetError('Şifre değiştirilemedi: ' + error.message); return }
    setResetSuccess('Şifre başarıyla değiştirildi')
    setNewPassword('')
  }

  if (selectedStudent) return <StudentDetail studentId={selectedStudent} onBack={() => setSelectedStudent(null)} />

  return (
    <div style={{ fontFamily: font.family }}>
      <h2 style={{ color: renk.gray800, marginBottom: '24px' }}>Öğrenciler</h2>

      {/* Şifre sıfırlama modalı */}
      {resetStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0005', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: renk.white, padding: '32px', borderRadius: '16px', width: '380px', boxShadow: renk.shadow }}>
            <h3 style={{ marginBottom: '8px', color: renk.gray800 }}>Şifre Sıfırla</h3>
            <p style={{ color: renk.gray400, fontSize: font.size.md, marginBottom: '20px' }}>{resetStudent.full_name}</p>
            <input type="password" placeholder="Yeni şifre" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={input} />
            {resetError && <div style={{ background: renk.redLight, color: renk.red, padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: font.size.md }}>{resetError}</div>}
            {resetSuccess && <div style={{ background: renk.greenLight, color: renk.green, padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: font.size.md }}>{resetSuccess}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleResetPassword} style={buton.primary}>Kaydet</button>
              <button onClick={() => { setResetStudent(null); setNewPassword(''); setResetSuccess(''); setResetError('') }} style={buton.secondary}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Öğrenci ekleme formu */}
      <div style={{ background: renk.white, padding: '24px', borderRadius: '14px', border: `1px solid ${renk.gray200}`, marginBottom: '32px', maxWidth: '480px' }}>
        <h3 style={{ marginBottom: '20px', color: renk.gray800 }}>Yeni Öğrenci Ekle</h3>
        <input placeholder="Ad Soyad" value={fullName} onChange={e => setFullName(e.target.value)} style={input} />
        <input placeholder="Kullanıcı Adı" value={username} onChange={e => setUsername(e.target.value)} style={input} />
        <input placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} style={input} />
        {error && <div style={{ background: renk.redLight, color: renk.red, padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: font.size.md }}>{error}</div>}
        {success && <div style={{ background: renk.greenLight, color: renk.green, padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: font.size.md }}>{success}</div>}
        <button onClick={handleAddStudent} style={buton.primary}>Ekle</button>
      </div>

      {/* Öğrenci listesi */}
      {loading ? <p style={{ color: renk.gray400 }}>Yükleniyor...</p> : (
        <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: renk.gray50 }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>Ad Soyad</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>Kullanıcı Adı</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {students.filter(s => s.role === 'student').map(s => (
                <tr key={s.id} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                  <td style={{ padding: '12px 16px', color: renk.gray800, fontWeight: '500' }}>{s.full_name}</td>
                  <td style={{ padding: '12px 16px', color: renk.gray400, fontSize: font.size.md }}>{s.username || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setSelectedStudent(s.id)} style={buton.detail}>Detay</button>
                      <button onClick={() => { setResetStudent(s); setResetSuccess(''); setResetError('') }} style={buton.warning}>Şifre</button>
                      <button onClick={() => handleDelete(s.id, s.full_name)} style={buton.danger}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.filter(s => s.role === 'student').length === 0 && (
                <tr><td colSpan={3} style={{ padding: '32px', color: renk.gray400, textAlign: 'center' }}>Henüz öğrenci eklenmemiş</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}