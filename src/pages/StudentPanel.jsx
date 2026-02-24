import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font, buton } from '../styles'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

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

const BRANS_RENKLER = {
  'Türkçe': '#0d9488', 'Matematik': '#6366f1', 'Fen': '#f59e0b',
  'İnkılap': '#ec4899', 'İngilizce': '#10b981', 'Din': '#8b5cf6',
}

const MENU = [
  { key: 'gunluk', label: 'Çalışma', icon: '📅' },
  { key: 'denemeler', label: 'Denemeler', icon: '📝' },
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
      {/* Üst başlık */}
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
  return null
}

function Denemelerim({ userId, isMobile }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase.from('exam_results').select('*, exams(name, date, type)').eq('student_id', userId).order('exams(date)', { ascending: false })
      .then(({ data }) => { setResults(data || []); setLoading(false) })
  }, [userId])

  if (loading) return <p style={{ color: renk.gray400 }}>Yükleniyor...</p>

  const tumDenemeler = [...results].sort((a, b) => new Date(a.exams?.date) - new Date(b.exams?.date))

  return (
    <div>
      <h2 style={{ color: '#1e293b', marginBottom: '20px', fontSize: isMobile ? '18px' : '22px' }}>📝 Denemelerim</h2>
      {results.length === 0 ? <p style={{ color: renk.gray400 }}>Henüz deneme sonucun yok.</p> : (
        isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tumDenemeler.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{r.exams?.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{r.exams?.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#0d9488' }}>{toplamNet(r).toFixed(1)}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>toplam net</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {DERSLER.map(d => (
                    <div key={d.key} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{d.label}</div>
                      <div style={{ fontWeight: '700', color: '#0d9488', fontSize: '15px' }}>{net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)}</div>
                    </div>
                  ))}
                </div>
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
                  {DERSLER.map(d => <th key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>{d.label}</th>)}
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: '#0d9488', fontWeight: '600', fontSize: '13px' }}>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {tumDenemeler.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '500' }}>{r.exams?.name}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{r.exams?.date}</td>
                    {DERSLER.map(d => <td key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: '#64748b' }}>{net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)}</td>)}
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#0d9488' }}>{toplamNet(r).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

function SinifKarsilastirma({ userId, isMobile }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function fetch() {
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
    fetch()
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

function GunlukCalisma({ userId, isMobile }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [satirlar, setSatirlar] = useState([{ ders: '', konu: '', dogru: '', yanlis: '', bos: '' }])
  const [mevcutKayitlar, setMevcutKayitlar] = useState([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId || !date) return
    supabase.from('daily_study').select('*').eq('student_id', userId).eq('date', date).order('id')
      .then(({ data }) => setMevcutKayitlar(data || []))
  }, [userId, date])

  function handleSatirChange(i, alan, value) {
    setSatirlar(prev => {
      const yeni = [...prev]
      yeni[i] = { ...yeni[i], [alan]: value }
      if (alan === 'ders') yeni[i].konu = ''
      return yeni
    })
  }

  function handleEkle() { setSatirlar(prev => [...prev, { ders: '', konu: '', dogru: '', yanlis: '', bos: '' }]) }
  function handleSil(i) { setSatirlar(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSave() {
    setError(''); setSuccess('')
    const gecerli = satirlar.filter(s => s.ders)
    if (gecerli.length === 0) { setError('En az bir ders seçin'); return }
    const rows = gecerli.map(s => ({
      student_id: userId, date, lesson: s.ders,
      topic: s.ders === 'paragraf' ? null : (s.konu || null),
      dogru: parseInt(s.dogru) || 0, yanlis: parseInt(s.yanlis) || 0, bos: parseInt(s.bos) || 0,
    }))
    const { error } = await supabase.from('daily_study').insert(rows)
    if (error) { setError('Kaydedilemedi: ' + error.message); return }
    setSuccess('Kaydedildi ✓')
    setSatirlar([{ ders: '', konu: '', dogru: '', yanlis: '', bos: '' }])
    const { data } = await supabase.from('daily_study').select('*').eq('student_id', userId).eq('date', date).order('id')
    setMevcutKayitlar(data || [])
  }

  const selectStyle = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: font.family, background: '#fff', color: '#1e293b' }

  return (
    <div>
      <h2 style={{ color: '#1e293b', marginBottom: '20px', fontSize: isMobile ? '18px' : '22px' }}>📅 Günlük Çalışma</h2>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#64748b', fontSize: '13px' }}>Tarih</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...selectStyle, width: 'auto' }} />
      </div>

      {mevcutKayitlar.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f0fdfa', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#0f766e', fontSize: '13px' }}>Bu tarihe ait kayıtlar</div>
          {mevcutKayitlar.map(k => {
            const dersLabel = GUNLUK_DERSLER_TANIM.find(d => d.key === k.lesson)?.label || k.lesson
            return (
              <div key={k.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{dersLabel}</div>
                  {k.topic && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{k.topic}</div>}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#10b981' }}>D:{k.dogru}</span>
                  <span style={{ fontSize: '12px', color: '#ef4444' }}>Y:{k.yanlis}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>B:{k.bos}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d9488' }}>{net(k.dogru, k.yanlis)}</span>
                </div>
              </div>
            )
          })}
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
                    <button onClick={() => handleSil(i)} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Sil</button>
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
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '8px' }}>
                    {[
                      { key: 'dogru', label: 'Doğru', color: '#10b981' },
                      { key: 'yanlis', label: 'Yanlış', color: '#ef4444' },
                      { key: 'bos', label: 'Boş', color: '#94a3b8' },
                    ].map(alan => (
                      <div key={alan.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: alan.color, textAlign: 'center' }}>{alan.label}</label>
                        <input type="number" min="0" value={satir[alan.key]} onChange={e => handleSatirChange(i, alan.key, e.target.value)}
                          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '16px', fontFamily: font.family, background: '#fff' }} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#0d9488', textAlign: 'center' }}>Net</label>
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

function Gelisim({ userId, studentName, isMobile }) {
  const [results, setResults] = useState([])
  const [dailyStudy, setDailyStudy] = useState([])
  const [loading, setLoading] = useState(true)

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

  const tumDenemeler = [...results].sort((a, b) => new Date(a.exams?.date) - new Date(b.exams?.date))
  const sonResult = tumDenemeler[tumDenemeler.length - 1]
  const ilkNet = results.length > 0 ? toplamNet(tumDenemeler[0]) : 0
  const sonNet = results.length > 0 ? toplamNet(sonResult) : 0
  const toplamFark = parseFloat((sonNet - ilkNet).toFixed(2))
  const trendData = tumDenemeler.map(r => ({ name: r.exams?.name, net: parseFloat(toplamNet(r).toFixed(2)) }))

  function konuSkoru(dogru, yanlis, bos) {
    const toplam = dogru + yanlis + bos
    if (toplam === 0) return 0
    const basari = Math.round((dogru / toplam) * 100)
    return Math.round(Math.min(toplam / 200, 1) * Math.min(basari / 80, 1) * 100)
  }

  const dersIlerleme = DERSLER.map(d => {
    const konular = Object.keys(KONULAR).includes(d.key) ? KONULAR[d.key] : []
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
      <h2 style={{ color: '#1e293b', marginBottom: '16px', fontSize: isMobile ? '18px' : '22px' }}>📈 Gelişimim</h2>

      {results.length > 0 && (
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
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ea580c' }}>{results.length}</div>
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
    </div>
  )
}