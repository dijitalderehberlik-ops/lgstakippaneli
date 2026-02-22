import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font } from '../styles'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import Students from './Students'
import ExamEntry from './ExamEntry'
import DailyStudy from './DailyStudy'

const DERSLER = [
  { key: 'turkce', label: 'Türkçe' },
  { key: 'matematik', label: 'Matematik' },
  { key: 'fen', label: 'Fen' },
  { key: 'inkılap', label: 'İnkılap' },
  { key: 'ingilizce', label: 'İngilizce' },
  { key: 'din', label: 'Din' },
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
          { key: 'daily', label: 'Günlük Çalışma', icon: '📅' },
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
        {page === 'daily' && <DailyStudy session={session} />}
      </div>
    </div>
  )
}

function DashboardHome() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

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

    const netler = (sonResults || []).map(r => toplamNet(r))
    const ortalama = netler.length > 0 ? (netler.reduce((a, b) => a + b, 0) / netler.length).toFixed(2) : 0
    const enYuksek = netler.length > 0 ? Math.max(...netler).toFixed(2) : 0

    const bransOrtalama = DERSLER.map(d => ({
      ders: d.label,
      ortalama: parseFloat(((sonResults || []).map(r => net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)).reduce((a, b) => a + b, 0) / Math.max((sonResults || []).length, 1)).toFixed(2))
    }))

    const degisimler = []
    if (oncekiResults.length > 0) {
      sonResults?.forEach(sr => {
        const or = oncekiResults.find(r => r.student_id === sr.student_id)
        if (or) degisimler.push({ student_id: sr.student_id, fark: parseFloat((toplamNet(sr) - toplamNet(or)).toFixed(2)) })
      })
    }

    // Tüm denemeler için trend verileri
    const allExamResults = []
    for (const exam of exams) {
      const { data: examResults } = await supabase.from('exam_results').select('*').eq('exam_id', exam.id)
      if (examResults && examResults.length > 0) {
        allExamResults.push({ exam, results: examResults })
      }
    }

    // Toplam net trendi
    const trendData = allExamResults.map(({ exam, results }) => ({
      name: exam.name,
      ortalama: parseFloat((results.map(r => toplamNet(r)).reduce((a, b) => a + b, 0) / results.length).toFixed(2))
    }))

    // Branş bazlı trend verileri
    const bransTrend = DERSLER.map(d => ({
      label: d.label,
      key: d.key,
      data: allExamResults.map(({ exam, results }) => ({
        name: exam.name,
        ortalama: parseFloat((results.map(r => net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)).reduce((a, b) => a + b, 0) / results.length).toFixed(2))
      }))
    }))

    setStats({
      sonDeneme, ortalama, enYuksek,
      katilim: sonResults?.length || 0,
      bransOrtalama, trendData, bransTrend,
      degisimler: degisimler.map(d => ({ ...d, isim: studentMap[d.student_id] || '' })),
      sonResults: sonResults?.map(r => ({ ...r, isim: studentMap[r.student_id] || '' })).filter(r => r.isim) || []
    })
    setLoading(false)
  }

  if (loading) return <p style={{ color: renk.gray400 }}>Yükleniyor...</p>
  if (!stats) return (
    <div>
      <h2 style={{ color: renk.gray800 }}>Genel Bakış</h2>
      <p style={{ color: renk.gray400 }}>Henüz ortak deneme eklenmemiş.</p>
    </div>
  )

  return (
    <div>
      <h2 style={{ color: renk.gray800, marginBottom: '4px' }}>Genel Bakış</h2>
      <p style={{ color: renk.gray400, marginBottom: '24px', fontSize: font.size.md }}>
        Son deneme: <strong style={{ color: renk.primary }}>{stats.sonDeneme.name}</strong> ({stats.sonDeneme.date})
      </p>

      {/* Özet kartlar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {[
          { label: 'Sınıf Ortalaması', value: stats.ortalama, bg: renk.primaryLight, color: renk.primary, icon: '📊' },
          { label: 'En Yüksek Net', value: stats.enYuksek, bg: renk.greenLight, color: renk.green, icon: '🏆' },
          { label: 'Katılım', value: stats.katilim + ' öğrenci', bg: '#fff7ed', color: '#ea580c', icon: '👥' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '14px', padding: '20px 24px', minWidth: '180px', flex: 1 }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>{k.icon}</div>
            <div style={{ fontSize: font.size.sm, color: renk.gray600, marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Toplam net trend */}
      {stats.trendData.length > 1 && (
        <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ color: renk.gray800, marginBottom: '20px' }}>Sınıf Ortalaması Trendi</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={renk.gray100} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: renk.gray400 }} />
              <YAxis tick={{ fontSize: 12, fill: renk.gray400 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${renk.gray200}` }} />
              <Line type="monotone" dataKey="ortalama" stroke={renk.primary} strokeWidth={3} dot={{ fill: renk.primary, r: 5 }} name="Ortalama Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Branş ortalamaları bar */}
      <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ color: renk.gray800, marginBottom: '20px' }}>Son Denemede Branş Ortalamaları</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.bransOrtalama}>
            <CartesianGrid strokeDasharray="3 3" stroke={renk.gray100} />
            <XAxis dataKey="ders" tick={{ fontSize: 12, fill: renk.gray400 }} />
            <YAxis tick={{ fontSize: 12, fill: renk.gray400 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${renk.gray200}` }} />
            <Bar dataKey="ortalama" fill={renk.primary} radius={[6, 6, 0, 0]} name="Ortalama Net" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Branş bazlı trend grafikleri */}
      {stats.bransTrend[0].data.length > 1 && (
        <>
          <h3 style={{ color: renk.gray800, marginBottom: '20px' }}>Branş Bazlı Gelişim Trendi</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {stats.bransTrend.map(b => (
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
            {stats.sonResults.sort((a, b) => toplamNet(b) - toplamNet(a)).map((r, i) => (
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
      {stats.degisimler.filter(d => d.isim).length > 0 && (
        <>
          <h3 style={{ color: renk.gray800, marginBottom: '16px' }}>Önceki Denemeye Göre Değişim</h3>
          <div style={{ background: renk.white, borderRadius: '14px', border: `1px solid ${renk.gray200}`, overflow: 'hidden', maxWidth: '400px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: renk.gray50 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>Öğrenci</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: font.size.sm, color: renk.gray400, fontWeight: '600' }}>Değişim</th>
                </tr>
              </thead>
              <tbody>
                {stats.degisimler.filter(d => d.isim).sort((a, b) => b.fark - a.fark).map((d, i) => (
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