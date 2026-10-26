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
  ENABLE_SUPABASE,
  loadLocal,
  saveLocal,
  safeSupabaseSync
} from './lib/storage'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Booking from './components/Booking'
import Clients from './components/Clients'
import Settings from './components/Settings'
import Statistics from './components/Statistics'
import Employer from './components/Employer'
import Utilities from './components/Utilities'
import './index.css'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  // Xonalar holati (LocalStorage bilan boshlanadi)
  const [freeRooms, setFreeRooms] = useState(() => loadLocal(STORAGE_KEYS.FREE_ROOMS, DEFAULT_ROOMS))
  const [activeRooms, setActiveRooms] = useState(() => loadLocal(STORAGE_KEYS.ACTIVE_ROOMS, []))

  // Mahsulotlar (Menyu)
  const [menuItems, setMenuItems] = useState(() => loadLocal(STORAGE_KEYS.MENU_ITEMS, DEFAULT_MENU))

  // Xodimlar va Xarajatlar
  const [staff, setStaff] = useState(() => loadLocal(STORAGE_KEYS.STAFF, DEFAULT_STAFF))
  const [expenses, setExpenses] = useState(() => loadLocal(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES))

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Agar Supabase yoqilgan bo'lsa, orqa fonda sinxronlash
    if (ENABLE_SUPABASE) {
      loadBackgroundData()
    }
  }, [])

  const loadBackgroundData = async () => {
    if (!ENABLE_SUPABASE || !supabase) return
    try {

      const { data: roomsData } = await supabase.from('rooms').select('*').order('id')
      if (roomsData && roomsData.length > 0) {
        setFreeRooms(roomsData)
        saveLocal(STORAGE_KEYS.FREE_ROOMS, roomsData)
      }

      const { data: sessionsData } = await supabase.from('sessions').select('*').order('id')
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
        saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, formatted)
      }

      const { data: menuData } = await supabase.from('menu_items').select('*').order('id')
      if (menuData && menuData.length > 0) {
        setMenuItems(menuData)
        saveLocal(STORAGE_KEYS.MENU_ITEMS, menuData)
      }

      const { data: staffData } = await supabase.from('staff').select('*').order('id')
      if (staffData && staffData.length > 0) {
        setStaff(staffData)
        saveLocal(STORAGE_KEYS.STAFF, staffData)
      }

      const { data: expData } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
      if (expData && expData.length > 0) {
        setExpenses(expData)
        saveLocal(STORAGE_KEYS.EXPENSES, expData)
      }
    } catch (err) {
      console.debug('Supabase offline / fonda sinxronlash o\'tkazib yuborildi:', err?.message || err)
    }
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
      saveLocal(STORAGE_KEYS.FREE_ROOMS, updated)
      return updated
    })
    safeSupabaseSync(() => supabase.from('rooms').insert([newRoom]))
  }

  const removeFreeRoom = async (id) => {
    setFreeRooms(prev => {
      const updated = prev.filter(r => r.id !== id)
      saveLocal(STORAGE_KEYS.FREE_ROOMS, updated)
      return updated
    })
    safeSupabaseSync(() => supabase.from('rooms').delete().eq('id', id))
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
      saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, updated)
      return updated
    })

    setFreeRooms(prev => {
      const updated = prev.filter(r => r.id !== room.id)
      saveLocal(STORAGE_KEYS.FREE_ROOMS, updated)
      return updated
    })

    safeSupabaseSync(async () => {
      await supabase.from('sessions').insert([{
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
      await supabase.from('rooms').delete().eq('id', room.id)
    })
  }

  const stopSession = async (sessionId, roomData) => {
    setActiveRooms(prev => {
      const updated = prev.filter(r => r.id !== sessionId)
      saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, updated)
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
      saveLocal(STORAGE_KEYS.FREE_ROOMS, updated)
      return updated
    })

    safeSupabaseSync(async () => {
      await supabase.from('sessions').delete().eq('id', sessionId)
      await supabase.from('rooms').insert([restoredRoom])
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
      saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, updated)

      const active = updated.find(r => r.id === sessionId)
      if (active) {
        safeSupabaseSync(() => supabase.from('sessions').update({ orders: active.orders }).eq('id', sessionId))
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

    // 1. Hisobotlar ro'yxatiga (payments) yozish
    const currentPayments = loadLocal(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)
    const updatedPayments = [newPayment, ...currentPayments]
    saveLocal(STORAGE_KEYS.PAYMENTS, updatedPayments)

    // 2. Mijozlar hisobiga ham qo'shish
    try {
      const clients = loadLocal(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS)
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
      saveLocal(STORAGE_KEYS.CLIENTS, clients)
    } catch (e) {
      console.warn("Client yangilash:", e)
    }

    // 3. Supabase ga sinxronlash
    safeSupabaseSync(() => supabase.from('payments').insert([newPayment]))
  }

  // ─── Menyu CRUD ───────────────────────────────────────────────
  const addMenuItem = async (item) => {
    const newItem = { id: Date.now(), name: item.name, price: Number(item.price) }
    setMenuItems(prev => {
      const updated = [...prev, newItem]
      saveLocal(STORAGE_KEYS.MENU_ITEMS, updated)
      return updated
    })
    safeSupabaseSync(() => supabase.from('menu_items').insert([newItem]))
  }

  const removeMenuItem = async (id) => {
    setMenuItems(prev => {
      const updated = prev.filter(i => i.id !== id)
      saveLocal(STORAGE_KEYS.MENU_ITEMS, updated)
      return updated
    })
    safeSupabaseSync(() => supabase.from('menu_items').delete().eq('id', id))
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
      saveLocal(STORAGE_KEYS.STAFF, updated)
      return updated
    })
    safeSupabaseSync(() => supabase.from('staff').insert([newStaff]))
  }

  const removeStaff = async (id) => {
    setStaff(prev => {
      const updated = prev.filter(s => s.id !== id)
      saveLocal(STORAGE_KEYS.STAFF, updated)
      return updated
    })
    safeSupabaseSync(() => supabase.from('staff').delete().eq('id', id))
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
      saveLocal(STORAGE_KEYS.EXPENSES, updated)
      return updated
    })
    safeSupabaseSync(() => supabase.from('expenses').insert([newExp]))
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
            setActivePage={setActivePage}
            menuItems={menuItems}
          />
        )
      case 'booking': return <Booking />
      case 'statistics': return <Statistics />
      case 'clients': return <Clients />
      case 'utilities': return <Utilities />
      case 'employer': return (
        <Employer
          staff={staff}
          setStaff={setStaff}
          addStaff={addStaff}
          removeStaff={removeStaff}
          expenses={expenses}
          setExpenses={setExpenses}
          addExpense={addExpense}
        />
      )
      case 'settings': return (
        <Settings
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          addMenuItem={addMenuItem}
          removeMenuItem={removeMenuItem}
        />
      )
      default: return (
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
          setActivePage={setActivePage}
          menuItems={menuItems}
        />
      )
    }
  }

  return (
    <div className="flex h-screen bg-[#0f0c1e] overflow-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}
