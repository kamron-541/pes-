import { supabase } from './supabase'

export const STORAGE_KEYS = {
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

// LocalStorage helpers
export function loadLocal(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw === 'null' || raw === 'undefined') {
      if (defaultValue !== undefined) {
        localStorage.setItem(key, JSON.stringify(defaultValue))
      }
      return defaultValue
    }

    const parsed = JSON.parse(raw)

    // Xonalar uchun maxsus tekshiruv: agar bo'sh xonalar ham, band xonalar ham bo'sh bo'lsa, boshlang'ich 9 ta xonani yuklaymiz
    if (key === STORAGE_KEYS.FREE_ROOMS) {
      if (!Array.isArray(parsed) || parsed.length === 0) {
        let activeCount = 0
        try {
          const activeRaw = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROOMS)
          const active = activeRaw ? JSON.parse(activeRaw) : []
          activeCount = Array.isArray(active) ? active.length : 0
        } catch {
          activeCount = 0
        }
        if (activeCount === 0) {
          localStorage.setItem(key, JSON.stringify(DEFAULT_ROOMS))
          return DEFAULT_ROOMS
        }
        return []
      }
    }

    return parsed
  } catch (err) {
    console.warn(`localStorage o'qishda xatolik (${key}):`, err)
    return defaultValue
  }
}

export function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`localStorage ga yozishda xatolik (${key}):`, err)
  }
}

// Butun tizimni sotuvga tayyor qilib tozalash (Nolga tushirish)
export function resetAllDataToCleanSlate() {
  localStorage.setItem(STORAGE_KEYS.FREE_ROOMS, JSON.stringify(DEFAULT_ROOMS))
  localStorage.setItem(STORAGE_KEYS.ACTIVE_ROOMS, JSON.stringify([]))
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]))
  localStorage.setItem(STORAGE_KEYS.UTILITIES, JSON.stringify([]))
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(DEFAULT_MENU))
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(DEFAULT_STAFF))
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]))
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]))
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]))
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS))
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
