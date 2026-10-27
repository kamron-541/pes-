import { useState, useEffect } from 'react'
import { CalendarCheck, Clock, Plus, X, Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { STORAGE_KEYS, DEFAULT_BOOKINGS, ENABLE_SUPABASE, loadLocal, saveLocal, safeSupabaseSync } from '../lib/storage'

const ROOMS = ['VIP 1', 'VIP 2', 'VIP 3', 'Xona 1', 'Xona 2', 'Xona 3', 'Xona 4', 'Xona 5', 'Xona 6']

const statusColor = {
    'Kutilmoqda': 'bg-amber-900/40 text-amber-400 border-amber-700/40',
    'Tasdiqlangan': 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
    'Tasdiqlanmagan': 'bg-red-900/40 text-red-400 border-red-700/40',
}

export default function Booking({ clubId, currentClub }) {
    const [bookings, setBookings] = useState(() => loadLocal(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS, clubId))
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ room: ROOMS[0], client: '', date: '', time: '', hours: 1 })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setBookings(loadLocal(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS, clubId))
        if (ENABLE_SUPABASE) {
            fetchBackgroundBookings()
        }
    }, [clubId])

    const fetchBackgroundBookings = async () => {
        if (!ENABLE_SUPABASE) return
        try {
            if (!supabase) return
            let query = supabase
                .from('bookings')
                .select('*')
                .order('id', { ascending: false })

            if (clubId) {
                query = query.eq('club_id', clubId)
            }

            const { data } = await query
            if (data && data.length > 0) {
                setBookings(data)
                saveLocal(STORAGE_KEYS.BOOKINGS, data, clubId)
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
        saveLocal(STORAGE_KEYS.BOOKINGS, updated, clubId)
        safeSupabaseSync(() => supabase.from('bookings').insert([{ ...newBooking, club_id: clubId }]))

        setForm({ room: ROOMS[0], client: '', date: '', time: '', hours: 1 })
        setShowForm(false)
    }

    const handleDelete = async (id) => {
        const updated = bookings.filter(x => x.id !== id)
        setBookings(updated)
        saveLocal(STORAGE_KEYS.BOOKINGS, updated, clubId)
        safeSupabaseSync(() => supabase.from('bookings').delete().eq('id', id).eq('club_id', clubId))
    }

    const handleStatusChange = async (id, status) => {
        const updated = bookings.map(b => b.id === id ? { ...b, status } : b)
        setBookings(updated)
        saveLocal(STORAGE_KEYS.BOOKINGS, updated, clubId)
        safeSupabaseSync(() => supabase.from('bookings').update({ status }).eq('id', id).eq('club_id', clubId))
    }

    return (
        <div className="p-6 min-h-screen">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                            <Building2 size={12} />
                            {currentClub?.name || "Filial"}
                        </span>
                        <span className="text-slate-400 text-xs">Bronlar jadvali</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold">Bron qilish</h1>
                    <p className="text-slate-400 text-sm mt-1">Ushbu filial uchun oldindan band qilingan xonalar</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={16} /> Yangi bron
                </button>
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-white font-semibold text-lg">Yangi bron qo'shish</h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Xona</label>
                                <select
                                    value={form.room}
                                    onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                                    className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                                >
                                    {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Mijoz ismi</label>
                                <input
                                    value={form.client}
                                    onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                                    placeholder="Masalan: Jasur"
                                    className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1">Sana</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1">Vaqt</label>
                                    <input
                                        type="time"
                                        value={form.time}
                                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                        className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Necha soatga?</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={form.hours}
                                    onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))}
                                    className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-[#251f47] text-slate-300 text-sm font-semibold hover:text-white transition"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleAdd}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40"
                                >
                                    Saqlash
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bronlar jadvali */}
            <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-[#2d2556] text-slate-400 text-xs">
                            <th className="py-3.5 px-5">Xona</th>
                            <th className="py-3.5 px-5">Mijoz</th>
                            <th className="py-3.5 px-5">Sana & Vaqt</th>
                            <th className="py-3.5 px-5">Davomiyligi</th>
                            <th className="py-3.5 px-5">Holat</th>
                            <th className="py-3.5 px-5 text-right">Amal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d2556]/50">
                        {bookings.map(b => (
                            <tr key={b.id} className="hover:bg-[#201b3d]/50 transition">
                                <td className="py-3.5 px-5 text-white font-medium">{b.room}</td>
                                <td className="py-3.5 px-5 text-slate-300">{b.client}</td>
                                <td className="py-3.5 px-5 text-slate-400 font-mono text-xs">{b.date} | {b.time}</td>
                                <td className="py-3.5 px-5 text-slate-400">{b.hours} soat</td>
                                <td className="py-3.5 px-5">
                                    <select
                                        value={b.status}
                                        onChange={e => handleStatusChange(b.id, e.target.value)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor[b.status] || 'bg-slate-800 text-slate-300'} bg-transparent outline-none cursor-pointer`}
                                    >
                                        <option value="Kutilmoqda" className="bg-[#1a1630] text-amber-400">Kutilmoqda</option>
                                        <option value="Tasdiqlangan" className="bg-[#1a1630] text-emerald-400">Tasdiqlangan</option>
                                        <option value="Tasdiqlanmagan" className="bg-[#1a1630] text-red-400">Tasdiqlanmagan</option>
                                    </select>
                                </td>
                                <td className="py-3.5 px-5 text-right">
                                    <button
                                        onClick={() => handleDelete(b.id)}
                                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-950/40 transition cursor-pointer"
                                    >
                                        O'chirish
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {bookings.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                                    Ushbu filialda hozircha bronlar mavjud emas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
