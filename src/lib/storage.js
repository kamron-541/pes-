import { supabase } from './supabase'

export const STORAGE_KEYS = {
  CLUBS: 'ps_clubs',
  CURRENT_CLUB_ID: 'ps_current_club_id',
  AUTH_SESSION: 'ps_auth_session',
  FREE_ROOMS: 'ps_free_rooms',
  ACTIVE_ROOMS: 'ps_active_rooms',
  PAYMENTS: 'ps_payments',
  UTILITIES: 'ps_utilities',
  MENU_ITEMS: 'ps_menu_items',
  STAFF: 'ps_staff',
  EXPENSES: 'ps_expenses',
  CLIENTS: 'ps_clients',
  BOOKINGS: 'ps_bookings',
  SETTINGS: 'ps_settings',
}

// Standart filiallar (Multi-Branch boshlang'ich klublar)
export const DEFAULT_CLUBS = [
  {
    id: 'club_1',
    name: '1-Filial (Markaziy)',
    address: 'Chilonzor tumani, Bunyodkor shoh ko‘chasi',
    phone: '+998 90 123 45 67',
    pin: '1111',
    createdAt: new Date().toISOString()
  },
  {
    id: 'club_2',
    name: '2-Filial (Yunusobod)',
    address: 'Yunusobod tumani, Amir Temur ko‘chasi',
    phone: '+998 90 234 56 78',
    pin: '2222',
    createdAt: new Date().toISOString()
  },
  {
    id: 'club_3',
    name: '3-Filial (Sergeli)',
    address: 'Sergeli tumani, Yangi Sergeli ko‘chasi',
    phone: '+998 90 345 67 89',
    pin: '3333',
    createdAt: new Date().toISOString()
  }
]

// Super Admin (Boshqaruvchi) maxsus master PIN kodi
export const SUPER_ADMIN_PIN = '7777'

export function getSuperAdminPin() {
  return loadLocal('ps_admin_pin', SUPER_ADMIN_PIN)
}

export function setSuperAdminPin(newPin) {
  saveLocal('ps_admin_pin', newPin)
}

// Sotishga tayyor toza xonalar (9 ta standart xona)
export const DEFAULT_ROOMS = [
  { id: 1, name: 'VIP 1', type: 'VIP', price: 15000, capacity: 4 },
  { id: 2, name: 'VIP 2', type: 'VIP', price: 15000, capacity: 4 },
  { id: 3, name: 'VIP 3', type: 'VIP', price: 15000, capacity: 4 },
  { id: 4, name: 'Xona 1', type: 'Oddiy', price: 8000, capacity: 2 },
  { id: 5, name: 'Xona 2', type: 'Oddiy', price: 8000, capacity: 2 },
  { id: 6, name: 'Xona 3', type: 'Oddiy', price: 8000, capacity: 2 },
  { id: 7, name: 'Xona 4', type: 'Oddiy', price: 8000, capacity: 2 },
  { id: 8, name: 'Xona 5', type: 'Oddiy', price: 8000, capacity: 2 },
  { id: 9, name: 'Xona 6', type: 'Oddiy', price: 8000, capacity: 2 },
]

// Standart bar va oziq-ovqat menyusi
export const DEFAULT_MENU = [
  { id: 1, name: 'Cola 0.5', price: 6000 },
  { id: 2, name: 'Fanta 0.5', price: 6000 },
  { id: 3, name: 'Pepsi 0.5', price: 6000 },
  { id: 4, name: 'Choy (idish)', price: 4000 },
  { id: 5, name: 'Kofe', price: 5000 },
  { id: 6, name: 'Chips (Lays)', price: 12000 },
  { id: 7, name: 'Sementer', price: 3000 },
]

// Standart boshlang'ich admin xodimi
export const DEFAULT_STAFF = [
  { id: 1, name: 'Administrator', role: 'Admin', phone: '+998 90 123 45 67', email: 'admin@psclub.uz', status: 'Ishda' }
]

// Toza nol holat (Sotuvga tayyor)
export const DEFAULT_EXPENSES = []
export const DEFAULT_UTILITIES = []
export const DEFAULT_PAYMENTS = []
export const DEFAULT_CLIENTS = []
export const DEFAULT_BOOKINGS = []

export const DEFAULT_SETTINGS = {
  clubName: 'ProPlay PlayStation Club',
  address: 'Toshkent sh., Chilonzor tumani',
  openTime: '09:00',
  closeTime: '24:00',
  vipPrice: '15000',
  regularPrice: '8000',
  warnMinutes: '5',
  autoNotify: true,
}

// Barcha ma'lumotlar 100% ishonchli va xatosiz LocalStorage da saqlanadi
export const ENABLE_SUPABASE = false

// Filial bo'yicha LocalStorage kalitini olish
export function getClubStorageKey(baseKey, clubId) {
  if (!clubId) return baseKey
  const suffix = baseKey.startsWith('ps_') ? baseKey.substring(3) : baseKey
  return `ps_${clubId}_${suffix}`
}

// LocalStorage helpers (filial bo'yicha ajratilgan)
export function loadLocal(key, defaultValue, clubId = null) {
  try {
    const finalKey = clubId ? getClubStorageKey(key, clubId) : key
    const raw = localStorage.getItem(finalKey)
    if (!raw || raw === 'null' || raw === 'undefined') {
      let initVal = defaultValue

      // Agar yangi filial bo'lsa va sozlamalar so'ralsa, filial ma'lumotlarini qo'yamiz
      if (key === STORAGE_KEYS.SETTINGS && clubId) {
        const clubs = loadLocal(STORAGE_KEYS.CLUBS, DEFAULT_CLUBS)
        const cl = clubs.find(c => c.id === clubId)
        if (cl) {
          initVal = {
            ...DEFAULT_SETTINGS,
            clubName: cl.name,
            address: cl.address || DEFAULT_SETTINGS.address
          }
        }
      }

      if (initVal !== undefined) {
        localStorage.setItem(finalKey, JSON.stringify(initVal))
      }
      return initVal
    }

    return JSON.parse(raw)
  } catch (err) {
    console.warn(`localStorage o'qishda xatolik (${key}):`, err)
    return defaultValue
  }
}

export function saveLocal(key, value, clubId = null) {
  try {
    const finalKey = clubId ? getClubStorageKey(key, clubId) : key
    localStorage.setItem(finalKey, JSON.stringify(value))
  } catch (err) {
    console.warn(`localStorage ga yozishda xatolik (${key}):`, err)
  }
}

// Barcha filiallar ro'yxatini olish
export function getAllClubs() {
  return loadLocal(STORAGE_KEYS.CLUBS, DEFAULT_CLUBS)
}

// Barcha filiallarni saqlash
export function saveAllClubs(clubs) {
  saveLocal(STORAGE_KEYS.CLUBS, clubs)
}

// Yangi filial yaratish va uning standart xonalarini sozlash
export function createNewClub({ name, address, phone, pin }) {
  const clubs = getAllClubs()
  const newId = 'club_' + Date.now()
  const newClub = {
    id: newId,
    name: name.trim(),
    address: (address || '').trim(),
    phone: (phone || '').trim(),
    pin: pin || '1111',
    createdAt: new Date().toISOString()
  }

  // Yangi filial uchun barcha boshlang'ich ma'lumotlarni yaratamiz
  saveLocal(STORAGE_KEYS.FREE_ROOMS, DEFAULT_ROOMS, newId)
  saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, [], newId)
  saveLocal(STORAGE_KEYS.MENU_ITEMS, DEFAULT_MENU, newId)
  saveLocal(STORAGE_KEYS.STAFF, [
    { id: 1, name: `${newClub.name} Admin`, role: 'Admin', phone: newClub.phone || '+998 90 123 45 67', status: 'Ishda' }
  ], newId)
  saveLocal(STORAGE_KEYS.EXPENSES, [], newId)
  saveLocal(STORAGE_KEYS.PAYMENTS, [], newId)
  saveLocal(STORAGE_KEYS.CLIENTS, [], newId)
  saveLocal(STORAGE_KEYS.BOOKINGS, [], newId)
  saveLocal(STORAGE_KEYS.UTILITIES, [], newId)
  saveLocal(STORAGE_KEYS.SETTINGS, {
    ...DEFAULT_SETTINGS,
    clubName: newClub.name,
    address: newClub.address || DEFAULT_SETTINGS.address
  }, newId)

  const updatedClubs = [...clubs, newClub]
  saveAllClubs(updatedClubs)
  return newClub
}

// Filialni yangilash
export function updateClub(clubId, updatedFields) {
  const clubs = getAllClubs()
  const updated = clubs.map(c => c.id === clubId ? { ...c, ...updatedFields } : c)
  saveAllClubs(updated)
  return updated
}

// Filialni o'chirish
export function deleteClub(clubId) {
  const clubs = getAllClubs()
  const updated = clubs.filter(c => c.id !== clubId)
  saveAllClubs(updated)
  return updated
}

// Filial bo'yicha umumiy hisobotlarni olish (Super Admin paneli uchun)
export function getClubSummary(clubId) {
  try {
    const payments = loadLocal(STORAGE_KEYS.PAYMENTS, [], clubId)
    const activeRooms = loadLocal(STORAGE_KEYS.ACTIVE_ROOMS, [], clubId)
    const freeRooms = loadLocal(STORAGE_KEYS.FREE_ROOMS, DEFAULT_ROOMS, clubId)
    const clients = loadLocal(STORAGE_KEYS.CLIENTS, [], clubId)

    const todayStr = new Date().toISOString().split('T')[0]
    const todayPayments = payments.filter(p => {
      const pDate = p.paid_at ? p.paid_at.split('T')[0] : ''
      return pDate === todayStr
    })

    const todayIncome = todayPayments.reduce((sum, p) => sum + (Number(p.total) || 0), 0)
    const totalIncome = payments.reduce((sum, p) => sum + (Number(p.total) || 0), 0)

    return {
      todayIncome,
      totalIncome,
      activeCount: activeRooms.length,
      freeCount: freeRooms.length,
      totalRooms: activeRooms.length + freeRooms.length,
      clientsCount: clients.length,
      paymentsCount: payments.length,
      lastPaymentTime: payments[0]?.paid_at || null
    }
  } catch (e) {
    console.error('getClubSummary error:', e)
    return {
      todayIncome: 0,
      totalIncome: 0,
      activeCount: 0,
      freeCount: 9,
      totalRooms: 9,
      clientsCount: 0,
      paymentsCount: 0,
      lastPaymentTime: null
    }
  }
}

// Butun tizimni yoki ma'lum bir filialni tozalash
export function resetAllDataToCleanSlate(clubId = null) {
  saveLocal(STORAGE_KEYS.FREE_ROOMS, DEFAULT_ROOMS, clubId)
  saveLocal(STORAGE_KEYS.ACTIVE_ROOMS, [], clubId)
  saveLocal(STORAGE_KEYS.PAYMENTS, [], clubId)
  saveLocal(STORAGE_KEYS.UTILITIES, [], clubId)
  saveLocal(STORAGE_KEYS.MENU_ITEMS, DEFAULT_MENU, clubId)
  saveLocal(STORAGE_KEYS.STAFF, DEFAULT_STAFF, clubId)
  saveLocal(STORAGE_KEYS.EXPENSES, [], clubId)
  saveLocal(STORAGE_KEYS.CLIENTS, [], clubId)
  saveLocal(STORAGE_KEYS.BOOKINGS, [], clubId)
  saveLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS, clubId)
}

// Background Supabase sync helper (faqat ENABLE_SUPABASE yoqilganda ishlaydi)
export async function safeSupabaseSync(action) {
  if (!ENABLE_SUPABASE) return null
  try {
    if (!supabase) return null
    return await action()
  } catch (err) {
    console.debug('Supabase sync skipped:', err?.message || err)
    return null
  }
}
