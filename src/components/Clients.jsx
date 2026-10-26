import { useState, useEffect } from 'react'
import { User, Phone, Trophy, Search, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { STORAGE_KEYS, DEFAULT_CLIENTS, ENABLE_SUPABASE, loadLocal, saveLocal, safeSupabaseSync } from '../lib/storage'

export default function Clients() {
    const [clients, setClients] = useState(() => loadLocal(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS))
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', phone: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (ENABLE_SUPABASE) {
            fetchBackgroundClients()
        }
    }, [])

    const fetchBackgroundClients = async () => {
        if (!ENABLE_SUPABASE) return
        try {
            if (!supabase) return
            const { data } = await supabase
                .from('clients')
                .select('*')
                .order('id', { ascending: false })
            if (data && data.length > 0) {
                setClients(data)
                saveLocal(STORAGE_KEYS.CLIENTS, data)
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
        saveLocal(STORAGE_KEYS.CLIENTS, updated)
        safeSupabaseSync(() => supabase.from('clients').insert([newClient]))

        setForm({ name: '', phone: '' })
        setShowForm(false)
    }

    const handleDelete = async (id) => {
        const updated = clients.filter(x => x.id !== id)
        setClients(updated)
        saveLocal(STORAGE_KEYS.CLIENTS, updated)
        safeSupabaseSync(() => supabase.from('clients').delete().eq('id', id))
    }

    return (
        <div className="p-6 min-h-screen">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-white text-2xl font-bold">Mijozlar</h1>
                    <p className="text-slate-400 text-sm mt-1">Barcha ro'yxatdan o'tgan mijozlar (LocalStorage da saqlanadi)</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 cursor-pointer"
                >
                    <Plus size={16} /> Yangi mijoz
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Mijoz ismi yoki telefon..."
                    className="w-full bg-[#1a1630] border border-[#2d2556] text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-violet-500 transition"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10">
                    <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-slate-400 text-xs">Yuklanmoqda...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((c) => (
                        <div key={c.id} className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-5 flex items-center gap-4 hover:border-violet-500/40 transition">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                                {c.name ? c.name[0].toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-semibold truncate">{c.name}</p>
                                    {(c.sessions_count || 0) >= 30 && (
                                        <span className="flex items-center gap-1 text-xs bg-amber-900/40 text-amber-400 border border-amber-700/40 px-2 py-0.5 rounded-full">
                                            <Trophy size={10} /> VIP
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                                    <Phone size={11} /> {c.phone}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0 mr-4">
                                <p className="text-violet-300 font-semibold text-sm">{c.sessions_count || 0} sessiya</p>
                                <p className="text-slate-500 text-xs">{(c.total_spent || 0).toLocaleString('uz-UZ')} so'm</p>
                            </div>
                            <button
                                onClick={() => handleDelete(c.id)}
                                className="text-slate-600 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-10 text-center">
                            <p className="text-slate-500 text-sm">Mijoz topilmadi</p>
                        </div>
                    )}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1630] border border-[#2d2556] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-5">Yangi mijoz</h3>
                        <div className="mb-4">
                            <label className="block text-slate-400 text-xs mb-1">Ism familiya</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Ism kiriting..." className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition" />
                        </div>
                        <div className="mb-6">
                            <label className="block text-slate-400 text-xs mb-1">Telefon</label>
                            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="+998 90 000 0000" className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-[#2d2556] text-slate-300 text-sm hover:bg-[#3d3470] transition cursor-pointer">Bekor</button>
                            <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition cursor-pointer">Saqlash</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
