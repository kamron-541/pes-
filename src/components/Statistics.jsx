import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, Clock, Users, ArrowUpRight, ArrowDownRight, Receipt, Calendar, FileText, Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { STORAGE_KEYS, DEFAULT_PAYMENTS, DEFAULT_CLIENTS, ENABLE_SUPABASE, loadLocal, saveLocal } from '../lib/storage'

function formatMoney(num) {
    return (num || 0).toLocaleString('uz-UZ') + " so'm"
}

function formatDate(isoStr) {
    if (!isoStr) return '-'
    try {
        const d = new Date(isoStr)
        return d.toLocaleDateString('uz-UZ') + ' ' + d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    } catch {
        return isoStr
    }
}

export default function Statistics({ clubId, currentClub, isSuperAdmin }) {
    const [payments, setPayments] = useState(() => loadLocal(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS, clubId))
    const [clientsCount, setClientsCount] = useState(() => {
        const c = loadLocal(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS, clubId)
        return c ? c.length : 0
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Filial o'zgarganda ma'lumotlarni qayta yuklaymiz
        setPayments(loadLocal(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS, clubId))
        const c = loadLocal(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS, clubId)
        setClientsCount(c ? c.length : 0)

        if (ENABLE_SUPABASE) {
            fetchBackgroundStats()
        }
    }, [clubId])

    const fetchBackgroundStats = async () => {
        if (!ENABLE_SUPABASE) return
        try {
            if (!supabase) return
            let query = supabase
                .from('payments')
                .select('*')
                .order('paid_at', { ascending: false })

            if (clubId) {
                query = query.eq('club_id', clubId)
            }

            const { data: paymentsData } = await query
            if (paymentsData && paymentsData.length > 0) {
                setPayments(paymentsData)
                saveLocal(STORAGE_KEYS.PAYMENTS, paymentsData, clubId)
            }

            let clientQuery = supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })

            if (clubId) {
                clientQuery = clientQuery.eq('club_id', clubId)
            }

            const { count } = await clientQuery
            if (count !== null && count !== undefined) {
                setClientsCount(count)
            }
        } catch (err) {
            console.debug('Statistics Supabase sync skipped:', err?.message || err)
        }
    }

    // Bugungi daromad hisoblash
    const today = new Date().toISOString().split('T')[0]
    const todayPayments = payments.filter(p => {
        if (!p.paid_at) return false
        return p.paid_at.startsWith(today)
    })
    const todayRevenue = todayPayments.reduce((sum, p) => sum + (Number(p.total) || 0), 0)

    // Oylik daromad hisoblash
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
    const monthlyPayments = payments.filter(p => {
        if (!p.paid_at) return false
        return p.paid_at.startsWith(currentMonth)
    })
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (Number(p.total) || 0), 0)

    // Jami umumiy daromad
    const totalAllRevenue = payments.reduce((sum, p) => sum + (Number(p.total) || 0), 0)

    // Xonalar bo'yicha daromad
    const roomEarnings = {}
    payments.forEach(p => {
        const rName = p.room_name || 'Noma\'lum'
        if (!roomEarnings[rName]) {
            roomEarnings[rName] = 0
        }
        roomEarnings[rName] += (Number(p.total) || 0)
    })

    const maxEarnings = Math.max(...Object.values(roomEarnings), 1)
    const roomStats = Object.entries(roomEarnings).map(([name, total]) => ({
        name,
        income: formatMoney(total),
        usage: Math.round((total / maxEarnings) * 100)
    })).sort((a, b) => b.usage - a.usage)

    const stats = [
        { label: 'Bugungi daromad', value: formatMoney(todayRevenue), trend: '+12%', isUp: true, icon: DollarSign, color: 'from-emerald-600 to-teal-600' },
        { label: 'Oylik daromad', value: formatMoney(monthlyRevenue), trend: '+8%', isUp: true, icon: TrendingUp, color: 'from-violet-600 to-indigo-600' },
        { label: "Jami kassa", value: formatMoney(totalAllRevenue), trend: '100%', isUp: true, icon: Receipt, color: 'from-blue-600 to-cyan-600' },
        { label: "Ro'yxatdagi mijozlar", value: clientsCount + ' ta', trend: 'Mijoz', isUp: true, icon: Users, color: 'from-rose-600 to-pink-600' },
    ]

    return (
        <div className="p-6 min-h-screen">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                            <Building2 size={12} />
                            {currentClub?.name || "Filial"}
                        </span>
                        <span className="text-slate-400 text-xs">Alohida kassa hisoboti</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold">Hisobot va Statistika</h1>
                    <p className="text-slate-400 text-sm mt-1">Ushbu filialning barcha to'lovlari va moliyaviy hisobotlari</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl font-medium self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Filial hisoboti faol
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">
                    <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-slate-400 text-xs">Yuklanmoqda...</p>
                </div>
            ) : (
                <>
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {stats.map((s, i) => (
                            <div key={i} className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                                        <s.icon size={20} className="text-white" />
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs font-bold ${s.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {s.trend}
                                        {s.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    </div>
                                </div>
                                <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                                <p className="text-white text-lg font-bold">{s.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Popular Rooms */}
                        <div className="lg:col-span-2 rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6">
                            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                <BarChart3 size={18} className="text-violet-400" />
                                Xonalar bo'yicha tushum
                            </h3>
                            <div className="space-y-6">
                                {roomStats.map((room, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-300 text-sm font-medium">{room.name}</span>
                                            <span className="text-slate-400 text-xs font-semibold">{room.income}</span>
                                        </div>
                                        <div className="w-full bg-[#0f0c1e] rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-1000 shadow-lg shadow-violet-900/20"
                                                style={{ width: `${room.usage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {roomStats.length === 0 && (
                                    <p className="text-slate-500 text-xs text-center py-6">Hozircha to'lovlar yo'q</p>
                                )}
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-violet-950/60 border border-violet-500/30 p-6 flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-violet-600/30 flex items-center justify-center mb-4 border border-violet-500/40">
                                    <TrendingUp size={24} className="text-violet-400" />
                                </div>
                                <h4 className="text-white font-bold text-lg mb-2">Mustaqil Filial Kassasi</h4>
                                <p className="text-slate-300 text-xs leading-relaxed mb-4">
                                    Ushbu filialning barcha to'lovlari va tushumlari faqat o'z hisobida saqlanadi va boshqa filiallarga aralashmaydi.
                                </p>
                            </div>
                            <div className="bg-[#0f0c1e]/70 rounded-xl p-4 border border-[#2d2556]">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Jami to'lovlar soni:</span>
                                    <span className="text-white font-bold">{payments.length} ta</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>O'rtacha chek:</span>
                                    <span className="text-emerald-400 font-bold">
                                        {formatMoney(payments.length > 0 ? Math.round(totalAllRevenue / payments.length) : 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Full Financial Report Table (Hisobot jadvali) */}
                    <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <FileText size={18} className="text-violet-400" />
                                To'lovlar tarixi (Kassa hisoboti)
                            </h3>
                            <span className="text-xs text-slate-400">Jami: {payments.length} ta yozuv</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#2d2556] text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="py-3 px-4">Sana va vaqt</th>
                                        <th className="py-3 px-4">Xona</th>
                                        <th className="py-3 px-4">Mijoz</th>
                                        <th className="py-3 px-4 text-right">Xona narxi</th>
                                        <th className="py-3 px-4 text-right">Buyurtmalar</th>
                                        <th className="py-3 px-4 text-right">Jami summa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2d2556]/50">
                                    {payments.map((p, idx) => (
                                        <tr key={p.id || idx} className="hover:bg-[#221c3d]/50 transition-colors">
                                            <td className="py-3 px-4 text-slate-300 font-medium flex items-center gap-2">
                                                <Calendar size={13} className="text-slate-500" />
                                                {formatDate(p.paid_at)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-900/30 text-violet-300 border border-violet-700/40">
                                                    {p.room_name}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-white font-semibold">
                                                {p.client || "Noma'lum"}
                                            </td>
                                            <td className="py-3 px-4 text-right text-slate-400">
                                                {formatMoney(p.room_cost)}
                                            </td>
                                            <td className="py-3 px-4 text-right text-slate-400">
                                                {formatMoney(p.orders_cost)}
                                            </td>
                                            <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                                                {formatMoney(p.total)}
                                            </td>
                                        </tr>
                                    ))}
                                    {payments.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                                                To'lovlar tarixi bo'sh
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
