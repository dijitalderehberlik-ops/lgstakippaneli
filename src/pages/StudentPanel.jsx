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

function net(d, y) { return parseFloat((d - y / 3).toFixed(2)) }

function toplamNet(result) {
  return DERSLER.reduce((acc, d) => acc + net(result[`${d.key}_d`] || 0, result[`${d.key}_y`] || 0), 0)
}

export default function StudentPanel({ session }) {
  const userId = session?.user?.id
  const [page, setPage] = useState('denemeler')
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    if (!userId) return
    supabase.from('students').select('full_name').eq('id', userId).single()
      .then(({ data }) => { if (data) setStudentName(data.full_name) })
  }, [userId])

  async function handleLogout() { await supabase.auth.signOut() }

  const menu = [
    { key: 'denemeler', label: 'Denemelerim', icon: '📝' },
    { key: 'karsilastirma', label: 'Sınıf Karşılaştırma', icon: '📊' },
    { key: 'gunluk', label: 'Günlük Çalışma', icon: '📅' },
    { key: 'gelisim', label: 'Gelişimim', icon: '📈' },
  ]

  if (!userId) return <div style={{ padding: '40px', color: renk.gray400 }}>Oturum bulunamadı.</div>

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: font.family, background: renk.gray50 }}>
      <div style={{ width: '220px', background: renk.white, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: `1px solid ${renk.gray200}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: '0 8px' }}>
          <div style={{ width: '36px', height: '36px', background: renk.primary, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📚</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: font.size.lg, color: renk.gray800 }}>LGS Takip</div>
            <div style={{ fontSize: font.size.sm, color: renk.gray400 }}>{studentName}</div>
          </div>
        </div>
        {menu.map(m => (
          <button key={m.key} onClick={() => setPage(m.key)} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            background: page === m.key ? renk.primaryLight : 'transparent',
            color: page === m.key ? renk.primaryDark : renk.gray600,
            fontWeight: page === m.key ? '600' : '400',
            fontSize: font.size.md, textAlign: 'left', fontFamily: font.family,
          }}>
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: renk.redLight, border: 'none', borderRadius: '10px', cursor: 'pointer', color: renk.red, fontSize: font.size.md, fontFamily: font.family }}>
          🚪 Çıkış Yap
        </button>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {page === 'denemeler' && <Denemelerim userId={userId} />}
        {page === 'karsilastirma' && <SinifKarsilastirma userId={userId} />}
        {page === 'gunluk' && <GunlukCalisma userId={userId} />}
        {page === 'gelisim' && <Gelisim userId={userId} studentName={studentName} />}
      </div>
    </div>
  )
}

function Denemelerim({ userId }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase.from('exam_results').select('*, exams(name, date, type)').eq('student_id', userId).order('exams(date)', { ascending: false })
      .then(({ data }) => { setResults(data || []); setLoading(false) })
  }, [userId])

  if (loading) return <p style={{ color: renk.gray400 }}>Yükleniyor...</p>

  return (
    <div>
      <h2 style={{ color: renk.gray800, marginBottom: '24px' }}>Denemelerim</h2>
      {results.length === 0 ? <p style={{ color: renk.gray400 }}>Henüz deneme sonucun yok.</p> : (
        <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: renk.gray50 }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Deneme</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Tarih</th>
                {DERSLER.map(d => <th key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>{d.label}</th>)}
                <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.primary, fontWeight: '600', fontSize: font.size.sm }}>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                  <td style={{ padding: '12px 16px', color: renk.gray800, fontWeight: '500' }}>{r.exams?.name}</td>
                  <td style={{ padding: '12px 16px', color: renk.gray400 }}>{r.exams?.date}</td>
                  {DERSLER.map(d => <td key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: renk.gray600 }}>{net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)}</td>)}
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>{toplamNet(r).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SinifKarsilastirma({ userId }) {
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
  if (!data) return <div><h2 style={{ color: renk.gray800 }}>Sınıf Karşılaştırma</h2><p style={{ color: renk.gray400 }}>Henüz ortak deneme yok.</p></div>

  return (
    <div>
      <h2 style={{ color: renk.gray800, marginBottom: '8px' }}>Sınıf Karşılaştırma</h2>
      <p style={{ color: renk.gray400, marginBottom: '24px', fontSize: font.size.md }}>Son deneme: <strong style={{ color: renk.primary }}>{data.exam.name}</strong></p>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ background: renk.primaryLight, borderRadius: '14px', padding: '20px 24px', minWidth: '180px' }}>
          <div style={{ fontSize: font.size.sm, color: renk.gray600, marginBottom: '4px' }}>Benim Toplam Netim</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: renk.primary }}>{data.benimTop}</div>
        </div>
        <div style={{ background: renk.gray100, borderRadius: '14px', padding: '20px 24px', minWidth: '180px' }}>
          <div style={{ fontSize: font.size.sm, color: renk.gray600, marginBottom: '4px' }}>Sınıf Ortalaması</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: renk.gray800 }}>{data.sinifTopOrtalama}</div>
        </div>
      </div>
      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden', maxWidth: '500px' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: renk.gray50 }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Ders</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.primary, fontWeight: '600', fontSize: font.size.sm }}>Benim Netim</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Sınıf Ortalaması</th>
            </tr>
          </thead>
          <tbody>
            {data.sinifOrtalama.map(d => (
              <tr key={d.label} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                <td style={{ padding: '12px 16px', color: renk.gray800, fontWeight: '500' }}>{d.label}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>{d.ben}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: renk.gray400 }}>{d.sinif}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GunlukCalisma({ userId }) {
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

  function handleEkle() {
    setSatirlar(prev => [...prev, { ders: '', konu: '', dogru: '', yanlis: '', bos: '' }])
  }

  function handleSil(i) {
    setSatirlar(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    setError(''); setSuccess('')
    const gecerli = satirlar.filter(s => s.ders)
    if (gecerli.length === 0) { setError('En az bir ders seçin'); return }

    const rows = gecerli.map(s => ({
      student_id: userId,
      date,
      lesson: s.ders,
      topic: s.ders === 'paragraf' ? null : (s.konu || null),
      dogru: parseInt(s.dogru) || 0,
      yanlis: parseInt(s.yanlis) || 0,
      bos: parseInt(s.bos) || 0,
    }))

    const { error } = await supabase.from('daily_study').insert(rows)
    if (error) { setError('Kaydedilemedi: ' + error.message); return }

    setSuccess('Kaydedildi ✓')
    setSatirlar([{ ders: '', konu: '', dogru: '', yanlis: '', bos: '' }])
    const { data } = await supabase.from('daily_study').select('*').eq('student_id', userId).eq('date', date).order('id')
    setMevcutKayitlar(data || [])
  }

  const selectStyle = { padding: '8px 10px', borderRadius: '8px', border: `1px solid ${renk.gray200}`, fontSize: font.size.md, fontFamily: font.family, background: renk.white, color: renk.gray800 }
  const inputStyle = { width: '60px', padding: '8px', borderRadius: '6px', border: `1px solid ${renk.gray200}`, textAlign: 'center', fontSize: font.size.md, fontFamily: font.family }

  return (
    <div>
      <h2 style={{ color: renk.gray800, marginBottom: '24px' }}>Günlük Çalışma</h2>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: renk.gray600, fontSize: font.size.md }}>Tarih</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...selectStyle }} />
      </div>

      {mevcutKayitlar.length > 0 && (
        <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 16px', background: renk.gray50, borderBottom: `1px solid ${renk.gray200}`, fontWeight: '600', color: renk.gray600, fontSize: font.size.md }}>
            Bu tarihe ait kayıtlar
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: renk.gray50 }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Ders</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Konu</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', color: renk.green, fontWeight: '600', fontSize: font.size.sm }}>D</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', color: renk.red, fontWeight: '600', fontSize: font.size.sm }}>Y</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>B</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', color: renk.primary, fontWeight: '600', fontSize: font.size.sm }}>Net</th>
              </tr>
            </thead>
            <tbody>
              {mevcutKayitlar.map(k => {
                const dersLabel = GUNLUK_DERSLER_TANIM.find(d => d.key === k.lesson)?.label || k.lesson
                return (
                  <tr key={k.id} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                    <td style={{ padding: '10px 16px', color: renk.gray800, fontWeight: '500' }}>{dersLabel}</td>
                    <td style={{ padding: '10px 16px', color: renk.gray400, fontSize: font.size.md }}>{k.topic || '-'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: renk.green }}>{k.dogru}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: renk.red }}>{k.yanlis}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: renk.gray400 }}>{k.bos}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>{net(k.dogru, k.yanlis)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontWeight: '600', color: renk.gray600, marginBottom: '16px', fontSize: font.size.md }}>Yeni Kayıt Ekle</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {satirlar.map((satir, i) => {
            const konular = satir.ders && satir.ders !== 'paragraf' ? (KONULAR[satir.ders] || []) : []
            return (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', background: renk.gray50, padding: '12px', borderRadius: '10px' }}>
                <select value={satir.ders} onChange={e => handleSatirChange(i, 'ders', e.target.value)} style={{ ...selectStyle, minWidth: '120px' }}>
                  <option value="">Ders seç</option>
                  {GUNLUK_DERSLER_TANIM.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>

                {satir.ders && satir.ders !== 'paragraf' ? (
                  <select value={satir.konu} onChange={e => handleSatirChange(i, 'konu', e.target.value)} style={{ ...selectStyle, minWidth: '200px' }}>
                    <option value="">Konu seç</option>
                    {konular.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                ) : (
                  <span style={{ minWidth: '200px', fontSize: font.size.sm, color: renk.gray400 }}>{satir.ders === 'paragraf' ? 'Konu yok' : ''}</span>
                )}

                {['dogru', 'yanlis', 'bos'].map((alan, ai) => (
                  <div key={alan} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: ai === 0 ? renk.green : ai === 1 ? renk.red : renk.gray400, fontWeight: '600' }}>{ai === 0 ? 'D' : ai === 1 ? 'Y' : 'B'}</span>
                    <input type="number" min="0" value={satir[alan]} onChange={e => handleSatirChange(i, alan, e.target.value)} style={inputStyle} />
                  </div>
                ))}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: renk.primary, fontWeight: '600' }}>Net</span>
                  <div style={{ width: '60px', padding: '8px', textAlign: 'center', fontWeight: '700', color: renk.primary, fontSize: font.size.md }}>
                    {net(parseInt(satir.dogru) || 0, parseInt(satir.yanlis) || 0)}
                  </div>
                </div>

                {satirlar.length > 1 && (
                  <button onClick={() => handleSil(i)} style={{ background: renk.redLight, border: 'none', color: renk.red, borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: font.size.md }}>✕</button>
                )}
              </div>
            )
          })}
        </div>
        <button onClick={handleEkle} style={{ marginTop: '12px', background: renk.gray100, border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: renk.gray600, fontSize: font.size.md, fontFamily: font.family }}>
          + Satır Ekle
        </button>
      </div>

      {error && <div style={{ background: renk.redLight, color: renk.red, padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ background: renk.greenLight, color: renk.green, padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}

      <button onClick={handleSave} style={{ ...buton.primary, padding: '12px 32px', fontSize: font.size.lg }}>Kaydet</button>
    </div>
  )
}

function Gelisim({ userId, studentName }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase.from('exam_results').select('*, exams(name, date, type)').eq('student_id', userId).order('exams(date)', { ascending: true })
      .then(({ data }) => { setResults(data || []); setLoading(false) })
  }, [userId])

  if (loading) return <p style={{ color: renk.gray400 }}>Yükleniyor...</p>
  if (results.length === 0) return (
    <div><h2 style={{ color: renk.gray800 }}>Gelişimim</h2><p style={{ color: renk.gray400 }}>Henüz deneme sonucun yok.</p></div>
  )

  const tumDenemeler = [...results].sort((a, b) => new Date(a.exams?.date) - new Date(b.exams?.date))
  const sonResult = tumDenemeler[tumDenemeler.length - 1]
  const ilkNet = toplamNet(tumDenemeler[0])
  const sonNet = toplamNet(sonResult)
  const toplamFark = parseFloat((sonNet - ilkNet).toFixed(2))

  const trendData = tumDenemeler.map(r => ({
    name: r.exams?.name,
    net: parseFloat(toplamNet(r).toFixed(2)),
    tip: r.exams?.type === 'common' ? 'Ortak' : 'Bireysel'
  }))

  const bransBarData = DERSLER.map(d => ({
    ders: d.label,
    net: net(sonResult[`${d.key}_d`] || 0, sonResult[`${d.key}_y`] || 0)
  }))

  const bransTrend = DERSLER.map(d => ({
    label: d.label,
    key: d.key,
    color: BRANS_RENKLER[d.label],
    data: tumDenemeler.map(r => ({
      name: r.exams?.name,
      net: net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)
    }))
  }))

  return (
    <div>
      <h2 style={{ color: renk.gray800, marginBottom: '4px' }}>Gelişimim</h2>
      <p style={{ color: renk.gray400, marginBottom: '24px', fontSize: font.size.md }}>{studentName} — {results.length} deneme</p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div style={{ background: renk.primaryLight, borderRadius: '14px', padding: '20px 24px', minWidth: '160px', flex: 1 }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>🎯</div>
          <div style={{ fontSize: font.size.sm, color: renk.gray600, marginBottom: '4px' }}>Son Deneme Neti</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: renk.primary }}>{sonNet.toFixed(2)}</div>
        </div>
        <div style={{ background: toplamFark >= 0 ? renk.greenLight : renk.redLight, borderRadius: '14px', padding: '20px 24px', minWidth: '160px', flex: 1 }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>{toplamFark >= 0 ? '📈' : '📉'}</div>
          <div style={{ fontSize: font.size.sm, color: renk.gray600, marginBottom: '4px' }}>İlk Denemeden Bu Yana</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: toplamFark >= 0 ? renk.green : renk.red }}>{toplamFark >= 0 ? '+' : ''}{toplamFark}</div>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: '14px', padding: '20px 24px', minWidth: '160px', flex: 1 }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>📚</div>
          <div style={{ fontSize: font.size.sm, color: renk.gray600, marginBottom: '4px' }}>Toplam Deneme</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#ea580c' }}>{results.length}</div>
        </div>
      </div>

      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ color: renk.gray800, marginBottom: '4px', marginTop: 0 }}>📈 Toplam Net Gelişimi</h3>
        <p style={{ color: renk.gray400, fontSize: font.size.sm, marginBottom: '16px' }}>Ortak ve bireysel denemeler birlikte</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={renk.gray100} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: renk.gray400 }} />
            <YAxis tick={{ fontSize: 12, fill: renk.gray400 }} />
            <Tooltip contentStyle={{ borderRadius: '10px', border: `1px solid ${renk.gray200}` }} formatter={(v, n, p) => [v, `Net (${p.payload.tip})`]} />
            <Line type="monotone" dataKey="net" stroke={renk.primary} strokeWidth={3} dot={{ fill: renk.primary, r: 6, strokeWidth: 2, stroke: renk.white }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ color: renk.gray800, marginBottom: '4px', marginTop: 0 }}>📊 Son Denemede Branş Netlerim</h3>
        <p style={{ color: renk.gray400, fontSize: font.size.sm, marginBottom: '16px' }}>{sonResult.exams?.name}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bransBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke={renk.gray100} />
            <XAxis dataKey="ders" tick={{ fontSize: 12, fill: renk.gray400 }} />
            <YAxis tick={{ fontSize: 12, fill: renk.gray400 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${renk.gray200}` }} formatter={(v) => [v, 'Net']} />
            <Bar dataKey="net" fill={renk.primary} radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: renk.gray600 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {tumDenemeler.length > 1 && (
        <>
          <h3 style={{ color: renk.gray800, marginBottom: '16px' }}>🎓 Branş Bazlı Gelişim</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {bransTrend.map(b => (
              <div key={b.key} style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '20px' }}>
                <h4 style={{ color: renk.gray800, marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color, display: 'inline-block' }}></span>
                  {b.label}
                </h4>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={b.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={renk.gray100} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: renk.gray400 }} />
                    <YAxis tick={{ fontSize: 11, fill: renk.gray400 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${renk.gray200}` }} formatter={(v) => [v, 'Net']} />
                    <Line type="monotone" dataKey="net" stroke={b.color} strokeWidth={2} dot={{ fill: b.color, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}