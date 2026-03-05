import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font, buton } from '../styles'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine, PieChart, Pie, Legend } from 'recharts'

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

const BRANS_RENKLER = {
  turkce: '#0d9488',
  matematik: '#6366f1',
  fen: '#f59e0b',
  inkılap: '#ec4899',
  ingilizce: '#10b981',
  din: '#8b5cf6',
}

function net(d, y) { return parseFloat((d - y / 3).toFixed(2)) }
function toplamNet(result) {
  return DERSLER.reduce((acc, d) => acc + net(result[`${d.key}_d`] || 0, result[`${d.key}_y`] || 0), 0)
}
function yuzde(d, toplam) {
  if (toplam === 0) return 0
  return Math.round((d / toplam) * 100)
}
function konuSkoru(dogru, yanlis, bos) {
  const toplam = dogru + yanlis + bos
  if (toplam === 0) return 0
  const basari = yuzde(dogru, toplam)
  const soruAgirligi = Math.min(toplam / 200, 1)
  const basariAgirligi = Math.min(basari / 80, 1)
  return Math.round(soruAgirligi * basariAgirligi * 100)
}

// ─── BRANŞ DENEMESİ GRAFİKLERİ ───────────────────────────────────────────────
function BransDenemeGrafik({ bransDenemeleri }) {
  const gruplu = DERSLER.map(d => {
    const liste = bransDenemeleri
      .filter(b => b.brans === d.key)
      .sort((a, b) => new Date(a.tarih) - new Date(b.tarih))
    return { ...d, liste }
  }).filter(d => d.liste.length > 0)

  if (gruplu.length === 0) {
    return (
      <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        Bu öğrenciye ait branş denemesi kaydı yok.
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
        {gruplu.map(d => {
          const trendData = d.liste.map((b, i) => ({
            name: b.ad.length > 18 ? b.ad.slice(0, 18) + '…' : b.ad,
            fullName: b.ad,
            net: net(b.dogru, b.yanlis),
            tarih: b.tarih,
            dogru: b.dogru,
            yanlis: b.yanlis,
            bos: b.bos,
            sira: i + 1,
          }))

          const netler = trendData.map(t => t.net)
          const enYuksek = Math.max(...netler)
          const enDusuk = Math.min(...netler)
          const ortalama = parseFloat((netler.reduce((a, b) => a + b, 0) / netler.length).toFixed(2))
          const ilk = netler[0]
          const son = netler[netler.length - 1]
          const fark = parseFloat((son - ilk).toFixed(2))
          const renk = BRANS_RENKLER[d.key] || '#0d9488'
          const maxSoru = { turkce: 20, matematik: 20, fen: 20, inkılap: 10, ingilizce: 10, din: 10 }[d.key] || 20

          const CustomTooltip = ({ active, payload }) => {
            if (!active || !payload?.length) return null
            const p = payload[0].payload
            return (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '180px' }}>
                <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '6px', fontSize: '13px' }}>{p.fullName}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{p.tarih}</div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                  <span style={{ color: '#10b981' }}>D: {p.dogru}</span>
                  <span style={{ color: '#ef4444' }}>Y: {p.yanlis}</span>
                  <span style={{ color: '#94a3b8' }}>B: {p.bos}</span>
                </div>
                <div style={{ marginTop: '6px', fontSize: '16px', fontWeight: '800', color: renk }}>
                  Net: {p.net}
                  <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', marginLeft: '4px' }}>/ {maxSoru}</span>
                </div>
              </div>
            )
          }

          return (
            <div key={d.key} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {/* Başlık */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: renk }} />
                  <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{d.label}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{d.liste.length} deneme</span>
                </div>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center', background: fark >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', padding: '4px 10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: fark >= 0 ? '#10b981' : '#ef4444' }}>
                    {fark >= 0 ? '↑ +' : '↓ '}{fark}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '2px' }}>gelişim</span>
                </div>
              </div>

              {/* Grafik */}
              <div style={{ padding: '16px 20px 8px' }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 8, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="sira" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `#${v}`} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, maxSoru]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke={renk}
                      strokeWidth={2.5}
                      dot={{ fill: renk, r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                      name="Net"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Özet istatistikler */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #f1f5f9' }}>
                {[
                  { label: 'İlk', value: ilk, color: '#64748b' },
                  { label: 'Son', value: son, color: renk },
                  { label: 'En İyi', value: enYuksek, color: '#10b981' },
                  { label: 'Ortalama', value: ortalama, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>{s.label}</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── EFOR EFEKTİFLİK MATRİSİ ─────────────────────────────────────────────────
function EforEfektiflikMatrisi({ konuListesi }) {
  const ortalamaX = konuListesi.reduce((a, k) => a + k.toplam, 0) / konuListesi.length
  const ortalamaY = konuListesi.reduce((a, k) => a + k.yuzde, 0) / konuListesi.length

  function bolge(x, y) {
    if (x >= ortalamaX && y < ortalamaY) return { label: 'Acil Müdahale', color: '#ef4444', bg: '#fef2f2' }
    if (x < ortalamaX && y >= ortalamaY) return { label: 'Biliyor, Az Çalışıyor', color: '#f59e0b', bg: '#fffbeb' }
    if (x >= ortalamaX && y >= ortalamaY) return { label: 'Çalışıyor ve Başarılı', color: '#10b981', bg: '#f0fdf4' }
    return { label: 'Henüz Başlamadı', color: '#94a3b8', bg: '#f8fafc' }
  }

  const scatterData = konuListesi.map(k => {
    const b = bolge(k.toplam, k.yuzde)
    return { x: k.toplam, y: k.yuzde, konu: k.konu, ders: k.ders, ...b }
  })

  const CustomDot = (props) => {
    const { cx, cy, payload } = props
    return <circle cx={cx} cy={cy} r={7} fill={payload.color} fillOpacity={0.85} stroke="#fff" strokeWidth={2} />
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '220px' }}>
        <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{d.konu}</div>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>{d.ders}</div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>Toplam soru: <strong>{d.x}</strong></div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>Doğruluk: <strong>%{d.y}</strong></div>
        <div style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '20px', background: d.bg, color: d.color, fontWeight: '600', fontSize: '12px', display: 'inline-block' }}>{d.label}</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ color: '#1e293b', marginBottom: '4px', marginTop: 0 }}>🎯 Efor & Efektiflik Matrisi</h3>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Her nokta bir konu. Üzerine gel, detayları gör.</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { color: '#ef4444', bg: '#fef2f2', label: 'Acil Müdahale', aciklama: 'Çok soru, düşük başarı' },
          { color: '#10b981', bg: '#f0fdf4', label: 'Çalışıyor ve Başarılı', aciklama: 'Çok soru, yüksek başarı' },
          { color: '#f59e0b', bg: '#fffbeb', label: 'Biliyor, Az Çalışıyor', aciklama: 'Az soru, yüksek başarı' },
          { color: '#94a3b8', bg: '#f8fafc', label: 'Henüz Başlamadı', aciklama: 'Az soru, düşük başarı' },
        ].map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: b.bg, padding: '6px 12px', borderRadius: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: b.color }}>{b.label}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{b.aciklama}</div>
            </div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" dataKey="x" name="Toplam Soru" tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: '← Az Efor    Çok Efor →', position: 'insideBottom', offset: -20, fontSize: 11, fill: '#94a3b8' }} />
          <YAxis type="number" dataKey="y" name="Doğruluk %" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Doğruluk %', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
          <ZAxis range={[60, 60]} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={ortalamaX} stroke="#e2e8f0" strokeDasharray="4 4" />
          <ReferenceLine y={ortalamaY} stroke="#e2e8f0" strokeDasharray="4 4" />
          <Scatter data={scatterData} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

function MufredatIlerleme({ dailyStudy }) {
  const dersIlerleme = DERSLER.map(d => {
    const konular = KONULAR[d.key] || []
    const konuSkorlar = konular.map(konu => {
      const kayitlar = dailyStudy.filter(k => k.lesson === d.key && k.topic === konu)
      const topD = kayitlar.reduce((a, k) => a + (k.dogru || 0), 0)
      const topY = kayitlar.reduce((a, k) => a + (k.yanlis || 0), 0)
      const topB = kayitlar.reduce((a, k) => a + (k.bos || 0), 0)
      const skor = konuSkoru(topD, topY, topB)
      return { konu, skor }
    })
    const tamamlananKonu = konuSkorlar.filter(k => k.skor >= 80).length
    const genelYuzde = Math.round(konuSkorlar.reduce((a, k) => a + k.skor, 0) / konular.length)
    return { ...d, konular: konuSkorlar, toplamKonu: konular.length, tamamlananKonu, genelYuzde }
  })

  const genelToplam = Math.round(dersIlerleme.reduce((a, d) => a + d.genelYuzde, 0) / DERSLER.length)

  function barRenk(y) {
    if (y >= 80) return '#10b981'
    if (y >= 50) return '#f59e0b'
    if (y > 0) return '#0d9488'
    return '#e2e8f0'
  }

  return (
    <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: '#1e293b', margin: 0 }}>📚 Müfredat Tamamlama</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>200+ soru ve %80+ başarı = Tamamlandı</p>
        </div>
        <div style={{ textAlign: 'center', background: '#f0fdfa', borderRadius: '12px', padding: '12px 20px' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0d9488' }}>{genelToplam}%</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Genel İlerleme</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {dersIlerleme.map(d => (
          <div key={d.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '600', color: '#1e293b', minWidth: '90px' }}>{d.label}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{d.tamamlananKonu}/{d.toplamKonu} tamamlandı</span>
              </div>
              <span style={{ fontWeight: '700', color: barRenk(d.genelYuzde) }}>{d.genelYuzde}%</span>
            </div>
            <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ height: '100%', width: `${d.genelYuzde}%`, background: barRenk(d.genelYuzde), borderRadius: '5px', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {d.konular.map(k => (
                <div key={k.konu} title={`${k.konu}: %${k.skor}`}
                  style={{ flex: 1, minWidth: '20px', height: '6px', borderRadius: '3px', background: k.skor === 0 ? '#e2e8f0' : barRenk(k.skor) }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
        {[{ c: '#10b981', l: 'Tamamlandı (≥80%)' }, { c: '#f59e0b', l: 'Gelişiyor (50-79%)' }, { c: '#0d9488', l: 'Başlandı (<50%)' }, { c: '#e2e8f0', l: 'Çalışılmadı' }].map(l => (
          <div key={l.l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.c }} />
            <span style={{ fontSize: '11px', color: '#64748b' }}>{l.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const AYLAR = [
  { value: '09', label: 'Eylül' }, { value: '10', label: 'Ekim' },
  { value: '11', label: 'Kasım' }, { value: '12', label: 'Aralık' },
  { value: '01', label: 'Ocak' }, { value: '02', label: 'Şubat' },
  { value: '03', label: 'Mart' }, { value: '04', label: 'Nisan' },
  { value: '05', label: 'Mayıs' }, { value: '06', label: 'Haziran' },
]

function formatTarih(isoStr) {
  if (!isoStr) return ''
  const [y, m, d] = isoStr.split('-')
  return `${d}.${m}.${y}`
}

const DERS_LABEL = { turkce: 'Türkçe', matematik: 'Matematik', fen: 'Fen', inkılap: 'İnkılap', ingilizce: 'İngilizce', din: 'Din', paragraf: 'Paragraf' }
const DERS_RENK = { turkce: '#0d9488', matematik: '#6366f1', fen: '#f59e0b', inkılap: '#ec4899', ingilizce: '#10b981', din: '#8b5cf6', paragraf: '#64748b' }

function GunlukTakvim({ dailyStudy, bransDenemeleri }) {
  const bugunObj = new Date()
  const bugunAy = bugunObj.getMonth() + 1
  const bugunStr = bugunObj.toISOString().split('T')[0]

  const [seciliAy, setSeciliAy] = useState(String(bugunAy).padStart(2, '0'))
  const [seciliGun, setSeciliGun] = useState(null) // 'YYYY-MM-DD'

  function ayYil(ayStr) {
    const ay = parseInt(ayStr)
    const bugunYil = new Date().getFullYear()
    if (ay >= 9) return bugunAy >= 9 ? bugunYil : bugunYil - 1
    return bugunAy >= 9 ? bugunYil + 1 : bugunYil
  }

  const yil = ayYil(seciliAy)
  const ayGunSayisi = new Date(yil, parseInt(seciliAy), 0).getDate()
  const ilkGunHaftaIci = new Date(yil, parseInt(seciliAy) - 1, 1).getDay()

  // Takvim verisi: günlük çalışma + branş denemeleri
  const takvimVerisi = useMemo(() => {
    const map = {}
    dailyStudy.filter(k => {
      const [ky, km] = k.date.split('-')
      return ky === String(yil) && km === seciliAy
    }).forEach(k => {
      const gun = k.date.split('-')[2]
      if (!map[gun]) map[gun] = 0
      map[gun] += (k.dogru || 0) + (k.yanlis || 0) + (k.bos || 0)
    })
    bransDenemeleri.filter(b => {
      const [ky, km] = b.tarih.split('-')
      return ky === String(yil) && km === seciliAy
    }).forEach(b => {
      const gun = b.tarih.split('-')[2]
      if (!map[gun]) map[gun] = 0
      map[gun] += (b.dogru || 0) + (b.yanlis || 0) + (b.bos || 0)
    })
    return map
  }, [dailyStudy, bransDenemeleri, yil, seciliAy])

  // Seçili günün kayıtları
  const gunKayitlari = useMemo(() => {
    if (!seciliGun) return null
    const gunluk = dailyStudy.filter(k => k.date === seciliGun).map(k => ({
      tip: 'gunluk',
      ders: k.lesson,
      konu: k.topic || '—',
      dogru: k.dogru || 0,
      yanlis: k.yanlis || 0,
      bos: k.bos || 0,
    }))
    const brans = bransDenemeleri.filter(b => b.tarih === seciliGun).map(b => ({
      tip: 'brans',
      ders: b.brans,
      konu: b.ad,
      dogru: b.dogru || 0,
      yanlis: b.yanlis || 0,
      bos: b.bos || 0,
    }))
    return [...gunluk, ...brans]
  }, [seciliGun, dailyStudy, bransDenemeleri])

  function oncekiAy() {
    const idx = AYLAR.findIndex(a => a.value === seciliAy)
    if (idx > 0) { setSeciliAy(AYLAR[idx - 1].value); setSeciliGun(null) }
  }
  function sonrakiAy() {
    const idx = AYLAR.findIndex(a => a.value === seciliAy)
    if (idx < AYLAR.length - 1) { setSeciliAy(AYLAR[idx + 1].value); setSeciliGun(null) }
  }

  function gunRenk(gun) {
    if (!gun) return 'transparent'
    const tarihStr = `${yil}-${seciliAy}-${gun}`
    const gelecek = tarihStr > bugunStr
    const sayi = takvimVerisi[gun] || 0
    if (gelecek) return sayi > 0 ? '#5eead4' : '#e2e8f0'
    if (sayi === 0) return '#fecaca'
    if (sayi < 30) return '#ccfbf1'
    if (sayi < 80) return '#5eead4'
    return '#0d9488'
  }

  function gunYaziRenk(gun) {
    if (!gun) return '#64748b'
    const tarihStr = `${yil}-${seciliAy}-${gun}`
    const gelecek = tarihStr > bugunStr
    const sayi = takvimVerisi[gun] || 0
    if (!gelecek && sayi === 0) return '#ef4444'
    if (sayi >= 80) return '#fff'
    return '#1e293b'
  }

  const haftaGunleri = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
  const takvimHucreler = []
  for (let i = 0; i < ilkGunHaftaIci; i++) takvimHucreler.push(null)
  for (let i = 1; i <= ayGunSayisi; i++) takvimHucreler.push(String(i).padStart(2, '0'))

  const seciliAyLabel = AYLAR.find(a => a.value === seciliAy)?.label || ''
  const ayIdx = AYLAR.findIndex(a => a.value === seciliAy)

  return (
    <div>
      {/* Ay navigasyonu */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button onClick={oncekiAy} disabled={ayIdx === 0} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: ayIdx === 0 ? '#f8fafc' : '#fff', cursor: ayIdx === 0 ? 'not-allowed' : 'pointer', fontSize: '16px', color: ayIdx === 0 ? '#cbd5e1' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>{seciliAyLabel} {yil}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              🔴 Geçmiş, veri yok &nbsp;|&nbsp; ⬜ Gelecek / bugün &nbsp;|&nbsp; 🟢 Veri var
            </div>
          </div>
          <button onClick={sonrakiAy} disabled={ayIdx === AYLAR.length - 1} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: ayIdx === AYLAR.length - 1 ? '#f8fafc' : '#fff', cursor: ayIdx === AYLAR.length - 1 ? 'not-allowed' : 'pointer', fontSize: '16px', color: ayIdx === AYLAR.length - 1 ? '#cbd5e1' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>

        {/* Haftanın günleri başlığı */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
          {haftaGunleri.map(g => (
            <div key={g} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#94a3b8', padding: '4px' }}>{g}</div>
          ))}
        </div>

        {/* Takvim ızgarası */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {takvimHucreler.map((gun, i) => {
            const tarihStr = gun ? `${yil}-${seciliAy}-${gun}` : null
            const bugunMu = tarihStr === bugunStr
            const secili = tarihStr === seciliGun
            const sayi = gun ? takvimVerisi[gun] || 0 : 0
            return (
              <div
                key={i}
                onClick={() => gun && setSeciliGun(secili ? null : tarihStr)}
                style={{
                  aspectRatio: '1', borderRadius: '10px',
                  background: secili ? '#0d9488' : gunRenk(gun),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: gun ? 'pointer' : 'default',
                  border: bugunMu && !secili ? '2px solid #0d9488' : '2px solid transparent',
                  transition: 'transform 0.1s',
                  transform: secili ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                {gun && (
                  <>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: secili ? '#fff' : gunYaziRenk(gun) }}>{parseInt(gun)}</span>
                    {sayi > 0 && (
                      <span style={{ fontSize: '9px', fontWeight: '700', color: secili ? '#ccfbf1' : sayi >= 80 ? '#fff' : '#0f766e', lineHeight: 1 }}>{sayi}</span>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Seçili gün detayı */}
      {seciliGun && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '2px solid #0d9488', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>📅 {formatTarih(seciliGun)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {gunKayitlari?.length > 0
                  ? `${gunKayitlari.length} kayıt · ${gunKayitlari.reduce((a, k) => a + k.dogru + k.yanlis + k.bos, 0)} soru`
                  : 'Bu gün kayıt girilmemiş'}
              </div>
            </div>
            <button onClick={() => setSeciliGun(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', color: '#64748b', fontSize: '16px' }}>×</button>
          </div>

          {!gunKayitlari || gunKayitlari.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px', fontSize: '13px' }}>Bu gün için kayıt bulunamadı.</div>
          ) : (
            <>
              {/* Özet */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {(() => {
                  const topD = gunKayitlari.reduce((a, k) => a + k.dogru, 0)
                  const topY = gunKayitlari.reduce((a, k) => a + k.yanlis, 0)
                  const topB = gunKayitlari.reduce((a, k) => a + k.bos, 0)
                  const topNet = parseFloat((topD - topY / 3).toFixed(2))
                  return [
                    { label: 'Toplam Soru', value: topD + topY + topB, renk: '#0d9488', bg: '#f0fdfa' },
                    { label: 'Doğru', value: topD, renk: '#10b981', bg: '#f0fdf4' },
                    { label: 'Yanlış', value: topY, renk: '#ef4444', bg: '#fef2f2' },
                    { label: 'Boş', value: topB, renk: '#94a3b8', bg: '#f8fafc' },
                    { label: 'Net', value: topNet, renk: '#6366f1', bg: '#eef2ff' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '8px 14px', textAlign: 'center', minWidth: '70px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: s.renk }}>{s.value}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{s.label}</div>
                    </div>
                  ))
                })()}
              </div>

              {/* Kayıt kartları */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gunKayitlari.map((k, i) => {
                  const dersRenk = DERS_RENK[k.ders] || '#64748b'
                  const dersLabel = DERS_LABEL[k.ders] || k.ders
                  const soruNet = parseFloat((k.dogru - k.yanlis / 3).toFixed(2))
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', borderLeft: `4px solid ${dersRenk}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: dersRenk }}>{dersLabel}</span>
                          {k.tip === 'brans' && (
                            <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>Branş Denemesi</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.konu}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>D:{k.dogru}</span>
                        <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>Y:{k.yanlis}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>B:{k.bos}</span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: dersRenk, minWidth: '40px', textAlign: 'right' }}>{soruNet > 0 ? `+${soruNet}` : soruNet}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function KonuAnalizi({ dailyStudy }) {
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

  const gercekVeriKonular = new Set(dailyStudy.filter(k => k.topic).map(k => `${k.lesson}__${k.topic}`))
  const tumKonular = []
  DERSLER.forEach(d => { (KONULAR[d.key] || []).forEach(k => tumKonular.push({ ders: d.label, konu: k, dersKey: d.key })) })
  const dokunulmamis = tumKonular.filter(k => !gercekVeriKonular.has(`${k.dersKey}__${k.konu}`))

  return (
    <div>
      <MufredatIlerleme dailyStudy={dailyStudy} />
      {konuListesi.length >= 2 && null}

      {(cokCalisAzVeriyor.length > 0 || bosOranYuksek.length > 0) && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#1e293b', marginBottom: '12px' }}>⚠️ Dikkat Gerektiren Durumlar</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cokCalisAzVeriyor.map(k => (
              <div key={k.konu} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🔴</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#9a3412' }}>Çok çalışıyor ama verim düşük</div>
                  <div style={{ color: '#ea580c', fontSize: '13px' }}>{k.ders} → {k.konu} — {k.toplam} soru, %{k.yuzde} doğruluk</div>
                </div>
              </div>
            ))}
            {bosOranYuksek.map(k => (
              <div key={k.konu} style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🟡</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#92400e' }}>Boş oranı yüksek</div>
                  <div style={{ color: '#d97706', fontSize: '13px' }}>{k.ders} → {k.konu} — {k.b} boş / {k.toplam} soru (%{Math.round(k.b / k.toplam * 100)})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>📊 Konu Bazlı Performans</h3>
        {konuListesi.length === 0 ? <p style={{ color: '#94a3b8' }}>Henüz konu bazlı veri yok.</p> : (
          DERSLER.map(d => {
            const dersKonulari = konuListesi.filter(k => k.ders === d.key)
            if (dersKonulari.length === 0) return null
            return (
              <div key={d.key} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ padding: '12px 16px', background: '#f0fdfa', borderBottom: '1px solid #e2e8f0', fontWeight: '700', color: '#0f766e' }}>{d.label}</div>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Konu</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#10b981', fontWeight: '600', fontSize: '13px' }}>D</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>Y</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>B</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Toplam</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#0d9488', fontWeight: '600', fontSize: '13px' }}>Net</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Doğruluk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dersKonulari.map(k => (
                      <tr key={k.konu} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 16px', color: '#1e293b', fontWeight: '500' }}>{k.konu}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#10b981' }}>{k.d}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#ef4444' }}>{k.y}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8' }}>{k.b}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{k.toplam}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#0d9488' }}>{k.net}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                              <div style={{ width: `${k.yuzde}%`, height: '100%', background: k.yuzde >= 70 ? '#10b981' : k.yuzde >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: k.yuzde >= 70 ? '#10b981' : k.yuzde >= 50 ? '#f59e0b' : '#ef4444' }}>%{k.yuzde}</span>
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

      {dokunulmamis.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#1e293b', marginBottom: '12px' }}>📲 Hiç Çalışılmamış Konular</h3>
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {DERSLER.map(d => {
              const eksik = dokunulmamis.filter(k => k.ders === d.label)
              if (eksik.length === 0) return null
              return (
                <div key={d.key} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 16px' }}>
                  <span style={{ fontWeight: '600', color: '#0f766e' }}>{d.label}: </span>
                  <span style={{ color: '#64748b' }}>{eksik.map(k => k.konu).join(', ')}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DONUT GRAFİK ────────────────────────────────────────────────────────────
const DONUT_RENKLER = {
  paragraf:  '#64748b',
  turkce:    '#0d9488',
  matematik: '#6366f1',
  fen:       '#f59e0b',
  inkılap:   '#ec4899',
  ingilizce: '#10b981',
  din:       '#8b5cf6',
}

function DesBazliDonut({ dailyStudy, bransDenemeleri }) {
  const [aralikTip, setAralikTip] = useState('7')
  const [ozelBaslangic, setOzelBaslangic] = useState('')
  const [ozelBitis, setOzelBitis] = useState('')

  const bugun = new Date().toISOString().split('T')[0]

  const { baslangic, bitis } = useMemo(() => {
    if (aralikTip === '7')  return { baslangic: offsetTarih(-6),  bitis: bugun }
    if (aralikTip === '14') return { baslangic: offsetTarih(-13), bitis: bugun }
    if (aralikTip === 'ay') return { baslangic: offsetTarih(-29), bitis: bugun }
    if (aralikTip === 'ozel' && ozelBaslangic && ozelBitis)
      return { baslangic: ozelBaslangic, bitis: ozelBitis }
    return { baslangic: offsetTarih(-6), bitis: bugun }
  }, [aralikTip, ozelBaslangic, ozelBitis])

  const pieData = useMemo(() => {
    const toplamlar = {}

    // Günlük çalışma
    dailyStudy
      .filter(k => k.date >= baslangic && k.date <= bitis)
      .forEach(k => {
        const ders = k.lesson
        toplamlar[ders] = (toplamlar[ders] || 0) + (k.dogru || 0) + (k.yanlis || 0) + (k.bos || 0)
      })

    // Branş denemeleri
    bransDenemeleri
      .filter(b => b.tarih >= baslangic && b.tarih <= bitis)
      .forEach(b => {
        const ders = b.brans
        toplamlar[ders] = (toplamlar[ders] || 0) + (b.dogru || 0) + (b.yanlis || 0) + (b.bos || 0)
      })

    // DERSLER + paragraf sıralaması, yüzdeye göre azalan
    const siralama = ['paragraf', 'turkce', 'matematik', 'fen', 'inkılap', 'ingilizce', 'din']
    return siralama
      .filter(key => (toplamlar[key] || 0) > 0)
      .map(key => ({
        name: { paragraf: 'Paragraf', turkce: 'Türkçe', matematik: 'Matematik', fen: 'Fen', inkılap: 'İnkılap', ingilizce: 'İngilizce', din: 'Din' }[key],
        value: toplamlar[key],
        renk: DONUT_RENKLER[key],
      }))
      .sort((a, b) => b.value - a.value)
  }, [dailyStudy, bransDenemeleri, baslangic, bitis])

  const toplam = pieData.reduce((a, d) => a + d.value, 0)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.renk }} />
          <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>{d.name}</span>
        </div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>{d.value} soru</div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>%{Math.round(d.value / toplam * 100)}</div>
      </div>
    )
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="700">
        %{Math.round(percent * 100)}
      </text>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
      {/* Başlık + tarih filtresi */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>🍩 Ders Bazlı Toplam Soru</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{baslangic} → {bitis}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[{ key: '7', label: 'Son 7 Gün' }, { key: '14', label: 'Son 14 Gün' }, { key: 'ay', label: 'Son 30 Gün' }, { key: 'ozel', label: 'Özel' }].map(a => (
            <button key={a.key} onClick={() => setAralikTip(a.key)} style={{
              padding: '5px 12px', border: 'none', borderRadius: '20px', cursor: 'pointer',
              fontSize: '12px', fontWeight: aralikTip === a.key ? '700' : '400',
              background: aralikTip === a.key ? '#1e293b' : '#f1f5f9',
              color: aralikTip === a.key ? '#fff' : '#64748b', fontFamily: 'inherit',
            }}>{a.label}</button>
          ))}
          {aralikTip === 'ozel' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              <input type="date" value={ozelBaslangic} onChange={e => setOzelBaslangic(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
              <input type="date" value={ozelBitis} onChange={e => setOzelBitis(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
            </div>
          )}
        </div>
      </div>

      {pieData.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>Bu aralıkta kayıt yok.</div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Donut */}
          <div style={{ flex: '0 0 260px' }}>
            <ResponsiveContainer width={260} height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={110}
                  dataKey="value"
                  labelLine={false}
                  isAnimationActive={false}
                  label={<CustomLabel />}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.renk} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend + istatistik */}
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '4px' }}>
              TOPLAM: {toplam} SORU
            </div>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: d.renk, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{d.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round(d.value / toplam * 100)}%`, height: '100%', background: d.renk, borderRadius: '3px' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: d.renk, minWidth: '28px', textAlign: 'right' }}>%{Math.round(d.value / toplam * 100)}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', minWidth: '50px', textAlign: 'right' }}>{d.value} soru</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const DERS_FILTRELER = [
  { key: 'tumu',      label: 'Tümü',      renk: '#1e293b' },
  { key: 'paragraf',  label: 'Paragraf',  renk: '#64748b' },
  { key: 'turkce',    label: 'Türkçe',    renk: '#0d9488' },
  { key: 'matematik', label: 'Matematik', renk: '#6366f1' },
  { key: 'fen',       label: 'Fen',       renk: '#f59e0b' },
  { key: 'inkılap',   label: 'İnkılap',   renk: '#ec4899' },
  { key: 'ingilizce', label: 'İngilizce', renk: '#10b981' },
  { key: 'din',       label: 'Din',       renk: '#8b5cf6' },
]

function gunlerArasi(baslangic, bitis) {
  const gunler = []
  const cur = new Date(baslangic)
  const son = new Date(bitis)
  while (cur <= son) {
    gunler.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return gunler
}

function offsetTarih(gunFark) {
  const d = new Date()
  d.setDate(d.getDate() + gunFark)
  return d.toISOString().split('T')[0]
}

function GunlukSoruAnalizi({ dailyStudy, bransDenemeleri }) {
  const [dersFiltire, setDersFiltire] = useState('tumu')
  const [aralikTip, setAralikTip] = useState('7')
  const [ozelBaslangic, setOzelBaslangic] = useState('')
  const [ozelBitis, setOzelBitis] = useState('')

  const dun = offsetTarih(-1)  // Bugün grafikte 0 görünür, dün en sağda olsun

  const { baslangic, bitis } = useMemo(() => {
    if (aralikTip === '7')  return { baslangic: offsetTarih(-7),  bitis: dun }
    if (aralikTip === '14') return { baslangic: offsetTarih(-14), bitis: dun }
    if (aralikTip === 'ay') return { baslangic: offsetTarih(-30), bitis: dun }
    if (aralikTip === 'ozel' && ozelBaslangic && ozelBitis)
      return { baslangic: ozelBaslangic, bitis: ozelBitis }
    return { baslangic: offsetTarih(-7), bitis: dun }
  }, [aralikTip, ozelBaslangic, ozelBitis])

  const tumGunler = useMemo(() => gunlerArasi(baslangic, bitis), [baslangic, bitis])

  // Tüm kaynakları tek listeye birleştir
  const tumSatirlar = useMemo(() => {
    const gunluk = dailyStudy.map(k => ({
      tarih: k.date,
      ders: k.lesson,
      soru: (k.dogru || 0) + (k.yanlis || 0) + (k.bos || 0),
    }))
    const brans = bransDenemeleri.map(b => ({
      tarih: b.tarih,
      ders: b.brans,   // 'turkce', 'matematik' vb — paragraf olmaz
      soru: (b.dogru || 0) + (b.yanlis || 0) + (b.bos || 0),
    }))
    return [...gunluk, ...brans]
  }, [dailyStudy, bransDenemeleri])

  // Her gün için ders bazlı toplamlar
  const graficVeri = useMemo(() => {
    return tumGunler.map(gun => {
      const gunSatirlari = tumSatirlar.filter(k => k.tarih === gun)
      const [yy, mm, dd] = gun.split('-')
      const row = { tarih: gun, tarihKisa: `${dd}.${mm}`, toplam: 0 }
      DERS_FILTRELER.filter(f => f.key !== 'tumu').forEach(f => { row[f.key] = 0 })
      gunSatirlari.forEach(k => {
        row.toplam += k.soru
        if (row[k.ders] !== undefined) row[k.ders] += k.soru
      })
      return row
    })
  }, [tumGunler, tumSatirlar])

  // Filtreye göre aktif ders listesi (tümü seçiliyse çoklu çizgi)
  const aktifDersler = useMemo(() => {
    if (dersFiltire !== 'tumu') return []
    return DERS_FILTRELER.filter(f =>
      f.key !== 'tumu' && graficVeri.some(g => g[f.key] > 0)
    )
  }, [dersFiltire, graficVeri])

  // Özet istatistikler
  const ozet = useMemo(() => {
    const filtreKey = dersFiltire === 'tumu' ? 'toplam' : dersFiltire
    const degerler = graficVeri.map(g => g[filtreKey] || 0)
    const aktifGunler = degerler.filter(v => v > 0)
    const toplamSoru = degerler.reduce((a, b) => a + b, 0)
    const enCok = aktifGunler.length > 0 ? Math.max(...aktifGunler) : 0
    const ort = aktifGunler.length > 0 ? Math.round(toplamSoru / aktifGunler.length) : 0
    // Seri: bugünden geriye kaç gün arka arkaya aktif
    let seri = 0
    for (let i = graficVeri.length - 1; i >= 0; i--) {
      if ((graficVeri[i][filtreKey] || 0) > 0) seri++
      else break
    }
    return { toplamSoru, aktifGun: aktifGunler.length, enCok, ort, seri }
  }, [graficVeri, dersFiltire])

  const aktifFiltre = DERS_FILTRELER.find(f => f.key === dersFiltire)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const satirlar = payload.filter(p => (p.value || 0) > 0)
    if (!satirlar.length) return null
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '150px' }}>
        <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px', fontSize: '13px' }}>{label}</div>
        {satirlar.map(p => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', fontSize: '12px', marginBottom: '3px' }}>
            <span style={{ color: p.color, fontWeight: '600' }}>
              {DERS_FILTRELER.find(f => f.key === p.dataKey)?.label || 'Toplam'}
            </span>
            <span style={{ fontWeight: '700', color: '#1e293b' }}>{p.value} soru</span>
          </div>
        ))}
        {dersFiltire === 'tumu' && satirlar.length > 1 && (
          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>Toplam</span>
            <span style={{ fontWeight: '800', color: '#0d9488' }}>{satirlar.reduce((a, p) => a + p.value, 0)} soru</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#1e293b', margin: '0 0 4px' }}>📊 Günlük Soru Çözüm Analizi</h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Günlük çalışma + branş denemeleri birleşik — soru sayısı trendi</p>
      </div>

      {/* Özet kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Toplam Soru', value: ozet.toplamSoru, renk: '#0d9488', bg: '#f0fdfa' },
          { label: 'Aktif Gün',   value: ozet.aktifGun,   renk: '#6366f1', bg: '#eef2ff' },
          { label: 'Günlük Ort.', value: ozet.ort,        renk: '#f59e0b', bg: '#fffbeb' },
          { label: 'En Çok (1 G)',value: ozet.enCok,      renk: '#10b981', bg: '#f0fdf4' },
          { label: '🔥 Seri',     value: `${ozet.seri}g`, renk: '#ef4444', bg: '#fef2f2' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: k.renk }}>{k.value}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtre + Grafik — tek kart */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
        {/* Filtreler */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '8px' }}>DERS</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DERS_FILTRELER.map(f => (
                <button key={f.key} onClick={() => setDersFiltire(f.key)} style={{
                  padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: dersFiltire === f.key ? '700' : '400',
                  background: dersFiltire === f.key ? f.renk : '#f1f5f9',
                  color: dersFiltire === f.key ? '#fff' : '#64748b',
                  fontFamily: 'inherit', transition: 'all 0.12s',
                }}>{f.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '8px' }}>TARİH ARALIĞI</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[{ key: '7', label: 'Son 7 Gün' }, { key: '14', label: 'Son 14 Gün' }, { key: 'ay', label: 'Son 30 Gün' }, { key: 'ozel', label: 'Özel Aralık' }].map(a => (
                <button key={a.key} onClick={() => setAralikTip(a.key)} style={{
                  padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: aralikTip === a.key ? '700' : '400',
                  background: aralikTip === a.key ? '#1e293b' : '#f1f5f9',
                  color: aralikTip === a.key ? '#fff' : '#64748b',
                  fontFamily: 'inherit',
                }}>{a.label}</button>
              ))}
              {aralikTip === 'ozel' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px', flexWrap: 'wrap' }}>
                  <input type="date" value={ozelBaslangic} onChange={e => setOzelBaslangic(e.target.value)}
                    style={{ padding: '5px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <span style={{ color: '#94a3b8' }}>—</span>
                  <input type="date" value={ozelBitis} onChange={e => setOzelBitis(e.target.value)}
                    style={{ padding: '5px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                {dersFiltire === 'tumu' ? 'Tüm Dersler — Toplam Soru' : `${aktifFiltre?.label} — Soru Sayısı`}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{baslangic} → {bitis} · {tumGunler.length} gün</div>
            </div>
          </div>

          {graficVeri.every(g => (dersFiltire === 'tumu' ? g.toplam : g[dersFiltire] || 0) === 0) ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px', fontSize: '14px' }}>
              Bu aralıkta kayıt bulunamadı.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={graficVeri} margin={{ top: 8, right: 16, bottom: 8, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="tarihKisa"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  interval={Math.max(0, Math.floor(tumGunler.length / 8) - 1)}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                {ozet.ort > 0 && (
                  <ReferenceLine
                    y={ozet.ort}
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                    label={{ value: `Ort: ${ozet.ort}`, position: 'insideTopRight', fontSize: 11, fill: '#ef4444', fontWeight: '700' }}
                  />
                )}
                {dersFiltire === 'tumu'
                  ? <Line type="monotone" dataKey="toplam" stroke="#0d9488" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  : <Line type="monotone" dataKey={dersFiltire}
                      stroke={aktifFiltre?.renk || '#0d9488'} strokeWidth={2.5}
                      dot={{ r: 4, fill: aktifFiltre?.renk || '#0d9488', strokeWidth: 0 }}
                      activeDot={{ r: 6 }} />
                }
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Donut Grafik */}
      <DesBazliDonut dailyStudy={dailyStudy} bransDenemeleri={bransDenemeleri} />
    </div>
  )
}

export default function StudentDetail({ studentId, onBack }) {
  const [student, setStudent] = useState(null)
  const [results, setResults] = useState([])
  const [dailyStudy, setDailyStudy] = useState([])
  const [bransDenemeleri, setBransDenemeleri] = useState([])
  const [tab, setTab] = useState('gunluk')
  const [editResult, setEditResult] = useState(null)
  const [editData, setEditData] = useState({})
  const [editSuccess, setEditSuccess] = useState('')
  const [editError, setEditError] = useState('')

  useEffect(() => { fetchAll() }, [studentId])

  async function fetchAll() {
    const [s, r, d, b] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).single(),
      supabase.from('exam_results').select('*, exams(name, date, type)').eq('student_id', studentId).order('exams(date)', { ascending: true }),
      supabase.from('daily_study').select('*').eq('student_id', studentId).order('date', { ascending: false }),
      supabase.from('brans_denemeler').select('*').eq('student_id', studentId).order('tarih', { ascending: true }),
    ])
    setStudent(s.data)
    setResults(r.data || [])
    setDailyStudy(d.data || [])
    setBransDenemeleri(b.data || [])
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
    fetchAll()
  }

  const tumDenemeler = [...results].sort((a, b) => new Date(a.exams?.date) - new Date(b.exams?.date))
  const sonResult = tumDenemeler[tumDenemeler.length - 1]
  const trendData = tumDenemeler.map(r => ({ name: r.exams?.name, net: parseFloat(toplamNet(r).toFixed(2)), tip: r.exams?.type === 'common' ? 'Ortak' : 'Bireysel' }))
  const bransBarData = sonResult ? DERSLER.map(d => ({ ders: d.label, net: net(sonResult[`${d.key}_d`] || 0, sonResult[`${d.key}_y`] || 0) })) : []
  const bransTrend = DERSLER.map(d => ({ label: d.label, key: d.key, color: BRANS_RENKLER[d.key], data: tumDenemeler.map(r => ({ name: r.exams?.name, net: net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0) })) }))

  if (!student) return <p style={{ color: '#94a3b8' }}>Yükleniyor...</p>

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif' }}>
      <button onClick={onBack} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', color: '#64748b' }}>← Geri</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <div style={{ width: '48px', height: '48px', background: '#f0fdfa', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>👤</div>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>{student.full_name}</h2>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>@{student.username}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'gunluk', label: '📅 Günlük Çalışma' },
          { key: 'denemeler', label: '📝 Denemeler' },
          { key: 'grafik', label: '📈 Gelişim Grafiği' },
          { key: 'brans_grafik', label: '🎯 Branş Grafikleri' },
          { key: 'soru_analizi', label: '📊 Soru Analizi' },
          { key: 'konu', label: '🔍 Konu Analizi' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: tab === t.key ? '#0d9488' : '#f1f5f9', color: tab === t.key ? '#fff' : '#64748b', fontWeight: tab === t.key ? '600' : '400', fontSize: '14px' }}>{t.label}</button>
        ))}
      </div>

      {editResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0006', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '8px', color: '#1e293b' }}>Sonuç Düzenle</h3>
            <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px' }}>{editResult.exams?.name} — {editResult.exams?.date}</p>
            <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Ders</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#10b981', fontWeight: '600', fontSize: '13px' }}>D</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>Y</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>B</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#0d9488', fontWeight: '600', fontSize: '13px' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {DERSLER.map(d => (
                  <tr key={d.key} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: '600', color: '#1e293b' }}>{d.label}</td>
                    {['d', 'y', 'b'].map(alan => (
                      <td key={alan} style={{ padding: '6px' }}>
                        <input type="number" min="0" value={editData[`${d.key}_${alan}`] || ''} onChange={e => setEditData(prev => ({ ...prev, [`${d.key}_${alan}`]: parseInt(e.target.value) || 0 }))} style={{ width: '56px', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '14px' }} />
                      </td>
                    ))}
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#0d9488' }}>{net(editData[`${d.key}_d`] || 0, editData[`${d.key}_y`] || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editError && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{editError}</div>}
            {editSuccess && <div style={{ background: '#f0fdf4', color: '#10b981', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{editSuccess}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleEditSave} style={{ padding: '10px 24px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Kaydet</button>
              <button onClick={() => setEditResult(null)} style={{ padding: '10px 24px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* DENEMELER TAB */}
      {tab === 'denemeler' && (
        <div>
          <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>Tüm Deneme Sonuçları</h3>
          {results.length === 0 ? <p style={{ color: '#94a3b8' }}>Henüz deneme sonucu yok</p> : (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Deneme</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Tarih</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Tür</th>
                    {DERSLER.map(d => <th key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>{d.label}</th>)}
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#0d9488', fontWeight: '600', fontSize: '13px' }}>Toplam</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {tumDenemeler.map(r => (
                    <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '500' }}>{r.exams?.name}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{r.exams?.date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: r.exams?.type === 'common' ? '#f0fdfa' : '#fff7ed', color: r.exams?.type === 'common' ? '#0d9488' : '#ea580c' }}>
                          {r.exams?.type === 'common' ? 'Ortak' : 'Bireysel'}
                        </span>
                      </td>
                      {DERSLER.map(d => <td key={d.key} style={{ padding: '12px 10px', textAlign: 'center', color: '#64748b' }}>{net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0)}</td>)}
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#0d9488' }}>{toplamNet(r).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button onClick={() => openEdit(r)} style={{ padding: '6px 14px', background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Düzenle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GRAFİK TAB */}
      {tab === 'grafik' && (
        <div>
          {trendData.length < 2 ? <p style={{ color: '#94a3b8' }}>Grafik için en az 2 deneme gerekli.</p> : (
            <>
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '4px', marginTop: 0 }}>📈 Toplam Net Gelişimi</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} formatter={(v, n, p) => [v, `Net (${p.payload.tip})`]} />
                    <Line type="monotone" dataKey="net" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {sonResult && (
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ color: '#1e293b', marginBottom: '4px', marginTop: 0 }}>📊 Son Denemede Branş Netlerim</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={bransBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="ders" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} formatter={(v) => [v, 'Net']} />
                      <Bar dataKey="net" fill="#0d9488" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#64748b' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>🔍 Branş Bazlı Gelişim</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                {bransTrend.map(b => (
                  <div key={b.key} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
                    <h4 style={{ color: '#1e293b', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color, display: 'inline-block' }}></span>{b.label}
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={b.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} formatter={(v) => [v, 'Net']} />
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

      {/* BRANŞ GRAFİKLERİ TAB — YENİ */}
      {tab === 'brans_grafik' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#1e293b', margin: '0 0 4px' }}>🎯 Branş Denemesi Gelişim Grafikleri</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              Öğrencinin kendi girdiği branş denemeleri — her branş için net trendi
            </p>
          </div>
          <BransDenemeGrafik bransDenemeleri={bransDenemeleri} />
        </div>
      )}

      {/* SORU ANALİZİ TAB */}
      {tab === 'soru_analizi' && (
        <GunlukSoruAnalizi dailyStudy={dailyStudy} bransDenemeleri={bransDenemeleri} />
      )}

      {/* KONU TAB */}
      {tab === 'konu' && <KonuAnalizi dailyStudy={dailyStudy} />}

      {/* GÜNLÜK TAB */}
      {tab === 'gunluk' && (
        <GunlukTakvim dailyStudy={dailyStudy} bransDenemeleri={bransDenemeleri} />
      )}
    </div>
  )
}
