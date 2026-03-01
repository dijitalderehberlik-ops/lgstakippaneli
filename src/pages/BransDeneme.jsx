import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { font, renk } from '../styles'

const BRANSLAR = [
  { key: 'turkce', label: 'Türkçe', max: 20 },
  { key: 'matematik', label: 'Matematik', max: 20 },
  { key: 'fen', label: 'Fen', max: 20 },
  { key: 'inkılap', label: 'İnkılap', max: 10 },
  { key: 'ingilizce', label: 'İngilizce', max: 10 },
  { key: 'din', label: 'Din', max: 10 },
]

function net(d, y) {
  return parseFloat((d - y / 3).toFixed(2))
}

export default function BransDeneme({ userId, isMobile }) {
  const [tab, setTab] = useState('ekle') // 'ekle' | 'gecmis'
  const [denemeler, setDenemeler] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    ad: '',
    tarih: new Date().toISOString().split('T')[0],
    brans: 'turkce',
    dogru: '',
    yanlis: '',
    bos: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [silOnay, setSilOnay] = useState(null)
  const [duzenle, setDuzenle] = useState(null)
  const [duzenleForm, setDuzenleForm] = useState(null)

  useEffect(() => {
    if (userId) yukle()
  }, [userId])

  async function yukle() {
    setLoading(true)
    const { data } = await supabase
      .from('brans_denemeler')
      .select('*')
      .eq('student_id', userId)
      .order('tarih', { ascending: false })
    setDenemeler(data || [])
    setLoading(false)
  }

  async function handleKaydet() {
    setError('')
    setSuccess('')
    if (!form.ad.trim()) { setError('Deneme adı zorunlu'); return }
    if (!form.brans) { setError('Branş seçin'); return }
    const d = parseInt(form.dogru) || 0
    const y = parseInt(form.yanlis) || 0
    const b = parseInt(form.bos) || 0
    const bransObj = BRANSLAR.find(br => br.key === form.brans)
    if (d + y + b > bransObj.max) {
      setError(`Toplam soru sayısı ${bransObj.max}'yi geçemez`)
      return
    }
    setSaving(true)
    const { error: err } = await supabase.from('brans_denemeler').insert({
      student_id: userId,
      ad: form.ad.trim(),
      tarih: form.tarih,
      brans: form.brans,
      dogru: d,
      yanlis: y,
      bos: b,
    })
    if (err) {
      setError('Kaydedilemedi: ' + err.message)
      setSaving(false)
      return
    }
    setSuccess('Kaydedildi ✓')
    setForm({ ad: '', tarih: new Date().toISOString().split('T')[0], brans: form.brans, dogru: '', yanlis: '', bos: '' })
    yukle()
    setSaving(false)
  }

  async function handleSil(id) {
    await supabase.from('brans_denemeler').delete().eq('id', id)
    setSilOnay(null)
    yukle()
  }

  function handleDuzenleAc(d) {
    setDuzenle(d.id)
    setDuzenleForm({ ad: d.ad, tarih: d.tarih, brans: d.brans, dogru: d.dogru, yanlis: d.yanlis, bos: d.bos })
  }

  async function handleDuzenleKaydet() {
    const d2 = parseInt(duzenleForm.dogru) || 0
    const y2 = parseInt(duzenleForm.yanlis) || 0
    const b2 = parseInt(duzenleForm.bos) || 0
    const { error: err } = await supabase.from('brans_denemeler').update({
      ad: duzenleForm.ad,
      tarih: duzenleForm.tarih,
      brans: duzenleForm.brans,
      dogru: d2,
      yanlis: y2,
      bos: b2,
    }).eq('id', duzenle)
    if (err) { setError('Güncellenemedi: ' + err.message); return }
    setDuzenle(null)
    setDuzenleForm(null)
    yukle()
  }

  const secilenBrans = BRANSLAR.find(b => b.key === form.brans)
  const anlikNet = net(parseInt(form.dogru) || 0, parseInt(form.yanlis) || 0)

  const gruplu = BRANSLAR.map(br => {
    const liste = denemeler.filter(d => d.brans === br.key)
    if (liste.length === 0) return null
    return { ...br, liste }
  }).filter(Boolean)

  const selectStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #e2e8f0', fontSize: '14px',
    fontFamily: font.family, background: '#fff', color: '#1e293b',
    boxSizing: 'border-box',
  }
  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #e2e8f0', fontSize: '14px',
    fontFamily: font.family, background: '#fff', color: '#1e293b',
    boxSizing: 'border-box',
  }
  const numStyle = {
    ...inputStyle, textAlign: 'center', fontSize: '18px', fontWeight: '700',
  }

  return (
    <div style={{ fontFamily: font.family }}>
      <h2 style={{ color: '#1e293b', marginBottom: '20px', fontSize: isMobile ? '18px' : '22px' }}>
        🎯 Branş Denemesi
      </h2>

      {/* Tab */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[{ key: 'ekle', label: '➕ Yeni Ekle' }, { key: 'gecmis', label: '📋 Geçmiş' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 20px', border: 'none', borderRadius: '20px', cursor: 'pointer',
            fontFamily: font.family, fontSize: '13px', fontWeight: tab === t.key ? '700' : '400',
            background: tab === t.key ? '#0d9488' : '#f1f5f9',
            color: tab === t.key ? '#fff' : '#64748b',
          }}>{t.label}</button>
        ))}
      </div>

      {/* YENİ EKLE */}
      {tab === 'ekle' && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', maxWidth: '480px' }}>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Deneme Adı *</label>
            <input
              value={form.ad}
              onChange={e => setForm(p => ({ ...p, ad: e.target.value }))}
              placeholder="örn: Orijinal Yayınları Türkçe 3"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Branş *</label>
              <select value={form.brans} onChange={e => setForm(p => ({ ...p, brans: e.target.value }))} style={selectStyle}>
                {BRANSLAR.map(b => <option key={b.key} value={b.key}>{b.label} ({b.max} soru)</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Tarih *</label>
              <input type="date" value={form.tarih} onChange={e => setForm(p => ({ ...p, tarih: e.target.value }))} style={{ ...inputStyle, width: 'auto', minWidth: '100%' }} />
            </div>
          </div>

          {/* Soru girişi */}
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                {secilenBrans?.label} — {secilenBrans?.max} soru
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Toplam: {(parseInt(form.dogru) || 0) + (parseInt(form.yanlis) || 0) + (parseInt(form.bos) || 0)} / {secilenBrans?.max}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
              {[
                { key: 'dogru', label: 'Doğru ✅', color: '#10b981' },
                { key: 'yanlis', label: 'Yanlış ❌', color: '#ef4444' },
                { key: 'bos', label: 'Boş ⬜', color: '#94a3b8' },
              ].map(alan => (
                <div key={alan.key}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: alan.color, textAlign: 'center', marginBottom: '4px' }}>{alan.label}</label>
                  <input
                    type="number" min="0"
                    value={form[alan.key]}
                    onChange={e => setForm(p => ({ ...p, [alan.key]: e.target.value }))}
                    style={numStyle}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#0d9488', textAlign: 'center', marginBottom: '4px' }}>Net 🎯</label>
                <div style={{
                  ...numStyle, background: '#f0fdfa', border: '1px solid #99f6e4',
                  color: anlikNet >= 0 ? '#0d9488' : '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {anlikNet}
                </div>
              </div>
            </div>
          </div>

          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}
          {success && <div style={{ background: '#f0fdf4', color: '#10b981', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', fontWeight: '600' }}>{success}</div>}

          <button
            onClick={handleKaydet}
            disabled={saving}
            style={{
              width: '100%', padding: '12px', background: saving ? '#99f6e4' : '#0d9488',
              color: '#fff', border: 'none', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '700', fontSize: '15px', fontFamily: font.family,
            }}
          >
            {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
          </button>
        </div>
      )}

      {/* GEÇMİŞ */}
      {tab === 'gecmis' && (
        <div>
          {loading ? (
            <p style={{ color: '#94a3b8' }}>Yükleniyor...</p>
          ) : denemeler.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              Henüz branş denemesi eklenmemiş.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {gruplu.map(br => (
                <div key={br.key} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#f0fdfa', borderBottom: '1px solid #e2e8f0', fontWeight: '700', color: '#0f766e', fontSize: '14px' }}>
                    {br.label}
                    <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b', marginLeft: '8px' }}>{br.liste.length} deneme</span>
                  </div>
                  {br.liste.map(d => (
                    <div key={d.id}>
                      {duzenle === d.id ? (
                        /* DÜZENLEME SATIRI */
                        <div style={{ padding: '14px 16px', background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Ad</label>
                              <input value={duzenleForm.ad} onChange={e => setDuzenleForm(p => ({ ...p, ad: e.target.value }))} style={{ ...inputStyle, fontSize: '13px' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Tarih</label>
                              <input type="date" value={duzenleForm.tarih} onChange={e => setDuzenleForm(p => ({ ...p, tarih: e.target.value }))} style={{ ...inputStyle, fontSize: '13px' }} />
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                            {[{ key: 'dogru', label: 'Doğru', color: '#10b981' }, { key: 'yanlis', label: 'Yanlış', color: '#ef4444' }, { key: 'bos', label: 'Boş', color: '#94a3b8' }].map(alan => (
                              <div key={alan.key}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: alan.color, display: 'block', textAlign: 'center', marginBottom: '4px' }}>{alan.label}</label>
                                <input type="number" min="0" value={duzenleForm[alan.key]} onChange={e => setDuzenleForm(p => ({ ...p, [alan.key]: e.target.value }))}
                                  style={{ ...inputStyle, textAlign: 'center', fontSize: '15px', fontWeight: '700' }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleDuzenleKaydet} style={{ flex: 1, padding: '8px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: font.family }}>Kaydet</button>
                            <button onClick={() => { setDuzenle(null); setDuzenleForm(null) }} style={{ flex: 1, padding: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: font.family }}>İptal</button>
                          </div>
                        </div>
                      ) : silOnay === d.id ? (
                        /* SİLME ONAYI */
                        <div style={{ padding: '12px 16px', background: '#fef2f2', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>Bu deneme silinsin mi?</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleSil(d.id)} style={{ padding: '6px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: font.family }}>Evet, Sil</button>
                            <button onClick={() => setSilOnay(null)} style={{ padding: '6px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: font.family }}>İptal</button>
                          </div>
                        </div>
                      ) : (
                        /* NORMAL SATIR */
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{d.ad}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{d.tarih}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                              <span style={{ color: '#10b981', fontWeight: '600' }}>D:{d.dogru}</span>
                              <span style={{ color: '#ef4444', fontWeight: '600' }}>Y:{d.yanlis}</span>
                              <span style={{ color: '#94a3b8', fontWeight: '600' }}>B:{d.bos}</span>
                            </div>
                            <div style={{ background: '#f0fdfa', borderRadius: '8px', padding: '4px 12px', fontWeight: '800', color: '#0d9488', fontSize: '15px' }}>
                              {net(d.dogru, d.yanlis)}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleDuzenleAc(d)} style={{ padding: '5px 10px', background: '#f0fdfa', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0d9488', fontWeight: '600', fontFamily: font.family }}>✏️</button>
                              <button onClick={() => setSilOnay(d.id)} style={{ padding: '5px 10px', background: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#ef4444', fontWeight: '600', fontFamily: font.family }}>🗑️</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Branş özeti */}
                  {(() => {
                    const topD = br.liste.reduce((a, d) => a + (d.dogru || 0), 0)
                    const topY = br.liste.reduce((a, d) => a + (d.yanlis || 0), 0)
                    const topNet = net(topD, topY)
                    const ort = br.liste.length > 0 ? parseFloat((br.liste.reduce((a, d) => a + net(d.dogru, d.yanlis), 0) / br.liste.length).toFixed(2)) : 0
                    return (
                      <div style={{ padding: '10px 16px', background: '#0d9488', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Özet</span>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#ccfbf1' }}>{br.liste.length} deneme</span>
                          <span style={{ fontSize: '12px', color: '#ccfbf1' }}>En iyi: <strong style={{ color: '#fff' }}>{Math.max(...br.liste.map(d => net(d.dogru, d.yanlis)))}</strong></span>
                          <span style={{ fontSize: '12px', color: '#ccfbf1' }}>Ortalama: <strong style={{ color: '#fff' }}>{ort}</strong></span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
