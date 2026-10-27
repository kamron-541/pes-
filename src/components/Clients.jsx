import { useState, useEffect } from 'react'
import { User, Phone, Trophy, Search, Plus, X, Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { STORAGE_KEYS, DEFAULT_CLIENTS, ENABLE_SUPABASE, loadLocal, saveLocal, safeSupabaseSync } from '../lib/storage'

export default function Clients({ clubId, currentClub }) {
    const [clients, setClients] = useState(() => loadLocal(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS, clubId))
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', phone: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setClients(loadLocal(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS, clubId))
        if (ENABLE_SUPABASE) {
            fetchBackgroundClients()
        }
    }, [clubId])

    const fetchBackgroundClients = async () => {
        if (!ENABLE_SUPABASE) return
        try {
            if (!supabase) return
            let query = supabase
                .from('clients')
                .select('*')
                .order('id', { ascending: false })

            if (clubId) {
                query = query.eq('club_id', clubId)
            }

            const { data } = await query
            if (data && data.length > 0) {
                setClients(data)
                saveLocal(STORAGE_KEYS.CLIENTS, data, clubId)
            }
        } catch (err) {
            console.debug('Clients Supabase sync skipped:', err?.message || err)
        }
    }

    const filtered = clients.filter(c =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
    )

    const handleAdd = async () => {
        if (!form.name || !form.phone) return
        const newClient = {
            id: Date.now(),
            name: form.name,
            phone: form.phone,
            sessions_count: 0,
            total_spent: 0
        }

        const updated = [newClient, ...clients]
        setClients(updated)
        saveLocal(STORAGE_KEYS.CLIENTS, updated, clubId)
        safeSupabaseSync(() => supabase.from('clients').insert([{ ...newClient, club_id: clubId }]))

        setForm({ name: '', phone: '' })
        setShowForm(false)
    }

    const handleDelete = async (id) => {
        const updated = clients.filter(x => x.id !== id)
        setClients(updated)
        saveLocal(STORAGE_KEYS.CLIENTS, updated, clubId)
        safeSupabaseSync(() => supabase.from('clients').delete().eq('id', id).eq('club_id', clubId))
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
                        <span className="text-slate-400 text-xs">Mijozlar bazasi</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold">Mijozlar</h1>
                    <p className="text-slate-400 text-sm mt-1">Ushbu filialning doimiy mijozlari va ularning faolligi</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={16} /> Yangi mijoz
                </button>
            </div>

            {/* Qidiruv */}
            <div className="relative mb-6 max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
                    className="w-full bg-[#1a1630] border border-[#2d2556] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                />
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-white font-semibold text-lg">Yangi mijoz qo'shish</h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">F.I.SH (Ismi)</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Masalan: Sardor Karimov"
                                    className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Telefon raqam</label>
                                <input
                                    value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                    placeholder="+998 90 123 45 67"
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

            {/* Ro'yxat */}
            <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-[#2d2556] text-slate-400 text-xs">
                            <th className="py-3.5 px-5">Mijoz</th>
                            <th className="py-3.5 px-5">Telefon</th>
                            <th className="py-3.5 px-5 text-center">Tashriflar soni</th>
                            <th className="py-3.5 px-5 text-right">Jami sarflangan</th>
                            <th className="py-3.5 px-5 text-right">Amal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d2556]/50">
                        {filtered.map(c => (
                            <tr key={c.id} className="hover:bg-[#201b3d]/50 transition">
                                <td className="py-3.5 px-5 text-white font-medium flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center text-xs font-bold">
                                        {(c.name || 'M')[0].toUpperCase()}
                                    </div>
                                    <span>{c.name}</span>
                                </td>
                                <td className="py-3.5 px-5 text-slate-400 font-mono text-xs">{c.phone}</td>
                                <td className="py-3.5 px-5 text-center">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-900/40 text-violet-300 border border-violet-700/40">
                                        {c.sessions_count || 0} marta
                                    </span>
                                </td>
                                <td className="py-3.5 px-5 text-right font-bold text-emerald-400">
                                    {(c.total_spent || 0).toLocaleString('uz-UZ')} so'm
                                </td>
                                <td className="py-3.5 px-5 text-right">
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-950/40 transition cursor-pointer"
                                    >
                                        O'chirish
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                                    Ushbu filialda mijozlar topilmadi
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
