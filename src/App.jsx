import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentPanel from './pages/StudentPanel'
import StudentDetail from './pages/StudentDetail'

function App() {
  const [user, setUser] = useState(undefined)
  const [role, setRole] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user || null
      setUser(u)
      if (u?.id) fetchRole(u.id)
      else setUser(null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null
      setUser(u)
      if (u?.id) fetchRole(u.id)
      else { setRole(null); setUser(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    const { data } = await supabase.from('students').select('role').eq('id', userId).single()
    setRole(data?.role || 'student')
  }

  if (user === undefined) return <Yukleniyor />
  if (!user) return <Login />
  if (!role) return <Yukleniyor />

  if (role === 'admin') {
    if (selectedStudentId) {
      return <StudentDetail studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />
    }
    return <Dashboard session={{ user }} onStudentClick={(id) => setSelectedStudentId(id)} />
  }

  return <StudentPanel session={{ user }} />
}

function Yukleniyor() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#94a3b8' }}>
      Yükleniyor...
    </div>
  )
}

export default App