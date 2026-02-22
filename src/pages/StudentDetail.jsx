import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font, buton } from '../styles'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

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

const AYLAR = [
  { value: '09', label: 'Eylül' },
  { value: '10', label: 'Ekim' },
  { value: '11', label: 'Kasım' },
  { value: '12', label: 'Aralık' },
  { value: '01', label: 'Ocak' },
  { value: '02', label: 'Şubat' },
  { value: '03', label: 'Mart' },
  { value: '04', label: 'Nisan' },
  { value: '05', label: 'Mayıs' },
  { value: '06', label: 'Haziran' },
]

function net(d, y) { return parseFloat((d - y / 3).toFixed(2)) }
function toplamNet(result) {
  return DERSLER.reduce((acc, d) => acc + net(result[`${d.key}_d`] || 0, result[`${d.key}_y`] || 0), 0)
}
function yuzde(d, toplam) {
  if (toplam === 0) return 0
  return Math.round((d / toplam) * 100)
}

// Konu tamamlanma skoru hesapla (0-100)
function konuSkoru(dogru, yanlis, bos) {
  const toplam = dogru + yanlis + bos
  if (toplam === 0) return 0
  const basari = yuzde(dogru, toplam)
  // 200+ soru VE %80+ başarı = tam tamamlandı (100)
  // Az soru veya düşük başarı = orantılı skor
  const soruAgirligi = Math.min(toplam / 200, 1) // max 1
  const basariAgirligi = Math.min(basari / 80, 1) // %80 hedef
  return Math.round(soruAgirligi * basariAgirligi * 100)
}

export default function StudentDetail({ studentId, onBack }) {
  const [student, setStudent] = useState(null)
  const [results, setResults] = useState([])
  const [dailyStudy, setDailyStudy] = useState([])
  const [tab, setTab] = useState('denemeler')
  const [editResult, setEditResult] = useState(null)
  const [editData, setEditData] = useState({})
  const [editSuccess, setEditSuccess] = useState('')
  const [editError, setEditError] = useState('')

  useEffect(() => { fetchStudent(); fetchResults(); fetchDailyStudy() }, [studentId])

  async function fetchStudent() {
    const { data } = await supabase.from('students').select('*').eq('id', studentId).single()
    setStudent(data)
  }

  async function fetchResults() {
    const { data } = await supabase.from('exam_results').select('*, exams(name, date, type)').eq('student_id', studentId).order('exams(date)', { ascending: true })
    setResults(data || [])
  }

  async function fetchDailyStudy() {
    const { data } = await supabase.from('daily_study').select('*').eq('student_id', studentId).order('date', { ascending: false })
    setDailyStudy(data || [])
  }

  function openEdit(r) {
    const d = {}
    DERSLER.forEach(ders => {
      d[`${ders.key}_d`] = r[`${ders.key}_d`] || 0
      d[`${ders.key}_y`] = r[`${ders.key}_y`] || 0
      d[`${ders.key}_b`] = r[`${ders.key}_b`] || 0
    })
    setEditData(d); setEditResult(r); setEditSuccess(''); setEditError('')
  }

  async function handleEditSave() {
    setEditError(''); setEditSuccess('')
    const { error } = await supabase.from('exam_results').update(editData).eq('id', editResult.id)
    if (error) { setEditError('Kaydedilemedi: ' + error.message); return }
    setEditSuccess('Güncellendi ✓')
    fetchResults()
  }

  const tumDenemeler = [...results].sort((a, b) => new Date(a.exams?.date) - new Date(b.exams?.date))
  const sonResult = tumDenemeler[tumDenemeler.length - 1]

  const trendData = tumDenemeler.map(r => ({
    name: r.exams?.name,
    net: parseFloat(toplamNet(r).toFixed(2)),
    tip: r.exams?.type === 'common' ? 'Ortak' : 'Bireysel'
  }))

  const bransBarData = sonResult ? DERSLER.map(d => ({
    ders: d.label,
    net: net(sonResult[`${d.key}_d`] || 0, sonResult[`${d.key}_y`] || 0)
  })) : []

  const bransTrend = DERSLER.map(d => ({
    label: d.label, key: d.key,
    color: { 'Türkçe': '#0d9488', 'Matematik': '#6366f1', 'Fen': '#f59e0b', 'İnkılap': '#ec4899', 'İngilizce': '#10b981', 'Din': '#8b5cf6' }[d.label],
    data: tumDenemeler.map(r => ({ name: r.exams?.name, net: net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0) }))
  }))

  if (!student) return <p style={{ color: renk.gray400 }}>Yükleniyor...</p>

  return (
    <div style={{ fontFamily: font.family }}>
      <button onClick={onBack} style={{ ...buton.secondary, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>← Geri</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <div style={{ width: '48px', height: '48px', background: renk.primaryLight, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>👤</div>
        <div>
          <h2 style={{ margin: 0, color: renk.gray800 }}>{student.full_name}</h2>
          <p style={{ margin: '4px 0 0', color: renk.gray400, fontSize: font.size.md }}>@{student.username}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'denemeler', label: '📝 Denemeler' },
          { key: 'grafik', label: '📈 Gelişim Grafiği' },
          { key: 'konu', label: '🔍 Konu Analizi' },
          { key: 'gunluk', label: '📅 Günlük Çalışma' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            background: tab === t.key ? renk.primary : renk.gray100,
            color: tab === t.key ? renk.white : renk.gray600,
            fontWeight: tab === t.key ? '600' : '400',
            fontSize: font.size.md, fontFamily: font.family
          }}>{t.label}</button>
        ))}
      </div>

      {editResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0006', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: renk.white, padding: '32px', borderRadius: '16px', width: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '8px', color: renk.gray800 }}>Sonuç Düzenle</h3>
            <p style={{ color: renk.gray400, marginBottom: '20px', fontSize: font.size.md }}>{editResult.exams?.name} — {editResult.exams?.date}</p>
            <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: renk.gray50 }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Ders</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: renk.green, fontWeight: '600', fontSize: font.size.sm }}>D</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: renk.red, fontWeight: '600', fontSize: font.size.sm }}>Y</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>B</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: renk.primary, fontWeight: '600', fontSize: font.size.sm }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {DERSLER.map(d => (
                  <tr key={d.key} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: '600', color: renk.gray800 }}>{d.label}</td>
                    {['d', 'y', 'b'].map(alan => (
                      <td key={alan} style={{ padding: '6px' }}>
                        <input type="number" min="0" value={editData[`${d.key}_${alan}`] || ''}
                          onChange={e => setEditData(prev => ({ ...prev, [`${d.key}_${alan}`]: parseInt(e.target.value) || 0 }))}
                          style={{ width: '56px', padding: '6px', borderRadius: '6px', border: `1px solid ${renk.gray200}`, textAlign: 'center', fontSize: font.size.md, fontFamily: font.family }} />
                      </td>
                    ))}
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>
                      {net(editData[`${d.key}_d`] || 0, editData[`${d.key}_y`] || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editError && <div style={{ background: renk.redLight, color: renk.red, padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{editError}</div>}
            {editSuccess && <div style={{ background: renk.greenLight, color: renk.green, padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{editSuccess}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleEditSave} style={buton.primary}>Kaydet</button>
              <button onClick={() => setEditResult(null)} style={buton.secondary}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'denemeler' && (
        <div>
          <h3 style={{ color: renk.gray800, marginBottom: '16px' }}>Tüm Deneme Sonuçları</h3>
          {results.length === 0 ? <p style={{ color: renk.gray400 }}>Henüz deneme sonucu yok</p> : (
            <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: renk.gray50 }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Deneme</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Tarih</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Tür</th>
                    {DERSLER.map(d => <th key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>{d.label}</th>)}
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.primary, fontWeight: '600', fontSize: font.size.sm }}>Toplam</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {tumDenemeler.map(r => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                      <td style={{ padding: '12px 16px', color: renk.gray800, fontWeight: '500' }}>{r.exams?.name}</td>
                      <td style={{ padding: '12px 16px', color: renk.gray400 }}>{r.exams?.date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: font.size.sm, fontWeight: '600', background: r.exams?.type === 'common' ? renk.primaryLight : '#fff7ed', color: r.exams?.type === 'common' ? renk.primary : '#ea580c' }}>
                          {r.exams?.type === 'common' ? 'Ortak' : 'Bireysel'}
                        </span>
                      </td>
                      {DERSLER.map(d => <td key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: renk.gray600 }}>{net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)}</td>)}
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>{toplamNet(r).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button onClick={() => openEdit(r)} style={buton.detail}>Düzenle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'grafik' && (
        <div>
          {trendData.length < 2 ? <p style={{ color: renk.gray400 }}>Grafik için en az 2 deneme gerekli.</p> : (
            <>
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
              {sonResult && (
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
              )}
              <h3 style={{ color: renk.gray800, marginBottom: '16px' }}>🎓 Branş Bazlı Gelişim</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                {bransTrend.map(b => (
                  <div key={b.key} style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '20px' }}>
                    <h4 style={{ color: renk.gray800, marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color, display: 'inline-block' }}></span>
                      {b.label}
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
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
      )}

      {tab === 'konu' && <KonuAnalizi dailyStudy={dailyStudy} studentName={student.full_name} />}

      {tab === 'gunluk' && (
        <div>
          <h3 style={{ color: renk.gray800, marginBottom: '16px' }}>Günlük Çalışma Geçmişi</h3>
          {dailyStudy.length === 0 ? <p style={{ color: renk.gray400 }}>Henüz günlük çalışma kaydı yok</p> : (
            <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: renk.gray50 }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Tarih</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Ders</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Konu</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.green, fontWeight: '600', fontSize: font.size.sm }}>D</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.red, fontWeight: '600', fontSize: font.size.sm }}>Y</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>B</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: renk.primary, fontWeight: '600', fontSize: font.size.sm }}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyStudy.map(d => (
                    <tr key={d.id} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                      <td style={{ padding: '12px 16px', color: renk.gray800 }}>{d.date}</td>
                      <td style={{ padding: '12px 16px', color: renk.gray600, fontWeight: '500' }}>{d.lesson}</td>
                      <td style={{ padding: '12px 16px', color: renk.gray400, fontSize: font.size.md }}>{d.topic || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: renk.green }}>{d.dogru}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: renk.red }}>{d.yanlis}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: renk.gray400 }}>{d.bos}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>{net(d.dogru, d.yanlis)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MufredatIlerleme({ dailyStudy }) {
  const dersIlerleme = DERSLER.map(d => {
    const konular = KONULAR[d.key] || []
    const toplamKonu = konular.length

    const konuSkorlar = konular.map(konu => {
      const kayitlar = dailyStudy.filter(k => k.lesson === d.key && k.topic === konu)
      const topD = kayitlar.reduce((a, k) => a + (k.dogru || 0), 0)
      const topY = kayitlar.reduce((a, k) => a + (k.yanlis || 0), 0)
      const topB = kayitlar.reduce((a, k) => a + (k.bos || 0), 0)
      const skor = konuSkoru(topD, topY, topB)
      return { konu, skor, toplam: topD + topY + topB, basari: yuzde(topD, topD + topY + topB) }
    })

    const tamamlananKonu = konuSkorlar.filter(k => k.skor === 100).length
    const agirlikliToplam = konuSkorlar.reduce((a, k) => a + k.skor, 0)
    const genelYuzde = Math.round(agirlikliToplam / toplamKonu)

    return { ...d, konular: konuSkorlar, toplamKonu, tamamlananKonu, genelYuzde }
  })

  const genelToplam = Math.round(dersIlerleme.reduce((a, d) => a + d.genelYuzde, 0) / DERSLER.length)

  function barRenk(yuzde) {
    if (yuzde >= 80) return renk.green
    if (yuzde >= 50) return '#f59e0b'
    if (yuzde > 0) return renk.primary
    return renk.gray200
  }

  return (
    <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: renk.gray800, margin: 0 }}>📚 Müfredat Tamamlama</h3>
          <p style={{ color: renk.gray400, fontSize: font.size.sm, margin: '4px 0 0' }}>200+ soru ve %80+ başarı = Tamamlandı</p>
        </div>
        <div style={{ textAlign: 'center', background: renk.primaryLight, borderRadius: '12px', padding: '12px 20px' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: renk.primary }}>{genelToplam}%</div>
          <div style={{ fontSize: font.size.sm, color: renk.gray600 }}>Genel İlerleme</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {dersIlerleme.map(d => (
          <div key={d.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '600', color: renk.gray800, fontSize: font.size.md, minWidth: '90px' }}>{d.label}</span>
                <span style={{ fontSize: font.size.sm, color: renk.gray400 }}>{d.tamamlananKonu}/{d.toplamKonu} konu tamamlandı</span>
              </div>
              <span style={{ fontWeight: '700', color: barRenk(d.genelYuzde), fontSize: font.size.md }}>{d.genelYuzde}%</span>
            </div>
            {/* Ana progress bar */}
            <div style={{ height: '10px', background: renk.gray100, borderRadius: '5px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ height: '100%', width: `${d.genelYuzde}%`, background: barRenk(d.genelYuzde), borderRadius: '5px', transition: 'width 0.5s ease' }} />
            </div>
            {/* Konu bazlı mini barlar */}
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {d.konular.map(k => (
                <div key={k.konu} title={`${k.konu}: ${k.skor}% (${k.toplam} soru, %${k.basari} doğru)`}
                  style={{ flex: 1, minWidth: '20px', height: '6px', borderRadius: '3px', background: k.skor === 0 ? renk.gray100 : barRenk(k.skor), cursor: 'default' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px' }}>
              {d.konular.map(k => (
                <div key={k.konu} style={{ flex: 1, minWidth: '20px', fontSize: '9px', color: renk.gray400, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={k.konu}>
                  {k.konu.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Açıklama */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${renk.gray100}` }}>
        {[
          { renk: renk.green, label: 'Tamamlandı (≥80%)' },
          { renk: '#f59e0b', label: 'Gelişiyor (50-79%)' },
          { renk: renk.primary, label: 'Başlandı (<50%)' },
          { renk: renk.gray200, label: 'Hiç çalışılmadı' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.renk }} />
            <span style={{ fontSize: '11px', color: renk.gray500 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KonuAnalizi({ dailyStudy, studentName }) {
  const bugun = new Date()
  const bugunAy = bugun.getMonth() + 1

  const [seciliAy, setSeciliAy] = useState(String(bugunAy).padStart(2, '0'))

  function ayYil(ayStr) {
    const ay = parseInt(ayStr)
    const bugunYil = new Date().getFullYear()
    if (ay >= 9) return bugunAy >= 9 ? bugunYil : bugunYil - 1
    return bugunAy >= 9 ? bugunYil + 1 : bugunYil
  }

  const son7gun = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const tarih = d.toISOString().split('T')[0]
    const gun = dailyStudy.filter(k => k.date === tarih)
    const toplam = gun.reduce((acc, k) => acc + (k.dogru || 0) + (k.yanlis || 0) + (k.bos || 0), 0)
    son7gun.push({ gun: `${d.getDate()}/${d.getMonth() + 1}`, toplam })
  }

  const yil = ayYil(seciliAy)
  const ayVerisi = dailyStudy.filter(k => {
    const [ky, km] = k.date.split('-')
    return ky === String(yil) && km === seciliAy
  })

  const ayGunSayisi = new Date(yil, parseInt(seciliAy), 0).getDate()
  const ilkGunHaftaIci = new Date(yil, parseInt(seciliAy) - 1, 1).getDay()
  const takvimVerisi = {}
  ayVerisi.forEach(k => {
    const gun = parseInt(k.date.split('-')[2])
    if (!takvimVerisi[gun]) takvimVerisi[gun] = 0
    takvimVerisi[gun] += (k.dogru || 0) + (k.yanlis || 0) + (k.bos || 0)
  })

  const konuMap = {}
  dailyStudy.filter(k => k.topic).forEach(k => {
    const anahtar = `${k.lesson}__${k.topic}`
    if (!konuMap[anahtar]) konuMap[anahtar] = { ders: k.lesson, konu: k.topic, d: 0, y: 0, b: 0 }
    konuMap[anahtar].d += k.dogru || 0
    konuMap[anahtar].y += k.yanlis || 0
    konuMap[anahtar].b += k.bos || 0
  })

  const konuListesi = Object.values(konuMap).map(k => ({
    ...k, toplam: k.d + k.y + k.b,
    yuzde: yuzde(k.d, k.d + k.y + k.b),
    net: parseFloat((k.d - k.y / 3).toFixed(2))
  })).sort((a, b) => b.toplam - a.toplam)

  const cokCalisAzVeriyor = konuListesi.filter(k => k.toplam >= 80 && k.yuzde < 40)
  const bosOranYuksek = konuListesi.filter(k => k.toplam >= 20 && k.b / k.toplam > 0.4)

  const tumKonular = []
  DERSLER.forEach(d => {
    (KONULAR[d.key] || []).forEach(k => tumKonular.push({ ders: d.label, konu: k, dersKey: d.key }))
  })
  const calisilmis = new Set(dailyStudy.filter(k => k.topic).map(k => `${k.lesson}__${k.topic}`))
  const dokunulmamis = tumKonular.filter(k => !calisilmis.has(`${k.dersKey}__${k.konu}`))

  const haftaGunleri = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
  const takvimHucreler = []
  for (let i = 0; i < ilkGunHaftaIci; i++) takvimHucreler.push(null)
  for (let i = 1; i <= ayGunSayisi; i++) takvimHucreler.push(i)

  function renkHacim(sayi) {
    if (sayi === 0) return renk.gray100
    if (sayi < 30) return '#ccfbf1'
    if (sayi < 80) return '#5eead4'
    return renk.primary
  }

  return (
    <div>
      {/* Müfredat İlerleme - EN ÜSTTE */}
      <MufredatIlerleme dailyStudy={dailyStudy} />

      {/* Alarmlar */}
      {(cokCalisAzVeriyor.length > 0 || bosOranYuksek.length > 0) && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: renk.gray800, marginBottom: '12px' }}>⚠️ Dikkat Gerektiren Durumlar</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cokCalisAzVeriyor.map(k => (
              <div key={k.konu} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🔴</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#9a3412', fontSize: font.size.md }}>Çok çalışıyor ama verim düşük</div>
                  <div style={{ color: '#ea580c', fontSize: font.size.sm }}>{k.ders} → {k.konu} — {k.toplam} soru, %{k.yuzde} doğruluk</div>
                </div>
              </div>
            ))}
            {bosOranYuksek.map(k => (
              <div key={k.konu} style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🟡</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#92400e', fontSize: font.size.md }}>Boş oranı yüksek</div>
                  <div style={{ color: '#d97706', fontSize: font.size.sm }}>{k.ders} → {k.konu} — {k.b} boş / {k.toplam} soru (%{Math.round(k.b / k.toplam * 100)})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Son 7 gün */}
      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ color: renk.gray800, marginBottom: '20px', marginTop: 0 }}>📅 Son 7 Gün Soru Hacmi</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={son7gun}>
            <CartesianGrid strokeDasharray="3 3" stroke={renk.gray100} />
            <XAxis dataKey="gun" tick={{ fontSize: 12, fill: renk.gray400 }} />
            <YAxis tick={{ fontSize: 12, fill: renk.gray400 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${renk.gray200}` }} formatter={(v) => [v, 'Soru']} />
            <Bar dataKey="toplam" radius={[6, 6, 0, 0]} name="Soru Sayısı">
              {son7gun.map((entry, i) => <Cell key={i} fill={entry.toplam === 0 ? renk.gray200 : renk.primary} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Takvim */}
      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h3 style={{ color: renk.gray800, margin: 0 }}>🗓️ Aylık Çalışma Takvimi</h3>
          <select value={seciliAy} onChange={e => setSeciliAy(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${renk.gray200}`, fontSize: font.size.md, fontFamily: font.family, color: renk.gray800 }}>
            {AYLAR.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {haftaGunleri.map(g => <div key={g} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: renk.gray400, padding: '4px' }}>{g}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {takvimHucreler.map((gun, i) => (
            <div key={i} style={{ aspectRatio: '1', borderRadius: '8px', background: gun ? renkHacim(takvimVerisi[gun] || 0) : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {gun && (
                <>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: (takvimVerisi[gun] || 0) >= 80 ? renk.white : renk.gray600 }}>{gun}</span>
                  {takvimVerisi[gun] > 0 && <span style={{ fontSize: '10px', color: (takvimVerisi[gun] || 0) >= 80 ? renk.white : renk.primary, fontWeight: '600' }}>{takvimVerisi[gun]}</span>}
                </>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: font.size.sm, color: renk.gray400 }}>Az</span>
          {['#ccfbf1', '#5eead4', renk.primary].map((c, i) => <div key={i} style={{ width: '16px', height: '16px', borderRadius: '4px', background: c }} />)}
          <span style={{ fontSize: font.size.sm, color: renk.gray400 }}>Çok</span>
        </div>
      </div>

      {/* Konu bazlı performans */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: renk.gray800, marginBottom: '16px' }}>📊 Konu Bazlı Performans</h3>
        {konuListesi.length === 0 ? <p style={{ color: renk.gray400 }}>Henüz konu bazlı veri yok.</p> : (
          DERSLER.map(d => {
            const dersKonulari = konuListesi.filter(k => k.ders === d.key)
            if (dersKonulari.length === 0) return null
            return (
              <div key={d.key} style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ padding: '12px 16px', background: renk.primaryLight, borderBottom: `1px solid ${renk.gray200}`, fontWeight: '700', color: renk.primaryDark }}>{d.label}</div>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ background: renk.gray50 }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Konu</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: renk.green, fontWeight: '600', fontSize: font.size.sm }}>D</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: renk.red, fontWeight: '600', fontSize: font.size.sm }}>Y</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>B</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Toplam</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: renk.primary, fontWeight: '600', fontSize: font.size.sm }}>Net</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: renk.gray400, fontWeight: '600', fontSize: font.size.sm }}>Doğruluk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dersKonulari.map(k => (
                      <tr key={k.konu} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                        <td style={{ padding: '10px 16px', color: renk.gray800, fontWeight: '500' }}>{k.konu}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: renk.green }}>{k.d}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: renk.red }}>{k.y}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: renk.gray400 }}>{k.b}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: renk.gray600 }}>{k.toplam}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>{k.net}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: renk.gray100, overflow: 'hidden' }}>
                              <div style={{ width: `${k.yuzde}%`, height: '100%', background: k.yuzde >= 70 ? renk.green : k.yuzde >= 50 ? '#f59e0b' : renk.red, borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: font.size.sm, fontWeight: '600', color: k.yuzde >= 70 ? renk.green : k.yuzde >= 50 ? '#f59e0b' : renk.red }}>%{k.yuzde}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })
        )}
      </div>

      {/* Hiç dokunulmamış */}
      {dokunulmamis.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: renk.gray800, marginBottom: '12px' }}>🔲 Hiç Çalışılmamış Konular</h3>
          <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden' }}>
            {DERSLER.map(d => {
              const eksik = dokunulmamis.filter(k => k.ders === d.label)
              if (eksik.length === 0) return null
              return (
                <div key={d.key} style={{ borderBottom: `1px solid ${renk.gray100}`, padding: '12px 16px' }}>
                  <span style={{ fontWeight: '600', color: renk.primaryDark, fontSize: font.size.md }}>{d.label}: </span>
                  <span style={{ color: renk.gray500, fontSize: font.size.md }}>{eksik.map(k => k.konu).join(', ')}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}