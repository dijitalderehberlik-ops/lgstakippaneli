import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { renk, font, buton } from '../styles'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine } from 'recharts'

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
function konuSkoru(dogru, yanlis, bos) {
  const toplam = dogru + yanlis + bos
  if (toplam === 0) return 0
  const basari = yuzde(dogru, toplam)
  const soruAgirligi = Math.min(toplam / 200, 1)
  const basariAgirligi = Math.min(basari / 80, 1)
  return Math.round(soruAgirligi * basariAgirligi * 100)
}

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

function KonuAnalizi({ dailyStudy }) {
  const bugun = new Date()
  const bugunAy = bugun.getMonth() + 1
  const [seciliAy, setSeciliAy] = useState(String(bugunAy).padStart(2, '0'))

  function ayYil(ayStr) {
    const ay = parseInt(ayStr)
    const bugunYil = new Date().getFullYear()
    if (ay >= 9) return bugunAy >= 9 ? bugunYil : bugunYil - 1
    return bugunAy >= 9 ? bugunYil + 1 : bugunYil
  }

  const yil = ayYil(seciliAy)
  const bugunStr = new Date().toISOString().split('T')[0]

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

  const gercekVeriKonular = new Set(dailyStudy.filter(k => k.topic).map(k => `${k.lesson}__${k.topic}`))
  const tumKonular = []
  DERSLER.forEach(d => { (KONULAR[d.key] || []).forEach(k => tumKonular.push({ ders: d.label, konu: k, dersKey: d.key })) })
  const dokunulmamis = tumKonular.filter(k => !gercekVeriKonular.has(`${k.dersKey}__${k.konu}`))

  const haftaGunleri = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
  const takvimHucreler = []
  for (let i = 0; i < ilkGunHaftaIci; i++) takvimHucreler.push(null)
  for (let i = 1; i <= ayGunSayisi; i++) takvimHucreler.push(i)

  function gunRenk(gun) {
    if (!gun) return 'transparent'
    const tarihStr = `${yil}-${seciliAy}-${String(gun).padStart(2, '0')}`
    const gelecek = tarihStr > bugunStr
    const bugunMu = tarihStr === bugunStr
    const sayi = takvimVerisi[gun] || 0

    if (gelecek || bugunMu) {
      // Gelecek veya bugün — gri nötr
      if (sayi === 0) return '#e2e8f0'
      if (sayi < 30) return '#ccfbf1'
      if (sayi < 80) return '#5eead4'
      return '#0d9488'
    } else {
      // Geçmiş gün
      if (sayi === 0) return '#fecaca' // Kırmızı — ihmal
      if (sayi < 30) return '#ccfbf1'
      if (sayi < 80) return '#5eead4'
      return '#0d9488'
    }
  }

  function gunYaziRenk(gun) {
    if (!gun) return '#64748b'
    const tarihStr = `${yil}-${seciliAy}-${String(gun).padStart(2, '0')}`
    const gelecek = tarihStr > bugunStr
    const sayi = takvimVerisi[gun] || 0
    if (!gelecek && sayi === 0) return '#ef4444'
    if (sayi >= 80) return '#fff'
    return '#64748b'
  }

  return (
    <div>
      <MufredatIlerleme dailyStudy={dailyStudy} />
      {konuListesi.length >= 2 && <EforEfektiflikMatrisi konuListesi={konuListesi} />}

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

      {/* Gelişmiş Aylık Takvim */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h3 style={{ color: '#1e293b', margin: 0 }}>🗓️ Aylık Çalışma Takvimi</h3>
          <select value={seciliAy} onChange={e => setSeciliAy(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#1e293b' }}>
            {AYLAR.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px', marginTop: '4px' }}>
          🔴 Kırmızı = geçmiş gün, veri girilmemiş &nbsp;|&nbsp; ⬜ Gri = henüz gelmemiş gün
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {haftaGunleri.map(g => <div key={g} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#94a3b8', padding: '4px' }}>{g}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {takvimHucreler.map((gun, i) => {
            const tarihStr = gun ? `${yil}-${seciliAy}-${String(gun).padStart(2, '0')}` : null
            const bugunMu = tarihStr === bugunStr
            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: '8px',
                background: gunRenk(gun),
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: bugunMu ? '2px solid #0d9488' : '2px solid transparent',
              }}>
                {gun && <>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: gunYaziRenk(gun) }}>{gun}</span>
                  {takvimVerisi[gun] > 0 && (
                    <span style={{ fontSize: '10px', color: (takvimVerisi[gun] || 0) >= 80 ? '#fff' : '#0d9488', fontWeight: '600' }}>{takvimVerisi[gun]}</span>
                  )}
                </>}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#fecaca' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Giriş yapılmadı (geçmiş)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Gelecek / Bugün boş</span>
          </div>
          {['#ccfbf1', '#5eead4', '#0d9488'].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: c }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{i === 0 ? 'Az' : i === 1 ? 'Orta' : 'Çok'}</span>
            </div>
          ))}
        </div>
      </div>

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

export default function StudentDetail({ studentId, onBack }) {
  const [student, setStudent] = useState(null)
  const [results, setResults] = useState([])
  const [dailyStudy, setDailyStudy] = useState([])
  const [tab, setTab] = useState('denemeler')
  const [editResult, setEditResult] = useState(null)
  const [editData, setEditData] = useState({})
  const [editSuccess, setEditSuccess] = useState('')
  const [editError, setEditError] = useState('')

  useEffect(() => { fetchAll() }, [studentId])

  async function fetchAll() {
    const [s, r, d] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).single(),
      supabase.from('exam_results').select('*, exams(name, date, type)').eq('student_id', studentId).order('exams(date)', { ascending: true }),
      supabase.from('daily_study').select('*').eq('student_id', studentId).order('date', { ascending: false }),
    ])
    setStudent(s.data)
    setResults(r.data || [])
    setDailyStudy(d.data || [])
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
  const BRANS_RENKLER = { 'Türkçe': '#0d9488', 'Matematik': '#6366f1', 'Fen': '#f59e0b', 'İnkılap': '#ec4899', 'İngilizce': '#10b981', 'Din': '#8b5cf6' }
  const bransTrend = DERSLER.map(d => ({ label: d.label, key: d.key, color: BRANS_RENKLER[d.label], data: tumDenemeler.map(r => ({ name: r.exams?.name, net: net(r[`${d.key}_d`] || 0, r[`${d.key}_y`] || 0) })) }))

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
        {[{ key: 'denemeler', label: '📝 Denemeler' }, { key: 'grafik', label: '📈 Gelişim Grafiği' }, { key: 'konu', label: '🔍 Konu Analizi' }, { key: 'gunluk', label: '📅 Günlük Çalışma' }].map(t => (
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

      {tab === 'konu' && <KonuAnalizi dailyStudy={dailyStudy} />}

      {tab === 'gunluk' && (
        <div>
          <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>Günlük Çalışma Geçmişi</h3>
          {dailyStudy.length === 0 ? <p style={{ color: '#94a3b8' }}>Henüz günlük çalışma kaydı yok</p> : (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Tarih</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Ders</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Konu</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#10b981', fontWeight: '600', fontSize: '13px' }}>D</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>Y</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>B</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#0d9488', fontWeight: '600', fontSize: '13px' }}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyStudy.map(d => (
                    <tr key={d.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', color: '#1e293b' }}>{d.date}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: '500' }}>{d.lesson}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{d.topic || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#10b981' }}>{d.dogru}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#ef4444' }}>{d.yanlis}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8' }}>{d.bos}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#0d9488' }}>{net(d.dogru, d.yanlis)}</td>
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