import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import {
  STORAGE_KEYS,
  DEFAULT_ROOMS,
  DEFAULT_MENU,
  DEFAULT_STAFF,
  DEFAULT_EXPENSES,
  DEFAULT_PAYMENTS,
  DEFAULT_CLIENTS,
  DEFAULT_CLUBS,
  DEFAULT_SETTINGS,
  ENABLE_SUPABASE,
  loadLocal,
  saveLocal,
  safeSupabaseSync,
  getAllClubs
} from './lib/storage'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Booking from './components/Booking'
import Clients from './components/Clients'
import Settings from './components/Settings'
import Statistics from './components/Statistics'
import Employer from './components/Employer'
import Utilities from './components/Utilities'
import BranchLogin from './components/BranchLogin'
import SuperAdminDashboard from './components/SuperAdminDashboard'
import './index.css'

export default function App() {
  // Filiallar va sessiya
  const [clubs, setClubs] = useState(() => getAllClubs())
  const [authSession, setAuthSession] = useState(() => loadLocal(STORAGE_KEYS.AUTH_SESSION, null))
  
  const isSuperAdmin = authSession?.role === 'super_admin'

  const [currentClubId, setCurrentClubId] = useState(() => {
    const savedAuth = loadLocal(STORAGE_KEYS.AUTH_SESSION, null)
    if (savedAuth?.role === 'operator' && savedAuth.clubId) {
      return savedAuth.clubId
    }
    const saved = loadLocal(STORAGE_KEYS.CURRENT_CLUB_ID, null)
    const currentClubs = getAllClubs()
    if (saved && currentClubs.some(c => c.id === saved)) return saved
    return currentClubs[0]?.id || 'club_1'
  })

  const [activePage, setActivePage] = useState(() => {
    const savedPage = loadLocal('ps_active_page', null)
    if (savedPage) return savedPage
    const savedAuth = loadLocal(STORAGE_KEYS.AUTH_SESSION, null)
    return savedAuth?.role === 'super_admin' ? 'super_admin' : 'dashboard'
  })

  const handleSetActivePage = (page) => {
    setActivePage(page)
    saveLocal('ps_active_page', page)
  }

  // Tanlangan joriy filial
  const currentClub = clubs.find(c => c.id === currentClubId) || clubs[0]

  // Xonalar holati (tanlangan filial bo'yicha)
  const [freeRooms, setFreeRooms] = useState(() => loadLocal(STORAGE_KEYS.FREE_ROOMS, DEFAULT_ROOMS, currentClubId))
  const [activeRooms, setActiveRooms] = useState(() => loadLocal(STORAGE_KEYS.ACTIVE_ROOMS, [], currentClubId))

  // Mahsulotlar (Menyu)
  const [menuItems, setMenuItems] = useState(() => loadLocal(STORAGE_KEYS.MENU_ITEMS, DEFAULT_MENU, currentClubId))

  // Xodimlar va Xarajatlar
  const [staff, setStaff] = useState(() => loadLocal(STORAGE_KEYS.STAFF, DEFAULT_STAFF, currentClubId))
  const [expenses, setExpenses] = useState(() => loadLocal(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES, currentClubId))

  // Sozlamalar (tanlangan filial bo'yicha)
  const [settings, setSettings] = useState(() => {
    const loaded = loadLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS, currentClubId)
    return {
      ...DEFAULT_SETTINGS,
      ...loaded,
      clubName: currentClub?.name || loaded?.clubName || DEFAULT_SETTINGS.clubName,
      address: currentClub?.address || loaded?.address || DEFAULT_SETTINGS.address
    }
  })

  const [loading, setLoading] = useState(false)

  // Filial o'zgarganda ma'lumotlarni qayta yuklaymiz
  useEffect(() => {
    if (!currentClubId) return

    setFreeRooms(loadLocal(STORAGE_KEYS.FREE_ROOMS, DEFAULT_ROOMS, currentClubId))
    setActiveRooms(loadLocal(STORAGE_KEYS.ACTIVE_ROOMS, [], currentClubId))
    setMenuItems(loadLocal(STORAGE_KEYS.MENU_ITEMS, DEFAULT_MENU, currentClubId))
    setStaff(loadLocal(STORAGE_KEYS.STAFF, DEFAULT_STAFF, currentClubId))
    setExpenses(loadLocal(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES, currentClubId))

    const loadedSettings = loadLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS, currentClubId)
    setSettings({
      ...DEFAULT_SETTINGS,
      ...loadedSettings,
      clubName: currentClub?.name || loadedSettings?.clubName || DEFAULT_SETTINGS.clubName,
      address: currentClub?.address || loadedSettings?.address || DEFAULT_SETTINGS.address
    })

    if (ENABLE_SUPABASE) {
      loadBackgroundData(currentClubId)
    }
  }, [currentClubId])

  const loadBackgroundData = async (clubId) => {
    if (!ENABLE_SUPABASE || !supabase || !clubId) return
    try {
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('club_id', clubId)
        .order('id')

      if (roomsData && roomsData.length > 0) {
        setFreeRooms(roomsData)
        saveLocal(STORAGE_KEYS.FREE_ROOMS, roomsData, clubId)
      }

      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('club_id', clubId)
        .order('id')

      if (sessionsData) {
        const formatted = sessionsData.map(s => ({
          id: s.id,
          name: s.room_name,
          type: s.room_type,
          price: s.room_price,
          client: s.client,
          startTime: s.start_time,
          endTime: s.end_time,
          totalSeconds: s.total_seconds,
          isOpen: s.is_open,
          orders: s.orders || [],
          roomId: s.room_id
        }))
        setActiveRooms(formatted)
        saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, formatted, clubId)
      }

      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('club_id', clubId)
        .order('id')

      if (menuData && menuData.length > 0) {
        setMenuItems(menuData)
        saveLocal(STORAGE_KEYS.MENU_ITEMS, menuData, clubId)
      }

      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('club_id', clubId)
        .order('id')

      if (staffData && staffData.length > 0) {
        setStaff(staffData)
        saveLocal(STORAGE_KEYS.STAFF, staffData, clubId)
      }

      const { data: expData } = await supabase
        .from('expenses')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })

      if (expData && expData.length > 0) {
        setExpenses(expData)
        saveLocal(STORAGE_KEYS.EXPENSES, expData, clubId)
      }
    } catch (err) {
      console.debug('Supabase offline / fonda sinxronlash o\'tkazib yuborildi:', err?.message || err)
    }
  }

  // ─── Login & Switch handlers ───────────────────────────────────
  const handleLoginSuccess = (session) => {
    setAuthSession(session)
    saveLocal(STORAGE_KEYS.AUTH_SESSION, session)

    if (session.role === 'super_admin') {
      setActivePage('super_admin')
      saveLocal('ps_active_page', 'super_admin')
    } else {
      setCurrentClubId(session.clubId)
      saveLocal(STORAGE_KEYS.CURRENT_CLUB_ID, session.clubId)
      setActivePage('dashboard')
      saveLocal('ps_active_page', 'dashboard')
    }
  }

  const handleLogout = () => {
    setAuthSession(null)
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION)
    localStorage.removeItem('ps_active_page')
  }

  const handleSwitchClub = (clubId) => {
    setCurrentClubId(clubId)
    saveLocal(STORAGE_KEYS.CURRENT_CLUB_ID, clubId)
    setActivePage('dashboard')
    saveLocal('ps_active_page', 'dashboard')
  }

  const handleClubUpdated = () => {
    const updatedClubs = getAllClubs()
    setClubs(updatedClubs)
    const freshClub = updatedClubs.find(c => c.id === currentClubId) || updatedClubs[0]
    const loadedSettings = loadLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS, currentClubId)
    setSettings({
      ...DEFAULT_SETTINGS,
      ...loadedSettings,
      clubName: freshClub?.name || loadedSettings?.clubName || DEFAULT_SETTINGS.clubName,
      address: freshClub?.address || loadedSettings?.address || DEFAULT_SETTINGS.address
    })
  }

  // ─── Xonalar uchun CRUD (LocalStorage + Supabase) ─────────────
  const addFreeRoom = async (room) => {
    const newRoom = {
      id: Date.now(),
      name: room.name,
      type: room.type,
      price: Number(room.price),
      capacity: Number(room.capacity)
    }
    setFreeRooms(prev => {
      const updated = [...prev, newRoom]
      saveLocal(STORAGE_KEYS.FREE_ROOMS, updated, currentClubId)
      return updated
    })
    safeSupabaseSync(() => supabase.from('rooms').insert([{ ...newRoom, club_id: currentClubId }]))
  }

  const removeFreeRoom = async (id) => {
    setFreeRooms(prev => {
      const updated = prev.filter(r => String(r.id) !== String(id))
      saveLocal(STORAGE_KEYS.FREE_ROOMS, updated, currentClubId)
      return updated
    })
    safeSupabaseSync(() => supabase.from('rooms').delete().eq('id', id).eq('club_id', currentClubId))
  }

  // ─── Seans boshlash / tugatish (LocalStorage + Supabase) ──────
  const startSession = async (room, client, hours) => {
    const isOchiq = hours === null
    const secs = isOchiq ? 0 : hours * 3600
    const now = Date.now()

    const newSession = {
      id: Date.now(),
      name: room.name,
      type: room.type,
      price: room.price,
      client: client || "Noma'lum",
      startTime: now,
      endTime: isOchiq ? null : now + (secs * 1000),
      totalSeconds: isOchiq ? 0 : secs,
      isOpen: isOchiq,
      orders: [],
      roomId: room.id
    }

    setActiveRooms(prev => {
      const updated = [...prev, newSession]
      saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, updated, currentClubId)
      return updated
    })

    setFreeRooms(prev => {
      const updated = prev.filter(r => r.id !== room.id)
      saveLocal(STORAGE_KEYS.FREE_ROOMS, updated, currentClubId)
      return updated
    })

    safeSupabaseSync(async () => {
      await supabase.from('sessions').insert([{
        club_id: currentClubId,
        room_id: room.id,
        room_name: room.name,
        room_type: room.type,
        room_price: room.price,
        client: client || "Noma'lum",
        start_time: now,
        end_time: isOchiq ? null : now + (secs * 1000),
        total_seconds: isOchiq ? 0 : secs,
        is_open: isOchiq,
        orders: []
      }])
      await supabase.from('rooms').delete().eq('id', room.id).eq('club_id', currentClubId)
    })
  }

  const stopSession = async (sessionId, roomData) => {
    setActiveRooms(prev => {
      const updated = prev.filter(r => r.id !== sessionId)
      saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, updated, currentClubId)
      return updated
    })

    const restoredRoom = {
      id: roomData.roomId || Date.now(),
      name: roomData.name,
      type: roomData.type,
      price: roomData.price,
      capacity: roomData.type === 'VIP' ? 4 : 2
    }

    setFreeRooms(prev => {
      const updated = [...prev, restoredRoom].sort((a, b) => a.id - b.id)
      saveLocal(STORAGE_KEYS.FREE_ROOMS, updated, currentClubId)
      return updated
    })

    safeSupabaseSync(async () => {
      await supabase.from('sessions').delete().eq('id', sessionId).eq('club_id', currentClubId)
      await supabase.from('rooms').insert([{ ...restoredRoom, club_id: currentClubId }])
    })
  }

  const addOrderToSession = async (sessionId, item) => {
    setActiveRooms(prev => {
      const updated = prev.map(r => {
        if (r.id !== sessionId) return r
        const existingIdx = (r.orders || []).findIndex(o => o.id === item.id)
        let newOrders = [...(r.orders || [])]
        if (existingIdx > -1) {
          newOrders[existingIdx] = {
            ...newOrders[existingIdx],
            quantity: newOrders[existingIdx].quantity + item.quantity
          }
        } else {
          newOrders.push(item)
        }
        return { ...r, orders: newOrders }
      })
      saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, updated, currentClubId)

      const active = updated.find(r => r.id === sessionId)
      if (active) {
        safeSupabaseSync(() => supabase.from('sessions').update({ orders: active.orders }).eq('id', sessionId).eq('club_id', currentClubId))
      }
      return updated
    })
  }

  // ─── To'lov saqlash (Hisobot) ──────────────────────────────────
  const savePayment = async (paymentData) => {
    const newPayment = {
      id: Date.now(),
      room_name: paymentData.room_name,
      client: paymentData.client || "Noma'lum",
      room_cost: Number(paymentData.room_cost) || 0,
      orders_cost: Number(paymentData.orders_cost) || 0,
      total: Number(paymentData.total) || 0,
      paid_at: new Date().toISOString()
    }

    // 1. Ushbu filialning hisobotlar ro'yxatiga (payments) yozish
    const currentPayments = loadLocal(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS, currentClubId)
    const updatedPayments = [newPayment, ...currentPayments]
    saveLocal(STORAGE_KEYS.PAYMENTS, updatedPayments, currentClubId)

    // 2. Ushbu filialning mijozlar hisobiga ham qo'shish
    try {
      const clients = loadLocal(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS, currentClubId)
      const cIndex = clients.findIndex(c => (c.name || '').toLowerCase() === (paymentData.client || '').toLowerCase())
      if (cIndex > -1) {
        clients[cIndex].sessions_count = (clients[cIndex].sessions_count || 0) + 1
        clients[cIndex].total_spent = (clients[cIndex].total_spent || 0) + newPayment.total
      } else if (paymentData.client && paymentData.client !== "Noma'lum") {
        clients.unshift({
          id: Date.now(),
          name: paymentData.client,
          phone: "+998 -- --- -- --",
          sessions_count: 1,
          total_spent: newPayment.total
        })
      }
      saveLocal(STORAGE_KEYS.CLIENTS, clients, currentClubId)
    } catch (e) {
      console.warn("Client yangilash:", e)
    }

    // 3. Supabase ga sinxronlash
    safeSupabaseSync(() => supabase.from('payments').insert([{ ...newPayment, club_id: currentClubId }]))
  }

  // ─── Menyu CRUD ───────────────────────────────────────────────
  const addMenuItem = async (item) => {
    const newItem = { id: Date.now(), name: item.name, price: Number(item.price) }
    setMenuItems(prev => {
      const updated = [...prev, newItem]
      saveLocal(STORAGE_KEYS.MENU_ITEMS, updated, currentClubId)
      return updated
    })
    safeSupabaseSync(() => supabase.from('menu_items').insert([{ ...newItem, club_id: currentClubId }]))
  }

  const removeMenuItem = async (id) => {
    setMenuItems(prev => {
      const updated = prev.filter(i => i.id !== id)
      saveLocal(STORAGE_KEYS.MENU_ITEMS, updated, currentClubId)
      return updated
    })
    safeSupabaseSync(() => supabase.from('menu_items').delete().eq('id', id).eq('club_id', currentClubId))
  }

  // ─── Xodimlar CRUD ───────────────────────────────────────────
  const addStaff = async (s) => {
    const newStaff = {
      id: Date.now(),
      name: s.name,
      role: s.role,
      phone: s.phone,
      email: s.name.toLowerCase().replace(/\s+/g, '.') + '@psclub.uz',
      status: 'Ishda'
    }
    setStaff(prev => {
      const updated = [...prev, newStaff]
      saveLocal(STORAGE_KEYS.STAFF, updated, currentClubId)
      return updated
    })
    safeSupabaseSync(() => supabase.from('staff').insert([{ ...newStaff, club_id: currentClubId }]))
  }

  const removeStaff = async (id) => {
    setStaff(prev => {
      const updated = prev.filter(s => s.id !== id)
      saveLocal(STORAGE_KEYS.STAFF, updated, currentClubId)
      return updated
    })
    safeSupabaseSync(() => supabase.from('staff').delete().eq('id', id).eq('club_id', currentClubId))
  }

  // ─── Xarajatlar CRUD ─────────────────────────────────────────
  const addExpense = async (exp) => {
    const newExp = {
      id: Date.now(),
      staff_id: exp.staffId,
      staff_name: exp.staffName,
      amount: Number(exp.amount),
      reason: exp.reason,
      date: exp.date || new Date().toLocaleString('uz-UZ')
    }
    setExpenses(prev => {
      const updated = [newExp, ...prev]
      saveLocal(STORAGE_KEYS.EXPENSES, updated, currentClubId)
      return updated
    })
    safeSupabaseSync(() => supabase.from('expenses').insert([{ ...newExp, club_id: currentClubId }]))
  }

  // Agar tizimga hali kirilmagan bo'lsa -> Filial / PIN login oynasi
  if (!authSession) {
    return <BranchLogin onLoginSuccess={handleLoginSuccess} />
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0f0c1e] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-violet-400 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    // Super Admin boshqaruv paneli
    if (activePage === 'super_admin' && isSuperAdmin) {
      return <SuperAdminDashboard onSelectClub={handleSwitchClub} onClubUpdated={handleClubUpdated} />
    }

    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            freeRooms={freeRooms}
            setFreeRooms={setFreeRooms}
            addFreeRoom={addFreeRoom}
            removeFreeRoom={removeFreeRoom}
            activeRooms={activeRooms}
            setActiveRooms={setActiveRooms}
            startSession={startSession}
            stopSession={stopSession}
            addOrderToSession={addOrderToSession}
            savePayment={savePayment}
            setActivePage={handleSetActivePage}
            menuItems={menuItems}
            currentClub={currentClub}
            settings={settings}
          />
        )
      case 'booking':
        return <Booking clubId={currentClubId} currentClub={currentClub} />
      case 'statistics':
        return <Statistics clubId={currentClubId} currentClub={currentClub} isSuperAdmin={isSuperAdmin} />
      case 'clients':
        return <Clients clubId={currentClubId} currentClub={currentClub} />
      case 'utilities':
        return <Utilities clubId={currentClubId} currentClub={currentClub} />
      case 'employer':
        return (
          <Employer
            staff={staff}
            setStaff={setStaff}
            addStaff={addStaff}
            removeStaff={removeStaff}
            expenses={expenses}
            setExpenses={setExpenses}
            addExpense={addExpense}
            currentClub={currentClub}
          />
        )
      case 'settings':
        return (
          <Settings
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            addMenuItem={addMenuItem}
            removeMenuItem={removeMenuItem}
            clubId={currentClubId}
            currentClub={currentClub}
            onClubUpdated={handleClubUpdated}
            onRoomsUpdated={setFreeRooms}
            onSettingsUpdated={setSettings}
          />
        )
      default:
        return (
          <Dashboard
            freeRooms={freeRooms}
            setFreeRooms={setFreeRooms}
            addFreeRoom={addFreeRoom}
            removeFreeRoom={removeFreeRoom}
            activeRooms={activeRooms}
            setActiveRooms={setActiveRooms}
            startSession={startSession}
            stopSession={stopSession}
            addOrderToSession={addOrderToSession}
            savePayment={savePayment}
            setActivePage={handleSetActivePage}
            menuItems={menuItems}
            currentClub={currentClub}
            settings={settings}
          />
        )
    }
  }

  return (
    <div className="flex h-screen bg-[#0f0c1e] overflow-hidden">
      <Sidebar
        activePage={activePage}
        setActivePage={handleSetActivePage}
        currentClub={currentClub}
        clubs={clubs}
        onSwitchClub={handleSwitchClub}
        isSuperAdmin={isSuperAdmin}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto" key={currentClubId}>
        {renderPage()}
      </main>
    </div>
  )
}
