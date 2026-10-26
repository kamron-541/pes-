import { useState, useEffect } from 'react'
import { CalendarCheck, Clock, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { STORAGE_KEYS, DEFAULT_BOOKINGS, ENABLE_SUPABASE, loadLocal, saveLocal, safeSupabaseSync } from '../lib/storage'

const ROOMS = ['VIP 1', 'VIP 2', 'VIP 3', 'Xona 1', 'Xona 2', 'Xona 3', 'Xona 4', 'Xona 5', 'Xona 6']

const statusColor = {
    'Kutilmoqda': 'bg-amber-900/40 text-amber-400 border-amber-700/40',
    'Tasdiqlangan': 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
    'Tasdiqlanmagan': 'bg-red-900/40 text-red-400 border-red-700/40',
}

export default function Booking() {
    const [bookings, setBookings] = useState(() => loadLocal(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS))
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ room: ROOMS[0], client: '', date: '', time: '', hours: 1 })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (ENABLE_SUPABASE) {
            fetchBackgroundBookings()
        }
    }, [])

    const fetchBackgroundBookings = async () => {
        if (!ENABLE_SUPABASE) return
        try {
            if (!supabase) return
            const { data } = await supabase
                .from('bookings')
                .select('*')
                .order('id', { ascending: false })
            if (data && data.length > 0) {
                setBookings(data)
                saveLocal(STORAGE_KEYS.BOOKINGS, data)
            }
        } catch (err) {
            console.debug('Bookings Supabase sync skipped:', err?.message || err)
        }
    }

    const handleAdd = async () => {
        if (!form.client || !form.date || !form.time) return
        const newBooking = {
            id: Date.now(),
            room: form.room,
            client: form.client,
            date: form.date,
            time: form.time,
            hours: form.hours,
            status: 'Kutilmoqda'
        }

        const updated = [newBooking, ...bookings]
        setBookings(updated)
        saveLocal(STORAGE_KEYS.BOOKINGS, updated)
        safeSupabaseSync(() => supabase.from('bookings').insert([newBooking]))

        setForm({ room: ROOMS[0], client: '', date: '', time: '', hours: 1 })
        setShowForm(false)
    }

    const handleDelete = async (id) => {
        const updated = bookings.filter(x => x.id !== id)
        setBookings(updated)
        saveLocal(STORAGE_KEYS.BOOKINGS, updated)
        safeSupabaseSync(() => supabase.from('bookings').delete().eq('id', id))
    }

    const handleUpdateStatus = async (id, newStatus) => {
        const updated = bookings.map(b => b.id === id ? { ...b, status: newStatus } : b)
        setBookings(updated)
        saveLocal(STORAGE_KEYS.BOOKINGS, updated)
        safeSupabaseSync(() => supabase.from('bookings').update({ status: newStatus }).eq('id', id))
    }

    return (
        <div className="p-6 min-h-screen">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-white text-2xl font-bold">Bron qilish</h1>
                    <p className="text-slate-400 text-sm mt-1">Xonalarni oldindan band qiling (LocalStorage da saqlanadi)</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 cursor-pointer"
                >
                    <Plus size={16} /> Yangi bron
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">
                    <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-slate-400 text-xs">Yuklanmoqda...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bookings.map(b => (
                        <div key={b.id} className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
                                    <CalendarCheck size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{b.room} · {b.client}</p>
                                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                                        <Clock size={11} /> {b.date} soat {b.time} · {b.hours} soat
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <select 
                                    value={b.status} 
                                    onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                                    className={`text-xs px-2 py-1 rounded-full font-semibold border bg-transparent cursor-pointer outline-none ${statusColor[b.status]}`}
                                >
                                    <option value="Kutilmoqda" className="bg-[#1a1630] text-amber-400">Kutilmoqda</option>
                                    <option value="Tasdiqlangan" className="bg-[#1a1630] text-emerald-400">Tasdiqlangan</option>
                                    <option value="Tasdiqlanmagan" className="bg-[#1a1630] text-red-400">Tasdiqlanmagan</option>
                                </select>
                                <button
                                    onClick={() => handleDelete(b.id)}
                                    className="text-slate-500 hover:text-red-400 transition cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {bookings.length === 0 && (
                        <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-8 text-center">
                            <p className="text-slate-500 text-sm">Hozircha buyurtmalar yo'q</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1630] border border-[#2d2556] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-5">Yangi bron</h3>
                        {[
                            { label: 'Xona', field: 'room', type: 'select' },
                            { label: 'Mijoz ismi', field: 'client', type: 'text', placeholder: 'Ism kiriting...' },
                            { label: 'Sana', field: 'date', type: 'date' },
                            { label: 'Vaqt', field: 'time', type: 'time' },
                        ].map(({ label, field, type, placeholder }) => (
                            <div key={field} className="mb-4">
                                <label className="block text-slate-400 text-xs mb-1">{label}</label>
                                {type === 'select' ? (
                                    <select
                                        value={form[field]}
                                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                        className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                                    >
                                        {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type={type}
                                        value={form[field]}
                                        placeholder={placeholder}
                                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                        className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                                    />
                                )}
                            </div>
                        ))}
                        <div className="mb-6">
                            <label className="block text-slate-400 text-xs mb-1">Muddat (soat)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(h => (
                                    <button key={h} onClick={() => setForm(f => ({ ...f, hours: h }))}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition cursor-pointer
                       ${form.hours === h ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'bg-[#2d2556] text-slate-300 hover:bg-[#3d3470]'}`}>
                                        {h} soat
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-[#2d2556] text-slate-300 text-sm hover:bg-[#3d3470] transition cursor-pointer">Bekor</button>
                            <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 cursor-pointer">Saqlash</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
