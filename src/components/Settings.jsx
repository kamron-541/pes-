import { useState, useEffect } from 'react'
import { Save, Store, Clock, DollarSign, Bell, Trash2, PlusCircle, RotateCcw, AlertTriangle, Building2, KeyRound } from 'lucide-react'
import { STORAGE_KEYS, DEFAULT_SETTINGS, loadLocal, saveLocal, resetAllDataToCleanSlate, updateClub } from '../lib/storage'

export default function Settings({
    menuItems,
    addMenuItem,
    removeMenuItem,
    clubId,
    currentClub,
    onClubUpdated,
    onRoomsUpdated,
    onSettingsUpdated
}) {
    const [newProduct, setNewProduct] = useState({ name: '', price: '' })
    const [settings, setSettings] = useState(() => {
        const loaded = loadLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS, clubId)
        return {
            ...DEFAULT_SETTINGS,
            ...loaded,
            clubName: currentClub?.name || loaded?.clubName || DEFAULT_SETTINGS.clubName,
            address: currentClub?.address || loaded?.address || DEFAULT_SETTINGS.address
        }
    })
    const [saved, setSaved] = useState(false)
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    useEffect(() => {
        const loaded = loadLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS, clubId)
        setSettings({
            ...DEFAULT_SETTINGS,
            ...loaded,
            clubName: currentClub?.name || loaded?.clubName || DEFAULT_SETTINGS.clubName,
            address: currentClub?.address || loaded?.address || DEFAULT_SETTINGS.address
        })
    }, [clubId, currentClub])

    const handleSave = () => {
        saveLocal(STORAGE_KEYS.SETTINGS, settings, clubId)

        // Filial nomi va manzilini markaziy klublar ro'yxatida yangilash
        if (clubId && currentClub) {
            updateClub(clubId, {
                name: settings.clubName,
                address: settings.address
            })
            if (onClubUpdated) onClubUpdated()
        }

        // Yangi narx sozlamalarini mavjud xonalarga ham darhol tatbiq etish
        const vipP = Number(settings.vipPrice) || 15000
        const regP = Number(settings.regularPrice) || 8000
        const currentFree = loadLocal(STORAGE_KEYS.FREE_ROOMS, [], clubId)
        if (Array.isArray(currentFree) && currentFree.length > 0) {
            const updatedRooms = currentFree.map(r => ({
                ...r,
                price: (r.type === 'VIP' || String(r.name).toUpperCase().includes('VIP')) ? vipP : regP
            }))
            saveLocal(STORAGE_KEYS.FREE_ROOMS, updatedRooms, clubId)
            if (onRoomsUpdated) onRoomsUpdated(updatedRooms)
        }

        if (onSettingsUpdated) onSettingsUpdated(settings)

        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleResetAll = () => {
        resetAllDataToCleanSlate(clubId)
        window.location.reload()
    }

    const inputCls = "w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"

    return (
        <div className="p-6 min-h-screen max-w-2xl">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                        <Building2 size={12} />
                        {currentClub?.name || "Filial"}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">PIN: {currentClub?.pin || '1111'}</span>
                </div>
                <h1 className="text-white text-2xl font-bold">Sozlamalar</h1>
                <p className="text-slate-400 text-sm mt-1">Ushbu filialning konfiguratsiyasi va narxlari</p>
            </div>

            <div className="space-y-4">
                {/* Club info */}
                <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Store size={16} className="text-violet-400" />
                        <h2 className="text-white font-semibold">Filial ma'lumotlari</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Filial nomi</label>
                            <input value={settings.clubName} onChange={e => setSettings(s => ({ ...s, clubName: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Manzil</label>
                            <input value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Working hours */}
                <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Clock size={16} className="text-violet-400" />
                        <h2 className="text-white font-semibold">Ish vaqti</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Ochilish</label>
                            <input type="time" value={settings.openTime} onChange={e => setSettings(s => ({ ...s, openTime: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Yopilish</label>
                            <input type="time" value={settings.closeTime} onChange={e => setSettings(s => ({ ...s, closeTime: e.target.value }))} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Prices */}
                <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <DollarSign size={16} className="text-violet-400" />
                        <h2 className="text-white font-semibold">Narxlar (soatiga, so'm)</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">VIP xona</label>
                            <input type="number" value={settings.vipPrice} onChange={e => setSettings(s => ({ ...s, vipPrice: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Oddiy zal</label>
                            <input type="number" value={settings.regularPrice} onChange={e => setSettings(s => ({ ...s, regularPrice: e.target.value }))} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Bell size={16} className="text-violet-400" />
                        <h2 className="text-white font-semibold">Ogohlantirishlar</h2>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-white text-sm font-medium">Avtomatik ogohlantirish</p>
                            <p className="text-slate-500 text-xs">Vaqt tugashidan oldin xabar berish</p>
                        </div>
                        <button
                            onClick={() => setSettings(s => ({ ...s, autoNotify: !s.autoNotify }))}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer
                ${settings.autoNotify ? 'bg-violet-600' : 'bg-[#2d2556]'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300
                ${settings.autoNotify ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs mb-1">Ogohlantirish (daqiqa oldin)</label>
                        <input type="number" value={settings.warnMinutes} onChange={e => setSettings(s => ({ ...s, warnMinutes: e.target.value }))} className={inputCls} />
                    </div>
                </div>

                {/* Product Management */}
                <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <PlusCircle size={18} className="text-emerald-400" />
                            <h2 className="text-white font-semibold">Ushbu filial bar mahsulotlari</h2>
                        </div>
                    </div>
                    
                    {/* Add new product form */}
                    <div className="flex gap-2 mb-6 bg-[#0f0c1e] p-3 rounded-xl border border-[#2d2556]">
                        <input 
                            placeholder="Nomi..." 
                            value={newProduct.name}
                            onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                            className="bg-transparent text-white text-xs outline-none flex-1 px-2" 
                        />
                        <input 
                            type="number" 
                            placeholder="Narxi..." 
                            value={newProduct.price}
                            onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                            className="bg-transparent text-white text-xs outline-none w-24 px-2 border-l border-[#2d2556]" 
                        />
                        <button 
                            type="button"
                            onClick={() => {
                                if (!newProduct.name || !newProduct.price) return
                                addMenuItem({ name: newProduct.name, price: Number(newProduct.price) })
                                setNewProduct({ name: '', price: '' })
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                        >
                            Qo'shish
                        </button>
                    </div>

                    {/* Products List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {menuItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-[#1a1630] border border-[#2d2556] rounded-xl hover:bg-[#221c3d] group transition">
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-medium">{item.name}</span>
                                    <span className="text-slate-500 text-[10px] font-mono">{item.price.toLocaleString()} so'm</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => removeMenuItem(item.id)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {menuItems.length === 0 && (
                            <p className="text-slate-500 text-xs text-center py-8">Hozircha mahsulotlar yo'q</p>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg
            ${saved
                            ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-violet-900/40'
                        }`}
                >
                    <Save size={16} />
                    {saved ? 'Saqlandi ✓' : 'Saqlash'}
                </button>

                {/* Reset system for selling / clean slate */}
                <div className="rounded-2xl bg-red-950/20 border border-red-900/40 p-6 mt-8">
                    <div className="flex items-center gap-2 mb-2">
                        <RotateCcw size={18} className="text-red-400" />
                        <h2 className="text-white font-semibold">Faqat ushbu filialni tozalash</h2>
                    </div>
                    <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                        Faqatgina <b>{currentClub?.name}</b> kassa ma'lumotlarini 0 ga tushiradi. Boshqa filiallarga umuman ta'sir qilmaydi.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full py-2.5 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs font-bold border border-red-800/40 hover:border-red-600 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <RotateCcw size={14} /> Ushbu filial ma'lumotlarini 0 ga tushirish
                    </button>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1630] border border-red-500/40 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-red-950/50">
                        <div className="w-12 h-12 rounded-xl bg-red-900/30 border border-red-700/40 flex items-center justify-center mx-auto mb-4 text-red-400">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-white font-bold text-center text-lg mb-2">Filialni nolga tushirish?</h3>
                        <p className="text-slate-400 text-xs text-center mb-6 leading-relaxed">
                            Faqat {currentClub?.name} seanslari va to'lovlar tarixi o'chiriladi. 9 ta xona va menyu toza holatda qoladi.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl bg-[#2d2556] text-slate-300 text-xs font-semibold hover:bg-[#3d3470] transition cursor-pointer"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-lg shadow-red-900/40 cursor-pointer"
                            >
                                Ha, tozalash
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
