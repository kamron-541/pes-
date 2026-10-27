import { useState, useEffect } from 'react'
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Clock,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Receipt,
    Calendar,
    FileText,
    Building2,
    Zap,
    Flame,
    Droplets,
    Lightbulb,
    CheckCircle2,
    AlertCircle,
    Layers,
    Gamepad2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
    STORAGE_KEYS,
    DEFAULT_PAYMENTS,
    DEFAULT_CLIENTS,
    DEFAULT_UTILITIES,
    ENABLE_SUPABASE,
    loadLocal,
    saveLocal
} from '../lib/storage'

function formatMoney(num) {
    return (num || 0).toLocaleString('uz-UZ') + " so'm"
}

function formatDate(isoStr) {
    if (!isoStr) return '-'
    try {
        const d = new Date(isoStr)
        if (isNaN(d.getTime())) return isoStr
        return d.toLocaleDateString('uz-UZ') + ' ' + d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    } catch {
        return isoStr
    }
}

// Vaqt oralig'i bo'yicha solishtirish (Kunlik, Haftalik, Oylik)
function isDateInPeriod(dateStr, periodKey) {
    if (periodKey === 'all') return true
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return false

    const now = new Date()

    if (periodKey === 'today') {
        return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
        )
    }

    if (periodKey === 'week') {
        // Oxirgi 7 kun
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        sevenDaysAgo.setHours(0, 0, 0, 0)
        return d.getTime() >= sevenDaysAgo.getTime() && d.getTime() <= now.getTime()
    }

    if (periodKey === 'month') {
        return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth()
        )
    }

    return true
}

const utilIcons = {
    electricity: Zap,
    gas: Flame,
    light: Lightbulb,
    water: Droplets,
}

export default function Statistics({ clubId, currentClub, isSuperAdmin }) {
    const [payments, setPayments] = useState(() => loadLocal(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS, clubId))
    const [utilities, setUtilities] = useState(() => loadLocal(STORAGE_KEYS.UTILITIES, DEFAULT_UTILITIES, clubId))
    const [clientsCount, setClientsCount] = useState(() => {
        const c = loadLocal(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS, clubId)
        return c ? c.length : 0
    })
    const [loading, setLoading] = useState(false)

    // Filtrlar: Davr va Kategoriya
    const [period, setPeriod] = useState('today') // 'today' | 'week' | 'month' | 'all'
    const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'kassa' | 'utility'

    useEffect(() => {
        // Filial o'zgarganda ma'lumotlarni qayta yuklaymiz
        setPayments(loadLocal(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS, clubId))
        setUtilities(loadLocal(STORAGE_KEYS.UTILITIES, DEFAULT_UTILITIES, clubId))
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

            let utilQuery = supabase
                .from('utilities')
                .select('*')
                .order('id', { ascending: false })

            if (clubId) {
                utilQuery = utilQuery.eq('club_id', clubId)
            }

            const { data: utilData } = await utilQuery
            if (utilData && utilData.length > 0) {
                setUtilities(utilData)
                saveLocal(STORAGE_KEYS.UTILITIES, utilData, clubId)
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

    // ─── Hisob-kitoblar (Kassa & Kommunal) ───────────────────────────
    // Kunlik (Bugun)
    const todayPayments = payments.filter(p => isDateInPeriod(p.paid_at, 'today'))
    const todayRevenue = todayPayments.reduce((sum, p) => sum + (Number(p.total) || 0), 0)

    // Haftalik (Oxirgi 7 kun)
    const weekPayments = payments.filter(p => isDateInPeriod(p.paid_at, 'week'))
    const weekRevenue = weekPayments.reduce((sum, p) => sum + (Number(p.total) || 0), 0)

    // Oylik (Shu oy)
    const monthPayments = payments.filter(p => isDateInPeriod(p.paid_at, 'month'))
    const monthRevenue = monthPayments.reduce((sum, p) => sum + (Number(p.total) || 0), 0)

    // Umumiy kassa
    const totalAllRevenue = payments.reduce((sum, p) => sum + (Number(p.total) || 0), 0)

    // Kommunal to'lovlar
    const allUtilitiesPaid = utilities.filter(u => u.paid).reduce((sum, u) => sum + (Number(u.amount) || 0), 0)
    const allUtilitiesUnpaid = utilities.filter(u => !u.paid).reduce((sum, u) => sum + (Number(u.amount) || 0), 0)

    // Tanlangan davr bo'yicha hisob-kitob
    const currentPeriodRevenue =
        period === 'today' ? todayRevenue :
        period === 'week' ? weekRevenue :
        period === 'month' ? monthRevenue : totalAllRevenue

    const currentPeriodUtilities = utilities.filter(u => {
        const d = u.paid_at || u.created_at || (u.id ? new Date(u.id).toISOString() : null)
        return isDateInPeriod(d, period)
    })
    const currentPeriodUtilPaid = currentPeriodUtilities.filter(u => u.paid).reduce((sum, u) => sum + (Number(u.amount) || 0), 0)
    const currentPeriodNetProfit = currentPeriodRevenue - currentPeriodUtilPaid

    // Tanlangan davr bo'yicha xonalar daromadi
    const filteredPeriodPayments = payments.filter(p => isDateInPeriod(p.paid_at, period))
    const roomEarnings = {}
    filteredPeriodPayments.forEach(p => {
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

    // ─── Barcha to'lovlar ro'yxatini birlashtirish ───────────────────
    const unifiedTransactions = [
        ...payments.map(p => ({
            id: `pay_${p.id}`,
            rawId: p.id,
            type: 'kassa',
            categoryLabel: 'Kassa (Xona)',
            title: p.room_name || 'Xona',
            subtitle: p.client ? `Mijoz: ${p.client}` : "Noma'lum mijoz",
            roomCost: Number(p.room_cost) || 0,
            ordersCost: Number(p.orders_cost) || 0,
            amount: Number(p.total) || 0,
            isIncome: true,
            status: "To'langan",
            isPaid: true,
            date: p.paid_at || (p.id ? new Date(p.id).toISOString() : new Date().toISOString()),
            raw: p
        })),
        ...utilities.map(u => ({
            id: `util_${u.id}`,
            rawId: u.id,
            type: 'utility',
            utilCategory: u.type,
            categoryLabel: `Kommunal (${u.name || 'To\'lov'})`,
            title: u.name || "Kommunal to'lov",
            subtitle: `${u.month || 'Oy hisobi'}`,
            roomCost: 0,
            ordersCost: 0,
            amount: Number(u.amount) || 0,
            isIncome: false,
            status: u.paid ? "To'langan" : "Qarz (Kutilmoqda)",
            isPaid: Boolean(u.paid),
            date: u.paid_at || u.created_at || (u.id ? new Date(u.id).toISOString() : new Date().toISOString()),
            raw: u
        }))
    ]

    // Tanlangan davr bo'yicha filter
    const periodTransactions = unifiedTransactions.filter(item => isDateInPeriod(item.date, period))

    // Tanlangan toifa (Hammasi, Kassa, Kommunal) bo'yicha filter
    const displayedTransactions = periodTransactions.filter(item => {
        if (typeFilter === 'kassa') return item.type === 'kassa'
        if (typeFilter === 'utility') return item.type === 'utility'
        return true
    })

    // Eng yangisi tepada bo'lib tartiblanadi
    displayedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Davr nomlari
    const periodLabels = {
        today: 'Kunlik hisobot (Bugun)',
        week: 'Haftalik hisobot (Oxirgi 7 kun)',
        month: 'Oylik hisobot (Shu oy)',
        all: 'Barcha davr hisoboti'
    }

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                            <Building2 size={12} />
                            {currentClub?.name || "Filial"}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">To'lovlar va Moliya Tarixi</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold">Hisobot va To'lovlar Tarixi</h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        Kassa tushumlari, kommunal to'lovlar hamda kunlik, haftalik va oylik moliya hisoboti
                    </p>
                </div>

                {/* Period Selector Tabs (Kunlik, Haftalik, Oylik, Barchasi) */}
                <div className="flex flex-wrap items-center gap-1.5 bg-[#120e24] p-1.5 rounded-2xl border border-[#2d2556] self-start lg:self-auto shadow-lg">
                    {[
                        { id: 'today', label: 'Bugun (Kunlik)', icon: Clock },
                        { id: 'week', label: 'Haftalik', icon: TrendingUp },
                        { id: 'month', label: 'Oylik', icon: Calendar },
                        { id: 'all', label: 'Barchasi', icon: Receipt },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setPeriod(tab.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                period === tab.id
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40'
                                    : 'text-slate-400 hover:text-white hover:bg-[#1a1630]'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">
                    <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-slate-400 text-xs">Yuklanmoqda...</p>
                </div>
            ) : (
                <>
                    {/* Top KPI Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* 1. Kunlik tushum */}
                        <div
                            onClick={() => setPeriod('today')}
                            className={`rounded-2xl p-5 border cursor-pointer transition-all ${
                                period === 'today'
                                    ? 'bg-[#221a44] border-emerald-500/70 shadow-lg shadow-emerald-950/40 scale-[1.02]'
                                    : 'bg-[#1a1630] border-[#2d2556] hover:bg-[#201a3d]'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/30 text-white">
                                    <Clock size={19} />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Kunlik
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mb-1">Bugungi kassa</p>
                            <p className="text-white text-xl font-bold">{formatMoney(todayRevenue)}</p>
                            <p className="text-slate-500 text-[11px] mt-1">{todayPayments.length} ta o'yin to'lovi</p>
                        </div>

                        {/* 2. Haftalik tushum */}
                        <div
                            onClick={() => setPeriod('week')}
                            className={`rounded-2xl p-5 border cursor-pointer transition-all ${
                                period === 'week'
                                    ? 'bg-[#221a44] border-violet-500/70 shadow-lg shadow-violet-950/40 scale-[1.02]'
                                    : 'bg-[#1a1630] border-[#2d2556] hover:bg-[#201a3d]'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/30 text-white">
                                    <TrendingUp size={19} />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                    7 kun
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mb-1">Haftalik kassa</p>
                            <p className="text-white text-xl font-bold">{formatMoney(weekRevenue)}</p>
                            <p className="text-slate-500 text-[11px] mt-1">{weekPayments.length} ta o'yin to'lovi</p>
                        </div>

                        {/* 3. Oylik tushum */}
                        <div
                            onClick={() => setPeriod('month')}
                            className={`rounded-2xl p-5 border cursor-pointer transition-all ${
                                period === 'month'
                                    ? 'bg-[#221a44] border-blue-500/70 shadow-lg shadow-blue-950/40 scale-[1.02]'
                                    : 'bg-[#1a1630] border-[#2d2556] hover:bg-[#201a3d]'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-900/30 text-white">
                                    <Calendar size={19} />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    Shu oy
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mb-1">Oylik kassa</p>
                            <p className="text-white text-xl font-bold">{formatMoney(monthRevenue)}</p>
                            <p className="text-slate-500 text-[11px] mt-1">{monthPayments.length} ta o'yin to'lovi</p>
                        </div>

                        {/* 4. Kommunal to'lovlar */}
                        <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-900/30 text-white">
                                    <Zap size={19} />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Kommunal
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mb-1">To'langan kommunal</p>
                            <p className="text-amber-300 text-xl font-bold">{formatMoney(allUtilitiesPaid)}</p>
                            <p className="text-slate-500 text-[11px] mt-1">
                                {allUtilitiesUnpaid > 0 ? (
                                    <span className="text-rose-400 font-semibold">Qarz: {formatMoney(allUtilitiesUnpaid)}</span>
                                ) : (
                                    <span className="text-emerald-400">To'lanmagan qarz yo'q ✓</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Active Period Financial Balance Summary Banner */}
                    <div className="rounded-2xl bg-gradient-to-r from-[#171131] via-[#1a153b] to-[#171131] border border-violet-500/30 p-5 mb-8 shadow-xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs uppercase font-bold tracking-wider text-violet-400">
                                    📌 {periodLabels[period]}
                                </span>
                                <h3 className="text-white font-bold text-lg mt-0.5">
                                    Moliyaviy balans va sof daromad
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">
                                    Ushbu davrda kassa tushumlari va to'langan kommunal xarajatlar taqqoslanishi
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 bg-[#0d091e]/80 p-3 rounded-xl border border-[#2d2556]">
                                <div className="text-left px-2">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Kassa kirimi</span>
                                    <span className="text-emerald-400 font-bold text-sm sm:text-base">
                                        + {formatMoney(currentPeriodRevenue)}
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-[#2d2556]" />
                                <div className="text-left px-2">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Kommunal chiqimi</span>
                                    <span className="text-rose-400 font-bold text-sm sm:text-base">
                                        - {formatMoney(currentPeriodUtilPaid)}
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-[#2d2556]" />
                                <div className="text-left px-2">
                                    <span className="text-[10px] text-violet-300 uppercase font-bold block">Sof qoldiq</span>
                                    <span className="text-white font-extrabold text-sm sm:text-base">
                                        = {formatMoney(currentPeriodNetProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Popular Rooms & Summary Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Popular Rooms in Selected Period */}
                        <div className="lg:col-span-2 rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-bold text-base flex items-center gap-2">
                                    <BarChart3 size={18} className="text-violet-400" />
                                    Xonalar bo'yicha tushum ({periodLabels[period].split(' ')[0]})
                                </h3>
                                <span className="text-xs text-slate-400 font-mono">
                                    Jami: {formatMoney(currentPeriodRevenue)}
                                </span>
                            </div>
                            <div className="space-y-5">
                                {roomStats.map((room, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between mb-1.5">
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
                                    <p className="text-slate-500 text-xs text-center py-6">
                                        Ushbu davrda xonalardan tushum yo'q
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-violet-950/60 border border-violet-500/30 p-6 flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-violet-600/30 flex items-center justify-center mb-4 border border-violet-500/40">
                                    <Receipt size={24} className="text-violet-400" />
                                </div>
                                <h4 className="text-white font-bold text-lg mb-2">Mustaqil Filial Kassasi</h4>
                                <p className="text-slate-300 text-xs leading-relaxed mb-4">
                                    Ushbu filialning barcha kassa tushumlari va kommunal to'lovlari alohida yuritiladi va boshqa filiallar bilan aralashib ketmaydi.
                                </p>
                            </div>
                            <div className="space-y-2 bg-[#0f0c1e]/70 rounded-xl p-4 border border-[#2d2556]">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Davrdagi to'lovlar:</span>
                                    <span className="text-white font-bold">{periodTransactions.length} ta</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Kassa operatsiyalari:</span>
                                    <span className="text-emerald-400 font-bold">
                                        {periodTransactions.filter(t => t.type === 'kassa').length} ta
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Kommunal operatsiyalari:</span>
                                    <span className="text-amber-400 font-bold">
                                        {periodTransactions.filter(t => t.type === 'utility').length} ta
                                    </span>
                                </div>
                                <div className="h-px bg-[#2d2556] my-1" />
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Ro'yxatdagi mijozlar:</span>
                                    <span className="text-violet-300 font-bold">{clientsCount} ta</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Full Financial & Payments History Table (To'lovlar tarixi) */}
                    <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <FileText size={18} className="text-violet-400" />
                                    To'lovlar tarixi ({periodLabels[period].split(' ')[0]})
                                </h3>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    Kassa tushumlari va kommunal to'lovlarning to'liq ro'yxati
                                </p>
                            </div>

                            {/* Category Filter Tabs (Hammasi, Kassa, Kommunal) */}
                            <div className="flex items-center gap-1.5 bg-[#0f0c1e] p-1 rounded-xl border border-[#2d2556] self-start sm:self-auto">
                                <button
                                    onClick={() => setTypeFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                        typeFilter === 'all'
                                            ? 'bg-violet-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Barchasi ({periodTransactions.length})
                                </button>
                                <button
                                    onClick={() => setTypeFilter('kassa')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                        typeFilter === 'kassa'
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Gamepad2 size={13} />
                                    Kassa ({periodTransactions.filter(t => t.type === 'kassa').length})
                                </button>
                                <button
                                    onClick={() => setTypeFilter('utility')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                        typeFilter === 'utility'
                                            ? 'bg-amber-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Zap size={13} />
                                    Kommunal ({periodTransactions.filter(t => t.type === 'utility').length})
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#2d2556] text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="py-3 px-4">Sana va vaqt</th>
                                        <th className="py-3 px-4">Turi</th>
                                        <th className="py-3 px-4">Nomi / Xona / Xizmat</th>
                                        <th className="py-3 px-4">Mijoz / Tavsif</th>
                                        <th className="py-3 px-4">Tafsilot</th>
                                        <th className="py-3 px-4 text-right">Summa</th>
                                        <th className="py-3 px-4 text-center">Holati</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2d2556]/50">
                                    {displayedTransactions.map((item) => {
                                        const isKassa = item.type === 'kassa'
                                        return (
                                            <tr key={item.id} className="hover:bg-[#221c3d]/50 transition-colors">
                                                <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={13} className="text-slate-500" />
                                                        {formatDate(item.date)}
                                                    </div>
                                                </td>

                                                {/* Turi nishoni */}
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    {isKassa ? (
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-900/40 text-violet-300 border border-violet-700/50 flex items-center gap-1 w-fit">
                                                            <Gamepad2 size={12} />
                                                            Kassa
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/50 flex items-center gap-1 w-fit">
                                                            <Zap size={12} />
                                                            Kommunal
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Nomi / Xizmat */}
                                                <td className="py-3 px-4 text-white font-bold">
                                                    {item.title}
                                                </td>

                                                {/* Mijoz / Tavsif */}
                                                <td className="py-3 px-4 text-slate-300">
                                                    {item.subtitle}
                                                </td>

                                                {/* Tafsilot */}
                                                <td className="py-3 px-4 text-xs text-slate-400">
                                                    {isKassa ? (
                                                        <span>
                                                            Xona: {formatMoney(item.roomCost)}
                                                            {item.ordersCost > 0 && ` + Bar: ${formatMoney(item.ordersCost)}`}
                                                        </span>
                                                    ) : (
                                                        <span>{item.subtitle} to'lovi</span>
                                                    )}
                                                </td>

                                                {/* Summa (+ yashil tushum, - qizil kommunal) */}
                                                <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                                                    {isKassa ? (
                                                        <span className="text-emerald-400">
                                                            + {formatMoney(item.amount)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-400">
                                                            - {formatMoney(item.amount)}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Holati */}
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    {item.isPaid ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                                                            <CheckCircle2 size={12} />
                                                            To'langan
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                                                            <AlertCircle size={12} />
                                                            Qarz (Kutilmoqda)
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}

                                    {displayedTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                                                Ushbu davr ({periodLabels[period]}) bo'yicha to'lovlar topilmadi
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
