import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentPanel from './pages/StudentPanel'

function App() {
  const [user, setUser] = useState(undefined)
  const [role, setRole] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      console.log('getUser sonucu:', data)
      const u = data?.user || null
      setUser(u)
      if (u?.id) fetchRole(u.id)
      else setUser(null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'session:', session)
      const u = session?.user || null
      setUser(u)
      if (u?.id) fetchRole(u.id)
      else { setRole(null); setUser(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    console.log('fetchRole userId:', userId)
    const { data } = await supabase.from('students').select('role').eq('id', userId).single()
    console.log('role data:', data)
    setRole(data?.role || 'student')
  }

  if (user === undefined) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#94a3b8' }}>
      Yükleniyor...
    </div>
  )

  if (!user) return <Login />
  if (!role) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#94a3b8' }}>
      Yükleniyor...
    </div>
  )

  if (role === 'admin') return <Dashboard session={{ user }} />
  return <StudentPanel session={{ user }} />
}

export default App