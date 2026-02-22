import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font, input, buton } from '../styles'

const DERSLER = [
  { key: 'paragraf', label: 'Paragraf' },
  { key: 'turkce', label: 'Türkçe' },
  { key: 'matematik', label: 'Matematik' },
  { key: 'fen', label: 'Fen' },
  { key: 'inkılap', label: 'İnkılap' },
  { key: 'ingilizce', label: 'İngilizce' },
  { key: 'din', label: 'Din' },
]

function net(d, y) {
  return (d - y / 3).toFixed(2)
}

export default function DailyStudy({ session }) {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState({})
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchStudents() }, [])

  useEffect(() => {
    if (selectedStudent && date) fetchExisting()
  }, [selectedStudent, date])

  async function fetchStudents() {
    const { data } = await supabase.from('students').select('*').eq('role', 'student').order('full_name')
    setStudents(data || [])
  }

  async function fetchExisting() {
    const { data } = await supabase.from('daily_study').select('*').eq('student_id', selectedStudent).eq('date', date)
    const existing = {}
    data?.forEach(row => { existing[row.lesson] = { dogru: row.dogru, yanlis: row.yanlis, bos: row.bos } })
    setEntries(existing)
  }

  function handleChange(ders, alan, value) {
    setEntries(prev => ({ ...prev, [ders]: { ...prev[ders], [alan]: parseInt(value) || 0 } }))
  }

  async function handleSave() {
    setError('')
    setSuccess('')
    if (!selectedStudent) { setError('Öğrenci seçin'); return }

    const rows = DERSLER.map(d => ({
      student_id: selectedStudent,
      date,
      lesson: d.key,
      dogru: entries[d.key]?.dogru || 0,
      yanlis: entries[d.key]?.yanlis || 0,
      bos: entries[d.key]?.bos || 0,
    }))

    const { error } = await supabase.from('daily_study').upsert(rows, { onConflict: 'student_id,date,lesson' })
    if (error) { setError('Kaydedilemedi: ' + error.message); return }
    setSuccess('Kaydedildi ✓')
  }

  const selectStyle = { padding: '10px 14px', borderRadius: '8px', border: `1px solid ${renk.gray200}`, fontSize: font.size.md, fontFamily: font.family, background: renk.white, color: renk.gray800 }

  return (
    <div style={{ fontFamily: font.family }}>
      <h2 style={{ color: renk.gray800, marginBottom: '24px' }}>Günlük Çalışma</h2>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: renk.gray600, fontSize: font.size.md }}>Öğrenci</label>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ ...selectStyle, minWidth: '220px' }}>
            <option value="">-- Seçin --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: renk.gray600, fontSize: font.size.md }}>Tarih</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...selectStyle }} />
        </div>
      </div>

      {selectedStudent && (
        <div>
          <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden', maxWidth: '620px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: renk.gray50 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Ders</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.green, fontWeight: '600', fontSize: font.size.sm }}>Doğru</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.red, fontWeight: '600', fontSize: font.size.sm }}>Yanlış</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Boş</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.primary, fontWeight: '600', fontSize: font.size.sm }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {DERSLER.map(d => {
                  const e = entries[d.key] || { dogru: 0, yanlis: 0, bos: 0 }
                  return (
                    <tr key={d.key} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: '600', color: renk.gray800 }}>{d.label}</td>
                      {['dogru', 'yanlis', 'bos'].map(alan => (
                        <td key={alan} style={{ padding: '8px' }}>
                          <input
                            type="number"
                            min="0"
                            value={entries[d.key]?.[alan] || ''}
                            onChange={ev => handleChange(d.key, alan, ev.target.value)}
                            style={{ width: '64px', padding: '7px', borderRadius: '6px', border: `1px solid ${renk.gray200}`, textAlign: 'center', fontSize: font.size.md, fontFamily: font.family, display: 'block', margin: '0 auto' }}
                          />
                        </td>
                      ))}
                      <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>
                        {net(e.dogru || 0, e.yanlis || 0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {error && <div style={{ background: renk.redLight, color: renk.red, padding: '10px 14px', borderRadius: '8px', marginTop: '16px', fontSize: font.size.md }}>{error}</div>}
          {success && <div style={{ background: renk.greenLight, color: renk.green, padding: '10px 14px', borderRadius: '8px', marginTop: '16px', fontSize: font.size.md }}>{success}</div>}

          <button onClick={handleSave} style={{ ...buton.primary, marginTop: '20px', padding: '12px 32px', fontSize: font.size.lg }}>
            Kaydet
          </button>
        </div>
      )}
    </div>
  )
}