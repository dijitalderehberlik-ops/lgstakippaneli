import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font, input, buton } from '../styles'

const DERSLER = ['turkce', 'inkılap', 'din', 'ingilizce', 'matematik', 'fen']
const DERS_LABEL = { turkce: 'Türkçe', inkılap: 'İnkılap', din: 'Din', ingilizce: 'İngilizce', matematik: 'Matematik', fen: 'Fen' }

function net(d, y) { return (d - y / 3).toFixed(2) }

export default function ExamEntry() {
  const [bolum, setBolum] = useState('ortak')

  return (
    <div style={{ fontFamily: font.family }}>
      <h2 style={{ color: renk.gray800, marginBottom: '24px' }}>Deneme Gir</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {[
          { key: 'ortak', label: '👥 Ortak Deneme' },
          { key: 'bireysel', label: '👤 Bireysel Deneme' },
        ].map(b => (
          <button key={b.key} onClick={() => setBolum(b.key)} style={{
            padding: '10px 24px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            background: bolum === b.key ? renk.primary : renk.gray100,
            color: bolum === b.key ? renk.white : renk.gray600,
            fontWeight: bolum === b.key ? '600' : '400',
            fontSize: font.size.md, fontFamily: font.family
          }}>
            {b.label}
          </button>
        ))}
      </div>

      {bolum === 'ortak' && <OrtakDeneme />}
      {bolum === 'bireysel' && <BireyselDeneme />}
    </div>
  )
}

function OrtakDeneme() {
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [results, setResults] = useState({})
  const [newExamName, setNewExamName] = useState('')
  const [newExamDate, setNewExamDate] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [editExam, setEditExam] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [editError, setEditError] = useState('')

  useEffect(() => { fetchExams(); fetchStudents() }, [])

  async function fetchExams() {
    const { data } = await supabase.from('exams').select('*').eq('type', 'common').order('date', { ascending: false })
    setExams(data || [])
  }

  async function fetchStudents() {
    const { data } = await supabase.from('students').select('*').eq('role', 'student').order('full_name')
    setStudents(data || [])
  }

  async function handleAddExam() {
    setError(''); setSuccess('')
    if (!newExamName || !newExamDate) { setError('İsim ve tarih zorunlu'); return }
    const { error } = await supabase.from('exams').insert({ name: newExamName, date: newExamDate, type: 'common' })
    if (error) { setError('Deneme eklenemedi'); return }
    setNewExamName(''); setNewExamDate('')
    setSuccess('Deneme eklendi ✓')
    fetchExams()
  }

  async function handleDeleteExam(id, name) {
    if (!window.confirm(`"${name}" silinsin mi? Tüm sonuçlar da silinir.`)) return
    await supabase.from('exam_results').delete().eq('exam_id', id)
    await supabase.from('exams').delete().eq('id', id)
    if (selectedExam === id) { setSelectedExam(''); setResults({}) }
    fetchExams()
  }

  async function handleEditExam() {
    setEditError(''); setEditSuccess('')
    if (!editName || !editDate) { setEditError('İsim ve tarih zorunlu'); return }
    const { error } = await supabase.from('exams').update({ name: editName, date: editDate }).eq('id', editExam.id)
    if (error) { setEditError('Güncellenemedi: ' + error.message); return }
    setEditSuccess('Güncellendi ✓')
    fetchExams()
  }

  async function handleExamSelect(examId) {
    setSelectedExam(examId)
    if (!examId) return
    const { data } = await supabase.from('exam_results').select('*').eq('exam_id', examId)
    const existing = {}
    data?.forEach(r => {
      existing[r.student_id] = {}
      DERSLER.forEach(d => {
        existing[r.student_id][`${d}_d`] = r[`${d}_d`] || 0
        existing[r.student_id][`${d}_y`] = r[`${d}_y`] || 0
        existing[r.student_id][`${d}_b`] = r[`${d}_b`] || 0
      })
    })
    setResults(existing)
  }

  function handleChange(studentId, ders, alan, value) {
    setResults(prev => ({ ...prev, [studentId]: { ...prev[studentId], [`${ders}_${alan}`]: parseInt(value) || 0 } }))
  }

  async function handleSave() {
    setError(''); setSuccess('')
    if (!selectedExam) { setError('Önce bir deneme seçin'); return }
    const rows = students.map(s => ({
      student_id: s.id, exam_id: selectedExam,
      ...DERSLER.reduce((acc, d) => ({
        ...acc,
        [`${d}_d`]: results[s.id]?.[`${d}_d`] || 0,
        [`${d}_y`]: results[s.id]?.[`${d}_y`] || 0,
        [`${d}_b`]: results[s.id]?.[`${d}_b`] || 0,
      }), {})
    }))
    const { error } = await supabase.from('exam_results').upsert(rows, { onConflict: 'student_id,exam_id' })
    if (error) { setError('Kaydedilemedi: ' + error.message); return }
    setSuccess('Sonuçlar kaydedildi ✓')
  }

  const selectStyle = { padding: '10px 14px', borderRadius: '8px', border: `1px solid ${renk.gray200}`, fontSize: font.size.md, fontFamily: font.family, background: renk.white, color: renk.gray800 }

  return (
    <div>
      {editExam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0005', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: renk.white, padding: '32px', borderRadius: '16px', width: '400px', boxShadow: renk.shadow }}>
            <h3 style={{ marginBottom: '20px', color: renk.gray800 }}>Deneme Düzenle</h3>
            <input placeholder="Deneme adı" value={editName} onChange={e => setEditName(e.target.value)} style={input} />
            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={input} />
            {editError && <div style={{ background: renk.redLight, color: renk.red, padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{editError}</div>}
            {editSuccess && <div style={{ background: renk.greenLight, color: renk.green, padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{editSuccess}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleEditExam} style={buton.primary}>Kaydet</button>
              <button onClick={() => { setEditExam(null); setEditSuccess(''); setEditError('') }} style={buton.secondary}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: renk.white, padding: '24px', borderRadius: '14px', border: `1px solid ${renk.gray200}`, marginBottom: '24px', maxWidth: '480px' }}>
        <h3 style={{ marginBottom: '20px', color: renk.gray800 }}>Yeni Ortak Deneme Oluştur</h3>
        <input placeholder="Deneme adı" value={newExamName} onChange={e => setNewExamName(e.target.value)} style={input} />
        <input type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} style={input} />
        {error && <div style={{ background: renk.redLight, color: renk.red, padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{error}</div>}
        {success && !selectedExam && <div style={{ background: renk.greenLight, color: renk.green, padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{success}</div>}
        <button onClick={handleAddExam} style={buton.primary}>Oluştur</button>
      </div>

      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden', maxWidth: '600px', marginBottom: '32px' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: renk.gray50 }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Deneme Adı</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Tarih</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {exams.map(e => (
              <tr key={e.id} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                <td style={{ padding: '12px 16px', color: renk.gray800, fontWeight: '500' }}>{e.name}</td>
                <td style={{ padding: '12px 16px', color: renk.gray400 }}>{e.date}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditExam(e); setEditName(e.name); setEditDate(e.date); setEditSuccess(''); setEditError('') }} style={buton.detail}>Düzenle</button>
                    <button onClick={() => handleDeleteExam(e.id, e.name)} style={buton.danger}>Sil</button>
                  </div>
                </td>
              </tr>
            ))}
            {exams.length === 0 && <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: renk.gray400 }}>Henüz deneme eklenmemiş</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontWeight: '600', color: renk.gray600 }}>Sonuç Gir:</label>
        <select value={selectedExam} onChange={e => handleExamSelect(e.target.value)} style={{ ...selectStyle, minWidth: '280px' }}>
          <option value="">-- Deneme Seçin --</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.date})</option>)}
        </select>
      </div>

      {selectedExam && (
        <div>
          <div style={{ overflowX: 'auto', background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}` }}>
            <table style={{ borderCollapse: 'collapse', fontSize: font.size.md, width: '100%' }}>
              <thead>
                <tr style={{ background: renk.gray50 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: '150px', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Öğrenci</th>
                  {DERSLER.map(d => (
                    <th key={d} colSpan={3} style={{ padding: '12px 8px', textAlign: 'center', borderLeft: `2px solid ${renk.gray200}`, color: renk.primary, fontWeight: '600', fontSize: font.size.sm }}>
                      {DERS_LABEL[d]}
                    </th>
                  ))}
                </tr>
                <tr style={{ background: renk.gray50, borderTop: `1px solid ${renk.gray100}` }}>
                  <th></th>
                  {DERSLER.map(d => (
                    <>
                      <th key={d+'d'} style={{ padding: '6px 8px', color: renk.green, fontSize: font.size.sm, fontWeight: '600' }}>D</th>
                      <th key={d+'y'} style={{ padding: '6px 8px', color: renk.red, fontSize: font.size.sm, fontWeight: '600' }}>Y</th>
                      <th key={d+'b'} style={{ padding: '6px 8px', color: renk.gray400, fontSize: font.size.sm, fontWeight: '600' }}>B</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                    <td style={{ padding: '10px 16px', fontWeight: '600', color: renk.gray800 }}>{s.full_name}</td>
                    {DERSLER.map(d => (
                      <>
                        {['d', 'y', 'b'].map(alan => (
                          <td key={d+alan} style={{ padding: '6px 4px' }}>
                            <input type="number" min="0"
                              value={results[s.id]?.[`${d}_${alan}`] || ''}
                              onChange={e => handleChange(s.id, d, alan, e.target.value)}
                              style={{ width: '48px', padding: '6px', borderRadius: '6px', border: `1px solid ${renk.gray200}`, textAlign: 'center', fontSize: font.size.md, fontFamily: font.family }}
                            />
                          </td>
                        ))}
                      </>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && <div style={{ background: renk.redLight, color: renk.red, padding: '10px 14px', borderRadius: '8px', marginTop: '16px' }}>{error}</div>}
          {success && <div style={{ background: renk.greenLight, color: renk.green, padding: '10px 14px', borderRadius: '8px', marginTop: '16px' }}>{success}</div>}
          <button onClick={handleSave} style={{ ...buton.primary, marginTop: '20px', padding: '12px 32px', fontSize: font.size.lg }}>Kaydet</button>
        </div>
      )}
    </div>
  )
}

function BireyselDeneme() {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0])
  const [results, setResults] = useState({})
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents() {
    const { data } = await supabase.from('students').select('*').eq('role', 'student').order('full_name')
    setStudents(data || [])
  }

  function handleChange(ders, alan, value) {
    setResults(prev => ({ ...prev, [`${ders}_${alan}`]: parseInt(value) || 0 }))
  }

  async function handleSave() {
    setError(''); setSuccess('')
    if (!selectedStudent) { setError('Öğrenci seçin'); return }
    if (!examName) { setError('Deneme adı girin'); return }

    const { data: examData, error: examError } = await supabase
      .from('exams')
      .insert({ name: examName, date: examDate, type: 'individual' })
      .select()
      .single()

    if (examError) { setError('Deneme oluşturulamadı: ' + examError.message); return }

    const row = {
      student_id: selectedStudent,
      exam_id: examData.id,
      ...DERSLER.reduce((acc, d) => ({
        ...acc,
        [`${d}_d`]: results[`${d}_d`] || 0,
        [`${d}_y`]: results[`${d}_y`] || 0,
        [`${d}_b`]: results[`${d}_b`] || 0,
      }), {})
    }

    const { error: resultError } = await supabase.from('exam_results').insert(row)
    if (resultError) { setError('Sonuç kaydedilemedi: ' + resultError.message); return }

    setSuccess('Bireysel deneme kaydedildi ✓')
    setExamName('')
    setResults({})
  }

  const selectStyle = { padding: '10px 14px', borderRadius: '8px', border: `1px solid ${renk.gray200}`, fontSize: font.size.md, fontFamily: font.family, background: renk.white, color: renk.gray800 }

  return (
    <div>
      <div style={{ background: renk.white, padding: '24px', borderRadius: '14px', border: `1px solid ${renk.gray200}`, marginBottom: '24px', maxWidth: '480px' }}>
        <h3 style={{ marginBottom: '20px', color: renk.gray800 }}>Bireysel Deneme Bilgileri</h3>

        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: renk.gray600, fontSize: font.size.md }}>Öğrenci</label>
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ ...selectStyle, width: '100%', marginBottom: '12px' }}>
          <option value="">-- Seçin --</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>

        <input placeholder="Deneme adı (örn: Kaya Kariyer Deneme 3)" value={examName} onChange={e => setExamName(e.target.value)} style={input} />
        <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={input} />
      </div>

      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden', maxWidth: '620px', marginBottom: '20px' }}>
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
              const dogru = results[`${d}_d`] || 0
              const yanlis = results[`${d}_y`] || 0
              return (
                <tr key={d} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                  <td style={{ padding: '10px 16px', fontWeight: '600', color: renk.gray800 }}>{DERS_LABEL[d]}</td>
                  {['d', 'y', 'b'].map(alan => (
                    <td key={alan} style={{ padding: '8px' }}>
                      <input type="number" min="0"
                        value={results[`${d}_${alan}`] || ''}
                        onChange={e => handleChange(d, alan, e.target.value)}
                        style={{ width: '64px', padding: '7px', borderRadius: '6px', border: `1px solid ${renk.gray200}`, textAlign: 'center', fontSize: font.size.md, fontFamily: font.family, display: 'block', margin: '0 auto' }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>
                    {net(dogru, yanlis)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {error && <div style={{ background: renk.redLight, color: renk.red, padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ background: renk.greenLight, color: renk.green, padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}

      <button onClick={handleSave} style={{ ...buton.primary, padding: '12px 32px', fontSize: font.size.lg }}>
        Kaydet
      </button>
    </div>
  )
}