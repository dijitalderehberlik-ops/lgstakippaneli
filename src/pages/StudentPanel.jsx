import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font, buton } from '../styles'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import BransDeneme from './BransDeneme'

const DERSLER = [
  { key: 'turkce', label: 'Türkçe' },
  { key: 'matematik', label: 'Matematik' },
  { key: 'fen', label: 'Fen' },
  { key: 'inkılap', label: 'İnkılap' },
  { key: 'ingilizce', label: 'İngilizce' },
  { key: 'din', label: 'Din' },
]

const KONULAR = {
  turkce: ['Sözcükte anlam','Cümlede anlam','Fiilimsiler','Yazım kuralları','Noktalama işaretleri','Cümlenin öğeleri','Cümle türleri','Fiilde çatı','Anlatım bozuklukları','Metin türleri','Söz sanatları','Sözel mantık'],
  matematik: ['Çarpanlar ve katlar','Üslü ifadeler','Kareköklü ifadeler','Veri analizi','Basit olayların olma olasılığı','Cebirsel ifadeler ve özdeşlikler','Doğrusal denklemler','Eşitsizlikler','Üçgenler','Eşlik ve benzerlik','Dönüşüm geometrisi','Geometrik cisimler'],
  fen: ['Mevsimler ve iklim','DNA ve genetik kod','Basınç','Madde ve endüstri','Basit makineler','Enerji dönüşümleri ve çevre bilimi','Elektrik yükleri ve elektrik enerjisi'],
  inkılap: ['Bir kahraman doğuyor','Milli uyanış: bağımsızlık yolunda atılan adımlar','Milli bir destan: "Ya İstiklal Ya Ölüm"','Atatürkçülük ve Çağdaşlaşan Türkiye','Demokratikleşme Çabaları','Atatürk Dönemi Türk Dış Politikası','Atatürkün Ölümü ve Sonrası'],
  ingilizce: ['Friendship','Teen Life','In the kitchen','On the phone','The Internet','Adventures','Tourism','Chores','Science','Natural Forces'],
  din: ['Kader inancı','Zekat ve sadaka','Din ve hayat','Hz. Muhammedin Örnekliği','Kuranı Kerim ve Özellikleri'],
}

const GUNLUK_DERSLER_TANIM = [
  { key: 'paragraf', label: 'Paragraf', konulu: false },
  { key: 'turkce', label: 'Türkçe', konulu: true },
  { key: 'matematik', label: 'Matematik', konulu: true },
  { key: 'fen', label: 'Fen', konulu: true },
  { key: 'inkılap', label: 'İnkılap', konulu: true },
  { key: 'ingilizce', label: 'İngilizce', konulu: true },
  { key: 'din', label: 'Din', konulu: true },
]

const MENU = [
  { key: 'gunluk', label: 'Çalışma', icon: '📅' },
  { key: 'denemeler', label: 'Denemeler', icon: '📝' },
  { key: 'brans', label: 'Branş', icon: '🎯' },
  { key: 'gelisim', label: 'Gelişim', icon: '📈' },
  { key: 'karsilastirma', label: 'Sınıf', icon: '📊' },
]

function net(d, y) { return parseFloat((d - y / 3).toFixed(2)) }
function toplamNet(result) {
  return DERSLER.reduce((acc, d) => acc + net(result[`${d.key}_d`] || 0, result[`${d.key}_y`] || 0), 0)
}

export default function StudentPanel({ session }) {
  const userId = session?.user?.id
  const [page, setPage] = useState('gunluk')
  const [studentName, setStudentName] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!userId) return
    supabase.from('students').select('full_name').eq('id', userId).single()
      .then(({ data }) => { if (data) setStudentName(data.full_name) })
  }, [userId])

  async function handleLogout() { await supabase.auth.signOut() }

  if (!userId) return <div style={{ padding: '40px', color: renk.gray400 }}>Oturum bulunamadı.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc', fontFamily: font.family }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#0d9488', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📚</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: isMobile ? '14px' : '16px', color: '#1e293b' }}>LGS Takip</div>
            {!isMobile && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{studentName}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{studentName}</span>}
          <button onClick={handleLogout} style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: isMobile ? '6px 10px' : '8px 14px', cursor: 'pointer', color: '#ef4444', fontSize: isMobile ? '12px' : '13px', fontFamily: font.family, fontWeight: '600' }}>
            {isMobile ? '🚪' : '🚪 Çıkış'}
          </button>
        </div>
      </div>

      {!isMobile ? (
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ width: '200px', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {MENU.map(m => (
              <button key={m.key} onClick={() => setPage(m.key)} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                background: page === m.key ? '#f0fdfa' : 'transparent',
                color: page === m.key ? '#0d9488' : '#64748b',
                fontWeight: page === m.key ? '600' : '400',
                fontSize: '14px', textAlign: 'left', fontFamily: font.family,
              }}>
                <span>{m.icon}</span> {m.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
            <PageContent page={page} userId={userId} studentName={studentName} isMobile={false} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', paddingBottom: '80px' }}>
            <PageContent page={page} userId={userId} studentName={studentName} isMobile={true} />
          </div>
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.08)' }}>
            {MENU.map(m => (
              <button key={m.key} onClick={() => setPage(m.key)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', padding: '10px 4px', border: 'none', cursor: 'pointer',
                background: 'transparent', fontFamily: font.family,
                color: page === m.key ? '#0d9488' : '#94a3b8',
                borderTop: page === m.key ? '2px solid #0d9488' : '2px solid transparent',
              }}>
                <span style={{ fontSize: '20px' }}>{m.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: page === m.key ? '700' : '400' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PageContent({ page, userId, studentName, isMobile }) {
  if (page === 'denemeler') return <Denemelerim userId={userId} isMobile={isMobile} />
  if (page === 'karsilastirma') return <SinifKarsilastirma userId={userId} isMobile={isMobile} />
  if (page === 'gunluk') return <GunlukCalisma userId={userId} isMobile={isMobile} />
  if (page === 'gelisim') return <Gelisim userId={userId} studentName={studentName} isMobile={isMobile} />
  if (page === 'brans') return <BransDeneme userId={userId} isMobile={isMobile} />
  return null
}

// ─── BİREYSEL DENEME FORMU ───────────────────────────────────────────────────
function BireyselDenemeForm({ userId, onClose, onSaved, editData }) {
  const bos = { ad: '', tarih: new Date().toISOString().split('T')[0], ...DERSLER.reduce((a, d) => ({ ...a, [`${d.key}_d`]: '', [`${d.key}_y`]: '' }), {}) }
  const [form, setForm] = useState(editData || bos)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(key, val) { setForm(p => ({ ...p, [key]: val })) }

  async function handleSave() {
    setError('')
    if (!form.ad.trim()) { setError('Deneme adı zorunlu'); return }
    if (!form.tarih) { setError('Tarih zorunlu'); return }
    setSaving(true)

    if (editData) {
      const { error: e1 } = await supabase.from('exams').update({ name: form.ad, date: form.tarih }).eq('id', editData.examId)
      if (e1) { setError('Güncellenemedi: ' + e1.message); setSaving(false); return }
      const row = DERSLER.reduce((a, d) => ({ ...a, [`${d.key}_d`]: parseInt(form[`${d.key}_d`]) || 0, [`${d.key}_y`]: parseInt(form[`${d.key}_y`]) || 0, [`${d.key}_b`]: 0 }), {})
      const { error: e2 } = await supabase.from('exam_results').update(row).eq('id', editData.resultId)
      if (e2) { setError('Güncellenemedi: ' + e2.message); setSaving(false); return }
    } else {
      const { data: examData, error: e1 } = await supabase.from('exams').insert({ name: form.ad, date: form.tarih, type: 'individual' }).select().single()
      if (e1) { setError('Deneme oluşturulamadı: ' + e1.message); setSaving(false); return }
      const row = { student_id: userId, exam_id: examData.id, ...DERSLER.reduce((a, d) => ({ ...a, [`${d.key}_d`]: parseInt(form[`${d.key}_d`]) || 0, [`${d.key}_y`]: parseInt(form[`${d.key}_y`]) || 0, [`${d.key}_b`]: 0 }), {}) }
      const { error: e2 } = await supabase.from('exam_results').insert(row)
      if (e2) { setError('Kaydedilemedi: ' + e2.message); setSaving(false); return }
    }

    setSaving(false)
    onSaved()
  }

  const inputS = { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: font.family, width: '100%', boxSizing: 'border-box', color: '#1e293b' }
  const numS = { padding: '10px 4px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '15px', fontFamily: font.family, width: '100%', boxSizing: 'border-box' }

  const topD = DERSLER.reduce((a, d) => a + (parseInt(form[`${d.key}_d`]) || 0), 0)
  const topY = DERSLER.reduce((a, d) => a + (parseInt(form[`${d.key}_y`]) || 0), 0)

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0007', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 200, overflowY: 'auto', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>{editData ? '✏️ Deneme Düzenle' : '➕ Bireysel Deneme Ekle'}</h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#64748b', fontFamily: font.family }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Deneme Adı *</label>
              <input value={form.ad} onChange={e => handleChange('ad', e.target.value)} placeholder="örn: Karekök Deneme 5" style={inputS} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Tarih *</label>
              <input type="date" value={form.tarih} onChange={e => handleChange('tarih', e.target.value)} style={{ ...inputS, width: 'auto' }} />
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', padding: '8px 12px', background: '#e2e8f0', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>DERS</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', textAlign: 'center' }}>DOĞRU</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', textAlign: 'center' }}>YANLIŞ</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0d9488', textAlign: 'center' }}>NET</span>
            </div>
            {DERSLER.map(d => {
              const dd = parseInt(form[`${d.key}_d`]) || 0
              const yy = parseInt(form[`${d.key}_y`]) || 0
              return (
                <div key={d.key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', padding: '8px 12px', borderTop: '1px solid #e2e8f0', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{d.label}</span>
                  <input type="number" min="0" value={form[`${d.key}_d`]} onChange={e => handleChange(`${d.key}_d`, e.target.value)} style={numS} />
                  <input type="number" min="0" value={form[`${d.key}_y`]} onChange={e => handleChange(`${d.key}_y`, e.target.value)} style={numS} />
                  <div style={{ background: '#f0fdfa', borderRadius: '6px', padding: '10px 4px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#0d9488' }}>{net(dd, yy)}</div>
                </div>
              )
            })}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', padding: '10px 12px', background: '#0d9488', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Toplam</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{topD}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{topY}</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', textAlign: 'center' }}>{net(topD, topY)}</span>
            </div>
          </div>

          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', fontFamily: font.family }}>
              {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
            </button>
            <button onClick={onClose} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: font.family }}>İptal</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DENEMELERİM ─────────────────────────────────────────────────────────────
function Denemelerim({ userId, isMobile }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [formAcik, setFormAcik] = useState(false)
  const [editData, setEditData] = useState(null)
  const [silOnay, setSilOnay] = useState(null)
  const [filtre, setFiltre] = useState('tumu')

  useEffect(() => { if (userId) yukle() }, [userId])

  async function yukle() {
    const { data } = await supabase.from('exam_results').select('*, exams(name, date, type)').eq('student_id', userId)
    setResults(data || [])
    setLoading(false)
  }

  async function handleSil(r) {
    await supabase.from('exam_results').delete().eq('id', r.id)
    if (r.exams?.type === 'individual') {
      await supabase.from('exams').delete().eq('id', r.exam_id)
    }
    setSilOnay(null)
    yukle()
  }

  function handleDuzenle(r) {
    setEditData({
      examId: r.exam_id,
      resultId: r.id,
      ad: r.exams?.name || '',
      tarih: r.exams?.date || '',
      ...DERSLER.reduce((a, d) => ({ ...a, [`${d.key}_d`]: r[`${d.key}_d`] || 0, [`${d.key}_y`]: r[`${d.key}_y`] || 0 }), {}),
    })
    setFormAcik(true)
  }

  if (loading) return <p style={{ color: renk.gray400 }}>Yükleniyor...</p>

  const filtrelenmis = [...results]
    .filter(r => filtre === 'tumu' ? true : filtre === 'ortak' ? r.exams?.type === 'common' : r.exams?.type === 'individual')
    .sort((a, b) => new Date(a.exams?.date) - new Date(b.exams?.date))

  return (
    <div>
      {(formAcik) && (
        <BireyselDenemeForm
          userId={userId}
          editData={editData}
          onClose={() => { setFormAcik(false); setEditData(null) }}
          onSaved={() => { setFormAcik(false); setEditData(null); yukle() }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1e293b', margin: 0, fontSize: isMobile ? '18px' : '22px' }}>📝 Denemelerim</h2>
        <button onClick={() => { setEditData(null); setFormAcik(true) }} style={{ padding: '9px 18px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: font.family }}>
          ➕ Bireysel Deneme Ekle
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[{ key: 'tumu', label: 'Tümü' }, { key: 'ortak', label: '👥 Ortak' }, { key: 'bireysel', label: '👤 Bireysel' }].map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)} style={{
            padding: '7px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontFamily: font.family, fontSize: '13px',
            background: filtre === f.key ? '#0d9488' : '#f1f5f9',
            color: filtre === f.key ? '#fff' : '#64748b',
            fontWeight: filtre === f.key ? '700' : '400',
          }}>{f.label}</button>
        ))}
      </div>

      {filtrelenmis.length === 0 ? (
        <p style={{ color: renk.gray400 }}>Henüz deneme sonucu yok.</p>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtrelenmis.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{r.exams?.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{r.exams?.date}</div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: r.exams?.type === 'common' ? '#f0fdfa' : '#fff7ed', color: r.exams?.type === 'common' ? '#0d9488' : '#ea580c', fontWeight: '600', display: 'inline-block', marginTop: '4px' }}>
                    {r.exams?.type === 'common' ? 'Ortak' : 'Bireysel'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#0d9488' }}>{toplamNet(r).toFixed(1)}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>toplam net</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
                {DERSLER.map(d => (
                  <div key={d.key} style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>{d.label}</div>
                    <div style={{ fontWeight: '700', color: '#0d9488', fontSize: '14px' }}>{net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)}</div>
                  </div>
                ))}
              </div>
              {r.exams?.type === 'individual' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {silOnay === r.id ? (
                    <>
                      <span style={{ fontSize: '12px', color: '#ef4444', alignSelf: 'center' }}>Silinsin mi?</span>
                      <button onClick={() => handleSil(r)} style={{ padding: '6px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: font.family, fontWeight: '700' }}>Evet</button>
                      <button onClick={() => setSilOnay(null)} style={{ padding: '6px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: font.family }}>İptal</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleDuzenle(r)} style={{ flex: 1, padding: '8px', background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: font.family, fontWeight: '600' }}>✏️ Düzenle</button>
                      <button onClick={() => setSilOnay(r.id)} style={{ flex: 1, padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: font.family, fontWeight: '600' }}>🗑️ Sil</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Deneme</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Tarih</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Tür</th>
                {DERSLER.map(d => <th key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>{d.label}</th>)}
                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#0d9488', fontWeight: '600', fontSize: '13px' }}>Toplam</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '500' }}>{r.exams?.name}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{r.exams?.date}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: r.exams?.type === 'common' ? '#f0fdfa' : '#fff7ed', color: r.exams?.type === 'common' ? '#0d9488' : '#ea580c', fontWeight: '600' }}>
                      {r.exams?.type === 'common' ? 'Ortak' : 'Bireysel'}
                    </span>
                  </td>
                  {DERSLER.map(d => <td key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: '#64748b' }}>{net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)}</td>)}
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#0d9488' }}>{toplamNet(r).toFixed(2)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {r.exams?.type === 'individual' && (
                      silOnay === r.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#ef4444' }}>Silinsin mi?</span>
                          <button onClick={() => handleSil(r)} style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: font.family, fontWeight: '700' }}>Evet</button>
                          <button onClick={() => setSilOnay(null)} style={{ padding: '4px 10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: font.family }}>İptal</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleDuzenle(r)} style={{ padding: '5px 12px', background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: font.family, fontWeight: '600' }}>✏️</button>
                          <button onClick={() => setSilOnay(r.id)} style={{ padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: font.family, fontWeight: '600' }}>🗑️</button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── SINIF KARŞILAŞTIRMA ─────────────────────────────────────────────────────
function SinifKarsilastirma({ userId, isMobile }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function fetchData() {
      const { data: exams } = await supabase.from('exams').select('*').eq('type', 'common').order('date', { ascending: false }).limit(1)
      if (!exams || exams.length === 0) { setLoading(false); return }
      const exam = exams[0]
      const { data: allResults } = await supabase.from('exam_results').select('*').eq('exam_id', exam.id)
      const myResult = allResults?.find(r => r.student_id === userId)
      const others = allResults || []
      const sinifOrtalama = DERSLER.map(d => {
        const list = others.map(r => net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0))
        return { label: d.label, sinif: list.length > 0 ? (list.reduce((a, b) => a + b, 0) / list.length).toFixed(2) : 0, ben: myResult ? net(myResult[`${d.key}_d`] || 0, myResult[`${d.key}_y`] || 0) : '-' }
      })
      const tumNetler = others.map(r => toplamNet(r))
      setData({ exam, sinifOrtalama, sinifTopOrtalama: tumNetler.length > 0 ? (tumNetler.reduce((a, b) => a + b, 0) / tumNetler.length).toFixed(2) : 0, benimTop: myResult ? toplamNet(myResult).toFixed(2) : '-' })
      setLoading(false)
    }
    fetchData()
  }, [userId])

  if (loading) return <p style={{ color: renk.gray400 }}>Yükleniyor...</p>
  if (!data) return <div><h2 style={{ color: '#1e293b', fontSize: isMobile ? '18px' : '22px' }}>📊 Sınıf Karşılaştırma</h2><p style={{ color: renk.gray400 }}>Henüz ortak deneme yok.</p></div>

  return (
    <div>
      <h2 style={{ color: '#1e293b', marginBottom: '8px', fontSize: isMobile ? '18px' : '22px' }}>📊 Sınıf Karşılaştırma</h2>
      <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '13px' }}>Son deneme: <strong style={{ color: '#0d9488' }}>{data.exam.name}</strong></p>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: '#f0fdfa', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Benim Netim</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0d9488' }}>{data.benimTop}</div>
        </div>
        <div style={{ flex: 1, background: '#f8fafc', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Sınıf Ort.</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#64748b' }}>{data.sinifTopOrtalama}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.sinifOrtalama.map(d => (
          <div key={d.label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{d.label}</span>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Ben</div>
                <div style={{ fontWeight: '700', color: '#0d9488', fontSize: '16px' }}>{d.ben}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Sınıf</div>
                <div style={{ fontWeight: '600', color: '#64748b', fontSize: '16px' }}>{d.sinif}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── GÜNLÜK ÇALIŞMA ───────────────────────────────────────────────────────────
function GunlukCalisma({ userId, isMobile }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [satirlar, setSatirlar] = useState([{ ders: '', konu: '', dogru: '', yanlis: '', bos: '' }])
  const [mevcutKayitlar, setMevcutKayitlar] = useState([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [duzenleId, setDuzenleId] = useState(null)
  const [duzenleData, setDuzenleData] = useState(null)
  const [silOnay, setSilOnay] = useState(null)

  useEffect(() => {
    if (!userId || !date) return
    kayitlariYukle()
  }, [userId, date])

  async function kayitlariYukle() {
    const { data } = await supabase.from('daily_study').select('*').eq('student_id', userId).eq('date', date).order('id')
    setMevcutKayitlar(data || [])
  }

  function handleSatirChange(i, alan, value) {
    setSatirlar(prev => {
      const yeni = [...prev]
      yeni[i] = { ...yeni[i], [alan]: value }
      if (alan === 'ders') yeni[i].konu = ''
      return yeni
    })
  }

  function handleEkle() { setSatirlar(prev => [...prev, { ders: '', konu: '', dogru: '', yanlis: '', bos: '' }]) }
  function handleSatirSil(i) { setSatirlar(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSave() {
    setError(''); setSuccess('')
    const gecerli = satirlar.filter(s => s.ders)
    if (gecerli.length === 0) { setError('En az bir ders seçin'); return }
    const rows = gecerli.map(s => ({
      student_id: userId, date, lesson: s.ders,
      topic: s.ders === 'paragraf' ? null : (s.konu || null),
      dogru: parseInt(s.dogru) || 0, yanlis: parseInt(s.yanlis) || 0, bos: parseInt(s.bos) || 0,
    }))
    const { error: err } = await supabase.from('daily_study').insert(rows)
    if (err) { setError('Kaydedilemedi: ' + err.message); return }
    setSuccess('Kaydedildi ✓')
    setSatirlar([{ ders: '', konu: '', dogru: '', yanlis: '', bos: '' }])
    kayitlariYukle()
  }

  function handleDuzenleAc(k) {
    setDuzenleId(k.id)
    setDuzenleData({ ders: k.lesson, konu: k.topic || '', dogru: k.dogru ?? 0, yanlis: k.yanlis ?? 0, bos: k.bos ?? 0 })
    setSilOnay(null)
  }

  async function handleDuzenleSave() {
    const { error: err } = await supabase.from('daily_study').update({
      lesson: duzenleData.ders,
      topic: duzenleData.ders === 'paragraf' ? null : (duzenleData.konu || null),
      dogru: parseInt(duzenleData.dogru) || 0,
      yanlis: parseInt(duzenleData.yanlis) || 0,
      bos: parseInt(duzenleData.bos) || 0,
    }).eq('id', duzenleId)
    if (err) { setError('Güncellenemedi: ' + err.message); return }
    setDuzenleId(null); setDuzenleData(null)
    setSuccess('Güncellendi ✓')
    kayitlariYukle()
  }

  async function handleSil(id) {
    const { error: err } = await supabase.from('daily_study').delete().eq('id', id)
    if (err) { setError('Silinemedi: ' + err.message); return }
    setSilOnay(null)
    setSuccess('Kayıt silindi ✓')
    kayitlariYukle()
  }

  const selectStyle = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: font.family, background: '#fff', color: '#1e293b', boxSizing: 'border-box' }
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '16px', fontFamily: font.family, background: '#fff', boxSizing: 'border-box' }

  const dersGruplari = GUNLUK_DERSLER_TANIM.map(d => {
    const kayitlar = mevcutKayitlar.filter(k => k.lesson === d.key)
    if (kayitlar.length === 0) return null
    const topD = kayitlar.reduce((a, k) => a + (k.dogru || 0), 0)
    const topY = kayitlar.reduce((a, k) => a + (k.yanlis || 0), 0)
    const topB = kayitlar.reduce((a, k) => a + (k.bos || 0), 0)
    return { key: d.key, label: d.label, kayitlar, topD, topY, topB, topSoru: topD + topY + topB }
  }).filter(Boolean)

  const gunTopD = dersGruplari.reduce((a, d) => a + d.topD, 0)
  const gunTopY = dersGruplari.reduce((a, d) => a + d.topY, 0)
  const gunTopB = dersGruplari.reduce((a, d) => a + d.topB, 0)
  const gunTopSoru = gunTopD + gunTopY + gunTopB

  const duzenleDersObj = duzenleData ? GUNLUK_DERSLER_TANIM.find(d => d.key === duzenleData.ders) : null
  const duzenleKonular = duzenleDersObj?.konulu ? (KONULAR[duzenleData.ders] || []) : []

  return (
    <div>
      <h2 style={{ color: '#1e293b', marginBottom: '20px', fontSize: isMobile ? '18px' : '22px' }}>📅 Günlük Çalışma</h2>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#64748b', fontSize: '13px' }}>Tarih</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...selectStyle, width: 'auto' }} />
      </div>

      {dersGruplari.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f0fdfa', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#0f766e', fontSize: '13px' }}>Bu tarihe ait kayıtlar</div>
          {dersGruplari.map(d => (
            <div key={d.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ padding: '10px 16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{d.label}</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{d.topSoru} soru</span>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>D:{d.topD}</span>
                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>Y:{d.topY}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>B:{d.topB}</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0d9488' }}>{net(d.topD, d.topY)}</span>
                </div>
              </div>
              {d.kayitlar.map(k => (
                <div key={k.id}>
                  {duzenleId === k.id ? (
                    <div style={{ padding: '14px 16px', background: '#fffbeb', borderTop: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                        <select value={duzenleData.ders} onChange={e => setDuzenleData(p => ({ ...p, ders: e.target.value, konu: '' }))} style={selectStyle}>
                          {GUNLUK_DERSLER_TANIM.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                        </select>
                        {duzenleDersObj?.konulu && (
                          <select value={duzenleData.konu} onChange={e => setDuzenleData(p => ({ ...p, konu: e.target.value }))} style={selectStyle}>
                            <option value="">Konu seç</option>
                            {duzenleKonular.map(kk => <option key={kk} value={kk}>{kk}</option>)}
                          </select>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {[{ key: 'dogru', label: 'Doğru ✅', color: '#10b981' }, { key: 'yanlis', label: 'Yanlış ❌', color: '#ef4444' }, { key: 'bos', label: 'Boş ⬜', color: '#94a3b8' }].map(alan => (
                            <div key={alan.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '11px', fontWeight: '600', color: alan.color, textAlign: 'center' }}>{alan.label}</label>
                              <input type="number" min="0" value={duzenleData[alan.key]} onChange={e => setDuzenleData(p => ({ ...p, [alan.key]: e.target.value }))} style={inputStyle} />
                            </div>
                          ))}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#0d9488', textAlign: 'center' }}>Net 🎯</label>
                            <div style={{ padding: '10px', borderRadius: '8px', background: '#f0fdfa', textAlign: 'center', fontSize: '16px', fontWeight: '700', color: '#0d9488' }}>
                              {net(parseInt(duzenleData.dogru) || 0, parseInt(duzenleData.yanlis) || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleDuzenleSave} style={{ flex: 1, padding: '9px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: font.family }}>Kaydet</button>
                        <button onClick={() => { setDuzenleId(null); setDuzenleData(null) }} style={{ flex: 1, padding: '9px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: font.family }}>İptal</button>
                      </div>
                    </div>
                  ) : silOnay === k.id ? (
                    <div style={{ padding: '12px 16px', background: '#fef2f2', borderTop: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>Bu kayıt silinsin mi?</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleSil(k.id)} style={{ padding: '7px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: font.family }}>Evet, Sil</button>
                        <button onClick={() => setSilOnay(null)} style={{ padding: '7px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: font.family }}>İptal</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 16px 8px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', flex: 1 }}>{k.topic || (k.lesson === 'paragraf' ? 'Paragraf' : '—')}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{(k.dogru||0)+(k.yanlis||0)+(k.bos||0)} soru</span>
                        <span style={{ fontSize: '11px', color: '#10b981' }}>D:{k.dogru}</span>
                        <span style={{ fontSize: '11px', color: '#ef4444' }}>Y:{k.yanlis}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>B:{k.bos}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#0d9488' }}>{net(k.dogru||0, k.yanlis||0)}</span>
                        <button onClick={() => handleDuzenleAc(k)} style={{ padding: '4px 10px', background: '#f0fdfa', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#0d9488', fontWeight: '600', fontFamily: font.family }}>✏️ Düzenle</button>
                        <button onClick={() => { setSilOnay(k.id); setDuzenleId(null); setDuzenleData(null) }} style={{ padding: '4px 10px', background: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#ef4444', fontWeight: '600', fontFamily: font.family }}>🗑️ Sil</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div style={{ padding: '12px 16px', background: '#0d9488', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>Günlük Toplam</span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#ccfbf1', fontWeight: '600' }}>{gunTopSoru} soru</span>
              <span style={{ fontSize: '12px', color: '#86efac', fontWeight: '600' }}>D:{gunTopD}</span>
              <span style={{ fontSize: '12px', color: '#fca5a5', fontWeight: '600' }}>Y:{gunTopY}</span>
              <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>B:{gunTopB}</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{net(gunTopD, gunTopY)}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontWeight: '600', color: '#64748b', marginBottom: '16px', fontSize: '13px' }}>Yeni Kayıt</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {satirlar.map((satir, i) => {
            const dersObj = GUNLUK_DERSLER_TANIM.find(d => d.key === satir.ders)
            const konular = dersObj?.konulu ? (KONULAR[satir.ders] || []) : []
            return (
              <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Kayıt {i + 1}</span>
                  {satirlar.length > 1 && (
                    <button onClick={() => handleSatirSil(i)} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Sil</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <select value={satir.ders} onChange={e => handleSatirChange(i, 'ders', e.target.value)} style={selectStyle}>
                    <option value="">Ders seç</option>
                    {GUNLUK_DERSLER_TANIM.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                  {satir.ders && dersObj?.konulu && (
                    <select value={satir.konu} onChange={e => handleSatirChange(i, 'konu', e.target.value)} style={selectStyle}>
                      <option value="">Konu seç</option>
                      {konular.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[{ key: 'dogru', label: 'Doğru ✅', color: '#10b981' }, { key: 'yanlis', label: 'Yanlış ❌', color: '#ef4444' }, { key: 'bos', label: 'Boş ⬜', color: '#94a3b8' }].map(alan => (
                      <div key={alan.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: alan.color, textAlign: 'center' }}>{alan.label}</label>
                        <input type="number" min="0" value={satir[alan.key]} onChange={e => handleSatirChange(i, alan.key, e.target.value)} style={inputStyle} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#0d9488', textAlign: 'center' }}>Net 🎯</label>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f0fdfa', textAlign: 'center', fontSize: '16px', fontWeight: '700', color: '#0d9488' }}>
                        {net(parseInt(satir.dogru) || 0, parseInt(satir.yanlis) || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={handleEkle} style={{ marginTop: '12px', width: '100%', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '10px', padding: '12px', cursor: 'pointer', color: '#64748b', fontFamily: font.family, fontSize: '14px' }}>+ Kayıt Ekle</button>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
      {success && <div style={{ background: '#f0fdf4', color: '#10b981', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}
      <button onClick={handleSave} style={{ width: '100%', padding: '14px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', fontFamily: font.family }}>Kaydet</button>
    </div>
  )
}

// ─── GELİŞİM ─────────────────────────────────────────────────────────────────
function Gelisim({ userId, studentName, isMobile }) {
  const [results, setResults] = useState([])
  const [dailyStudy, setDailyStudy] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('tumu')

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('exam_results').select('*, exams(name, date, type)').eq('student_id', userId).order('exams(date)', { ascending: true }),
      supabase.from('daily_study').select('*').eq('student_id', userId),
    ]).then(([r1, r2]) => {
      setResults(r1.data || [])
      setDailyStudy(r2.data || [])
      setLoading(false)
    })
  }, [userId])

  if (loading) return <p style={{ color: renk.gray400 }}>Yükleniyor...</p>

  const filtrelenmis = [...results]
    .filter(r => filtre === 'tumu' ? true : filtre === 'ortak' ? r.exams?.type === 'common' : r.exams?.type === 'individual')
    .sort((a, b) => new Date(a.exams?.date) - new Date(b.exams?.date))

  const sonResult = filtrelenmis[filtrelenmis.length - 1]
  const ilkNet = filtrelenmis.length > 0 ? toplamNet(filtrelenmis[0]) : 0
  const sonNet = filtrelenmis.length > 0 ? toplamNet(sonResult) : 0
  const toplamFark = parseFloat((sonNet - ilkNet).toFixed(2))
  const trendData = filtrelenmis.map(r => ({ name: r.exams?.name, net: parseFloat(toplamNet(r).toFixed(2)) }))

  function konuSkoru(dogru, yanlis, bos) {
    const toplam = dogru + yanlis + bos
    if (toplam === 0) return 0
    const basari = Math.round((dogru / toplam) * 100)
    return Math.round(Math.min(toplam / 200, 1) * Math.min(basari / 80, 1) * 100)
  }

  const dersIlerleme = DERSLER.map(d => {
    const konular = KONULAR[d.key] || []
    const konuSkorlar = konular.map(konu => {
      const kayitlar = dailyStudy.filter(k => k.lesson === d.key && k.topic === konu)
      const topD = kayitlar.reduce((a, k) => a + (k.dogru || 0), 0)
      const topY = kayitlar.reduce((a, k) => a + (k.yanlis || 0), 0)
      const topB = kayitlar.reduce((a, k) => a + (k.bos || 0), 0)
      return konuSkoru(topD, topY, topB)
    })
    const genelYuzde = konular.length > 0 ? Math.round(konuSkorlar.reduce((a, k) => a + k, 0) / konular.length) : 0
    return { ...d, genelYuzde }
  })
  const genelToplam = Math.round(dersIlerleme.reduce((a, d) => a + d.genelYuzde, 0) / DERSLER.length)

  function barRenk(y) {
    if (y >= 80) return '#10b981'
    if (y >= 50) return '#f59e0b'
    if (y > 0) return '#0d9488'
    return '#e2e8f0'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1e293b', margin: 0, fontSize: isMobile ? '18px' : '22px' }}>📈 Gelişimim</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[{ key: 'tumu', label: 'Tümü' }, { key: 'ortak', label: '👥 Ortak' }, { key: 'bireysel', label: '👤 Bireysel' }].map(f => (
            <button key={f.key} onClick={() => setFiltre(f.key)} style={{
              padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontFamily: font.family, fontSize: '12px',
              background: filtre === f.key ? '#0d9488' : '#f1f5f9',
              color: filtre === f.key ? '#fff' : '#64748b',
              fontWeight: filtre === f.key ? '700' : '400',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {filtrelenmis.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#f0fdfa', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0d9488' }}>{sonNet.toFixed(1)}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Son Net</div>
          </div>
          <div style={{ background: toplamFark >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: toplamFark >= 0 ? '#10b981' : '#ef4444' }}>{toplamFark >= 0 ? '+' : ''}{toplamFark}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Gelişim</div>
          </div>
          <div style={{ background: '#fff7ed', borderRadius: '14px', padding: '16px', textAlign: 'center', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ea580c' }}>{filtrelenmis.length}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Deneme</div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>📚 Müfredat</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Sadece gerçek veri</div>
          </div>
          <div style={{ textAlign: 'center', background: '#f0fdfa', borderRadius: '10px', padding: '8px 14px' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0d9488' }}>{genelToplam}%</div>
          </div>
        </div>
        {dersIlerleme.map(d => (
          <div key={d.key} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{d.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: barRenk(d.genelYuzde) }}>{d.genelYuzde}%</span>
            </div>
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${d.genelYuzde}%`, background: barRenk(d.genelYuzde), borderRadius: '4px', transition: 'width 0.5s' }} />
            </div>
          </div>
        ))}
      </div>

      {trendData.length >= 2 && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px', marginBottom: '16px' }}>📈 Net Gelişimi</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Line type="monotone" dataKey="net" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {filtrelenmis.length === 0 && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
          Bu filtrede henüz deneme verisi yok.
        </div>
      )}
    </div>
  )
}
