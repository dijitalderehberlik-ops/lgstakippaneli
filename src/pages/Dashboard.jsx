import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font } from '../styles'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import Students from './Students'
import ExamEntry from './ExamEntry'

const DERSLER = [
  { key: 'turkce', label: 'Türkçe', maxSoru: 20 },
  { key: 'matematik', label: 'Matematik', maxSoru: 20 },
  { key: 'fen', label: 'Fen', maxSoru: 20 },
  { key: 'inkılap', label: 'İnkılap', maxSoru: 10 },
  { key: 'ingilizce', label: 'İngilizce', maxSoru: 10 },
  { key: 'din', label: 'Din', maxSoru: 10 },
]

function net(d, y) { return parseFloat((d - y / 3).toFixed(2)) }
function toplamNet(result) {
  return DERSLER.reduce((acc, d) => acc + net(result[`${d.key}_d`] || 0, result[`${d.key}_y`] || 0), 0)
}

export default function Dashboard({ session }) {
  const [page, setPage] = useState('dashboard')
  async function handleLogout() { await supabase.auth.signOut() }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: font.family, background: renk.gray50 }}>
      <div style={{ width: '220px', background: renk.white, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: `1px solid ${renk.gray200}`, boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: '0 8px' }}>
          <div style={{ width: '36px', height: '36px', background: renk.primary, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📚</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: font.size.lg, color: renk.gray800 }}>LGS Takip</div>
            <div style={{ fontSize: font.size.sm, color: renk.gray400 }}>Admin Panel</div>
          </div>
        </div>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: '📊' },
          { key: 'students', label: 'Öğrenciler', icon: '👥' },
          { key: 'exams', label: 'Deneme Gir', icon: '📝' },
        ].map(m => (
          <button key={m.key} onClick={() => setPage(m.key)} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            background: page === m.key ? renk.primaryLight : 'transparent',
            color: page === m.key ? renk.primaryDark : renk.gray600,
            fontWeight: page === m.key ? '600' : '400',
            fontSize: font.size.md, textAlign: 'left',
          }}>
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: renk.redLight, border: 'none', borderRadius: '10px', cursor: 'pointer', color: renk.red, fontSize: font.size.md }}>
          🚪 Çıkış Yap
        </button>
      </div>
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {page === 'dashboard' && <DashboardHome />}
        {page === 'students' && <Students />}
        {page === 'exams' && <ExamEntry />}
      </div>
    </div>
  )
}

function StatCard({ icon, baslik, children, accentBg }) {
  return (
    <div style={{
      background: renk.white, borderRadius: '20px', border: `1px solid ${renk.gray200}`,
      padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: accentBg || renk.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: renk.gray400, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{baslik}</span>
      </div>
      {children}
    </div>
  )
}

function DashboardHome() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dusurenAcik, setDusurenAcik] = useState(false)
  const [yukselenAcik, setYukselenAcik] = useState(false)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const { data: exams } = await supabase.from('exams').select('*').eq('type', 'common').order('date', { ascending: true })
    if (!exams || exams.length === 0) { setLoading(false); return }

    const sonDeneme = exams[exams.length - 1]
    const oncekiDeneme = exams.length > 1 ? exams[exams.length - 2] : null

    const { data: sonResults } = await supabase.from('exam_results').select('*').eq('exam_id', sonDeneme.id)
    let oncekiResults = []
    if (oncekiDeneme) {
      const { data } = await supabase.from('exam_results').select('*').eq('exam_id', oncekiDeneme.id)
      oncekiResults = data || []
    }

    const { data: students } = await supabase.from('students').select('id, full_name').eq('role', 'student')
    const studentMap = {}
    students?.forEach(s => { studentMap[s.id] = s.full_name })

    const sonNetler = (sonResults || []).map(r => toplamNet(r))
    const sonOrtalama = sonNetler.length > 0 ? parseFloat((sonNetler.reduce((a, b) => a + b, 0) / sonNetler.length).toFixed(2)) : 0
    const oncekiNetler = oncekiResults.map(r => toplamNet(r))
    const oncekiOrtalama = oncekiNetler.length > 0 ? parseFloat((oncekiNetler.reduce((a, b) => a + b, 0) / oncekiNetler.length).toFixed(2)) : null
    const ortalamaFark = oncekiOrtalama !== null ? parseFloat((sonOrtalama - oncekiOrtalama).toFixed(2)) : null

    // Branş ortalaması — en zayıf dersi maksimum soru sayısına oranla bul
    const bransOrtalama = DERSLER.map(d => {
      const list = (sonResults || []).map(r => net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0))
      const ort = list.length > 0 ? parseFloat((list.reduce((a, b) => a + b, 0) / list.length).toFixed(2)) : 0
      const oran = parseFloat((ort / d.maxSoru).toFixed(4))
      return { key: d.key, label: d.label, ortalama: ort, maxSoru: d.maxSoru, oran }
    })
    const enZayifDers = [...bransOrtalama].sort((a, b) => a.oran - b.oran)[0]

    const dusurenler = []
    const son2Yukselenler = []
    if (oncekiResults.length > 0) {
      sonResults?.forEach(sr => {
        const or = oncekiResults.find(r => r.student_id === sr.student_id)
        if (or) {
          const fark = parseFloat((toplamNet(sr) - toplamNet(or)).toFixed(2))
          const obj = { isim: studentMap[sr.student_id] || '', onceki: parseFloat(toplamNet(or).toFixed(2)), son: parseFloat(toplamNet(sr).toFixed(2)), fark }
          if (fark < 0) dusurenler.push(obj)
          if (fark > 0) son2Yukselenler.push(obj)
        }
      })
      dusurenler.sort((a, b) => a.fark - b.fark)
      son2Yukselenler.sort((a, b) => b.fark - a.fark)
    }

    const allExamResults = []
    for (const exam of exams) {
      const { data: examResults } = await supabase.from('exam_results').select('*').eq('exam_id', exam.id)
      if (examResults && examResults.length > 0) allExamResults.push({ exam, results: examResults })
    }

    const yukselenler = []
    if (allExamResults.length >= 2) {
      const ilkExam = allExamResults[0]
      const sonExam = allExamResults[allExamResults.length - 1]
      sonExam.results.forEach(sr => {
        const ir = ilkExam.results.find(r => r.student_id === sr.student_id)
        if (ir) {
          const fark = parseFloat((toplamNet(sr) - toplamNet(ir)).toFixed(2))
          yukselenler.push({ isim: studentMap[sr.student_id] || '', ilk: parseFloat(toplamNet(ir).toFixed(2)), son: parseFloat(toplamNet(sr).toFixed(2)), fark })
        }
      })
      yukselenler.sort((a, b) => b.fark - a.fark)
    }

    const trendData = allExamResults.map(({ exam, results }) => ({
      name: exam.name,
      ortalama: parseFloat((results.map(r => toplamNet(r)).reduce((a, b) => a + b, 0) / results.length).toFixed(2))
    }))

    const bransTrend = DERSLER.map(d => ({
      label: d.label, key: d.key,
      data: allExamResults.map(({ exam, results }) => ({
        name: exam.name,
        ortalama: parseFloat((results.map(r => net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)).reduce((a, b) => a + b, 0) / results.length).toFixed(2))
      }))
    }))

    const degisimler = []
    if (oncekiResults.length > 0) {
      sonResults?.forEach(sr => {
        const or = oncekiResults.find(r => r.student_id === sr.student_id)
        if (or) degisimler.push({ isim: studentMap[sr.student_id] || '', fark: parseFloat((toplamNet(sr) - toplamNet(or)).toFixed(2)) })
      })
    }

    setStats({
      sonDeneme, sonOrtalama, ortalamaFark,
      enZayifDers, bransOrtalama,
      dusurenler, son2Yukselenler,
      yukselenler: yukselenler.slice(0, 5),
      trendData, bransTrend,
      sonResults: (sonResults || []).map(r => ({ ...r, isim: studentMap[r.student_id] || '' })).filter(r => r.isim),
      degisimler,
    })
    setLoading(false)
  }

  if (loading) return <p style={{ color: renk.gray400 }}>Yükleniyor...</p>
  if (!stats) return <div><h2 style={{ color: renk.gray800 }}>Genel Bakış</h2><p style={{ color: renk.gray400 }}>Henüz ortak deneme eklenmemiş.</p></div>

  const { sonDeneme, sonOrtalama, ortalamaFark, enZayifDers, bransOrtalama, dusurenler, son2Yukselenler, yukselenler, trendData, bransTrend, sonResults, degisimler } = stats

  const dusurenGoster = dusurenAcik ? dusurenler : dusurenler.slice(0, 4)
  const yukselenGoster = yukselenAcik ? son2Yukselenler : son2Yukselenler.slice(0, 4)

  return (
    <div>
      <h2 style={{ color: renk.gray800, marginBottom: '4px' }}>Genel Bakış</h2>
      <p style={{ color: renk.gray400, marginBottom: '28px', fontSize: font.size.md }}>
        Son deneme: <strong style={{ color: renk.primary }}>{sonDeneme.name}</strong> ({sonDeneme.date})
      </p>

      {/* 4 Kart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>

        {/* Kart 1: Net Değişim İndeksi */}
        <StatCard icon="📈" baslik="Net Değişim İndeksi" accentBg={renk.primaryLight}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <span style={{ fontSize: '40px', fontWeight: '800', color: renk.gray800, lineHeight: 1 }}>{sonOrtalama}</span>
            <span style={{ fontSize: '14px', color: renk.gray400, marginBottom: '6px' }}>net ort.</span>
          </div>
          {ortalamaFark !== null ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: ortalamaFark >= 0 ? renk.greenLight : renk.redLight, borderRadius: '10px', padding: '8px 14px' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{ortalamaFark >= 0 ? '↑' : '↓'}</span>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: ortalamaFark >= 0 ? renk.green : renk.red }}>
                  {ortalamaFark >= 0 ? '+' : ''}{ortalamaFark} net
                </div>
                <div style={{ fontSize: '11px', color: ortalamaFark >= 0 ? renk.green : renk.red, opacity: 0.8 }}>önceki denemeden</div>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: font.size.sm, color: renk.gray400 }}>İlk deneme — karşılaştırma yok</span>
          )}
        </StatCard>

        {/* Kart 2: En Zayıf Halka */}
        <StatCard icon="⚠️" baslik="Müdahale Gereken Ders" accentBg={renk.redLight}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <span style={{ fontSize: '32px', fontWeight: '800', color: renk.gray800, lineHeight: 1 }}>{enZayifDers.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: renk.redLight, borderRadius: '10px', padding: '8px 14px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: renk.red }}>{enZayifDers.ortalama} / {enZayifDers.maxSoru}</div>
              <div style={{ fontSize: '11px', color: renk.red, opacity: 0.8 }}>ort. net / maks. net</div>
            </div>
            <div style={{ fontSize: '12px', color: renk.gray400, lineHeight: '1.5' }}>
              %{Math.round(enZayifDers.oran * 100)}<br />doluluk oranı
            </div>
          </div>
        </StatCard>

        {/* Kart 3: Son 2 Denemede Düşenler */}
        <StatCard icon="📉" baslik="Son 2 Denemede Düşenler" accentBg={renk.redLight}>
          {dusurenler.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: renk.greenLight, borderRadius: '10px', padding: '12px 14px' }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: renk.green }}>Düşen öğrenci yok!</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dusurenGoster.filter(d => d.isim).map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: i === 0 && !dusurenAcik ? renk.redLight : renk.gray50, borderRadius: '9px' }}>
                    <span style={{ fontSize: '13px', fontWeight: i === 0 ? '700' : '500', color: renk.gray800 }}>
                      {i === 0 && !dusurenAcik ? '🔴 ' : ''}{d.isim}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: renk.red, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {d.onceki} → {d.son} <span style={{ opacity: 0.8 }}>({d.fark})</span>
                    </span>
                  </div>
                ))}
              </div>
              {dusurenler.length > 4 && (
                <button onClick={() => setDusurenAcik(p => !p)} style={{ background: 'none', border: `1px solid ${renk.gray200}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: renk.gray600, fontFamily: font.family, marginTop: '4px' }}>
                  {dusurenAcik ? '▲ Daha az göster' : `▼ +${dusurenler.length - 4} kişi daha`}
                </button>
              )}
            </>
          )}
        </StatCard>

        {/* Kart 4: Son 2 Denemede Artanlar */}
        <StatCard icon="📊" baslik="Son 2 Denemede Artanlar" accentBg={renk.greenLight}>
          {son2Yukselenler.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: renk.redLight, borderRadius: '10px', padding: '12px 14px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: renk.red }}>Artış gösteren yok</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {yukselenGoster.filter(d => d.isim).map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: i === 0 && !yukselenAcik ? renk.greenLight : renk.gray50, borderRadius: '9px' }}>
                    <span style={{ fontSize: '13px', fontWeight: i === 0 ? '700' : '500', color: renk.gray800 }}>
                      {i === 0 && !yukselenAcik ? '🟢 ' : ''}{d.isim}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: renk.green, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {d.onceki} → {d.son} <span style={{ opacity: 0.8 }}>(+{d.fark})</span>
                    </span>
                  </div>
                ))}
              </div>
              {son2Yukselenler.length > 4 && (
                <button onClick={() => setYukselenAcik(p => !p)} style={{ background: 'none', border: `1px solid ${renk.gray200}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: renk.gray600, fontFamily: font.family, marginTop: '4px' }}>
                  {yukselenAcik ? '▲ Daha az göster' : `▼ +${son2Yukselenler.length - 4} kişi daha`}
                </button>
              )}
            </>
          )}
        </StatCard>

      </div>

      {/* Top 5 Yükselen */}
      {yukselenler.length > 0 && (
        <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ color: renk.gray800, marginBottom: '16px', marginTop: 0 }}>🚀 Dönemin Top 5 Yükseleni</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {yukselenler.map((y, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: i === 0 ? '#fefce8' : renk.gray50, borderRadius: '10px', border: `1px solid ${i === 0 ? '#fde047' : renk.gray200}` }}>
                <span style={{ fontSize: '18px', minWidth: '28px' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span style={{ flex: 1, fontWeight: i === 0 ? '700' : '500', color: renk.gray800, fontSize: font.size.md }}>{y.isim}</span>
                <span style={{ fontSize: '13px', color: renk.gray400 }}>{y.ilk} → {y.son}</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: renk.green, minWidth: '60px', textAlign: 'right' }}>+{y.fark} ↑</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend */}
      {trendData.length > 1 && (
        <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ color: renk.gray800, marginBottom: '20px', marginTop: 0 }}>Sınıf Ortalaması Trendi</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={renk.gray100} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: renk.gray400 }} />
              <YAxis tick={{ fontSize: 12, fill: renk.gray400 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${renk.gray200}` }} />
              <Line type="monotone" dataKey="ortalama" stroke={renk.primary} strokeWidth={3} dot={{ fill: renk.primary, r: 5 }} name="Ortalama Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Branş ortalamaları */}
      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ color: renk.gray800, marginBottom: '20px', marginTop: 0 }}>Son Denemede Branş Ortalamaları</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bransOrtalama}>
            <CartesianGrid strokeDasharray="3 3" stroke={renk.gray100} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: renk.gray400 }} />
            <YAxis tick={{ fontSize: 12, fill: renk.gray400 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${renk.gray200}` }} />
            <Bar dataKey="ortalama" fill={renk.primary} radius={[6, 6, 0, 0]} name="Ortalama Net" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Branş bazlı trend */}
      {bransTrend[0].data.length > 1 && (
        <>
          <h3 style={{ color: renk.gray800, marginBottom: '20px' }}>Branş Bazlı Gelişim Trendi</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {bransTrend.map(b => (
              <div key={b.key} style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '20px' }}>
                <h4 style={{ color: renk.gray800, marginBottom: '16px', marginTop: 0 }}>{b.label}</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={b.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={renk.gray100} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: renk.gray400 }} />
                    <YAxis tick={{ fontSize: 11, fill: renk.gray400 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${renk.gray200}` }} />
                    <Line type="monotone" dataKey="ortalama" stroke={renk.primary} strokeWidth={2} dot={{ fill: renk.primary, r: 4 }} name="Ortalama Net" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Öğrenci sıralaması */}
      <h3 style={{ color: renk.gray800, marginBottom: '16px' }}>Öğrenci Sıralaması</h3>
      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden', maxWidth: '500px', marginBottom: '32px' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: renk.gray50 }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>Sıra</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>Öğrenci</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>Toplam Net</th>
            </tr>
          </thead>
          <tbody>
            {sonResults.sort((a, b) => toplamNet(b) - toplamNet(a)).map((r, i) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                <td style={{ padding: '12px 16px', fontWeight: '700', color: i === 0 ? '#f59e0b' : renk.gray600 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td style={{ padding: '12px 16px', color: renk.gray800 }}>{r.isim}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: renk.primary }}>{toplamNet(r).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Değişim tablosu */}
      {degisimler.filter(d => d.isim).length > 0 && (
        <>
          <h3 style={{ color: renk.gray800, marginBottom: '16px' }}>Önceki Denemeye Göre Değişim</h3>
          <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden', maxWidth: '400px', marginBottom: '32px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: renk.gray50 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>Öğrenci</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>Değişim</th>
                </tr>
              </thead>
              <tbody>
                {degisimler.filter(d => d.isim).sort((a, b) => b.fark - a.fark).map((d, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${renk.gray100}` }}>
                    <td style={{ padding: '12px 16px', color: renk.gray800 }}>{d.isim}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: d.fark >= 0 ? renk.green : renk.red }}>
                      {d.fark >= 0 ? '▲ +' : '▼ '}{d.fark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}