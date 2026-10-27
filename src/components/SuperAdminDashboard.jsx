import React, { useState, useEffect } from 'react'
import {
  Building2,
  Plus,
  TrendingUp,
  Gamepad2,
  Users,
  Shield,
  ArrowRight,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  KeyRound,
  Check,
  X,
  Copy,
  CheckCheck,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import {
  getAllClubs,
  saveAllClubs,
  createNewClub,
  updateClub,
  deleteClub,
  getClubSummary,
  getSuperAdminPin,
  setSuperAdminPin
} from '../lib/storage'

function formatMoney(num) {
  return (num || 0).toLocaleString('uz-UZ') + " so'm"
}

export default function SuperAdminDashboard({ onSelectClub }) {
  const [clubs, setClubs] = useState(() => getAllClubs())
  const [summaries, setSummaries] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClub, setEditingClub] = useState(null)
  const [copiedClubId, setCopiedClubId] = useState(null)

  // Super Admin Master PIN sozlamasi
  const [showAdminPinModal, setShowAdminPinModal] = useState(false)
  const [adminPinInput, setAdminPinInput] = useState(() => getSuperAdminPin())
  const [adminPinSaved, setAdminPinSaved] = useState(false)

  // Yangi filial formasi
  const [newClubForm, setNewClubForm] = useState({
    name: '',
    address: '',
    phone: '',
    pin: ''
  })

  // Barcha filiallar hisobotini hisoblash
  const refreshSummaries = () => {
    const currentClubs = getAllClubs()
    setClubs(currentClubs)
    const map = {}
    currentClubs.forEach(c => {
      map[c.id] = getClubSummary(c.id)
    })
    setSummaries(map)
  }

  useEffect(() => {
    refreshSummaries()
  }, [])

  // Umumiy tarmoq statistikasi
  const totalTodayIncome = Object.values(summaries).reduce((acc, s) => acc + (s.todayIncome || 0), 0)
  const totalActiveRooms = Object.values(summaries).reduce((acc, s) => acc + (s.activeCount || 0), 0)
  const totalClients = Object.values(summaries).reduce((acc, s) => acc + (s.clientsCount || 0), 0)

  // PIN-koddan nusxa olish
  const handleCopyPin = (clubId, pin) => {
    navigator.clipboard.writeText(pin)
    setCopiedClubId(clubId)
    setTimeout(() => setCopiedClubId(null), 2000)
  }

  // Yangi filial qo'shish
  const handleCreateClub = (e) => {
    e.preventDefault()
    if (!newClubForm.name.trim()) return

    const created = createNewClub({
      name: newClubForm.name,
      address: newClubForm.address,
      phone: newClubForm.phone,
      pin: newClubForm.pin ? newClubForm.pin.trim() : String(Math.floor(1000 + Math.random() * 9000))
    })

    setNewClubForm({ name: '', address: '', phone: '', pin: '' })
    setShowAddModal(false)
    refreshSummaries()
  }

  // Filialni saqlash (tahrirlash)
  const handleUpdateClub = (e) => {
    e.preventDefault()
    if (!editingClub || !editingClub.name.trim()) return

    updateClub(editingClub.id, {
      name: editingClub.name,
      address: editingClub.address,
      phone: editingClub.phone,
      pin: (editingClub.pin || '').trim()
    })
    setEditingClub(null)
    refreshSummaries()
  }

  // Filialni o'chirish
  const handleDeleteClub = (id, name) => {
    if (clubs.length <= 1) {
      alert("Kamida bitta filial qolishi shart!")
      return
    }
    if (window.confirm(`Haqiqatan ham "${name}" filialini o'chirmoqchimisiz?`)) {
      deleteClub(id)
      refreshSummaries()
    }
  }

  // Super Admin Master PIN ni yangilash
  const handleSaveAdminPin = (e) => {
    e.preventDefault()
    if (!adminPinInput.trim()) return
    setSuperAdminPin(adminPinInput.trim())
    setAdminPinSaved(true)
    setTimeout(() => {
      setAdminPinSaved(false)
      setShowAdminPinModal(false)
    }, 1500)
  }

  return (
    <div className="p-6 md:p-8 min-h-screen text-white">

      {/* Sarlavha & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
              <Shield size={12} />
              SUPER ADMIN BOSHQARUVI
            </span>
            <span className="text-slate-400 text-xs">Barcha xonalar va parollar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">PlayStation Xonalar Boshqaruvi</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Har bir PS xonaning kirish parollari (PIN), tushumlari va sozlamalarini nazorat qiling
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => {
              setAdminPinInput(getSuperAdminPin())
              setShowAdminPinModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1e1a3a] border border-[#2d2556] text-slate-300 hover:text-white hover:border-violet-500 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <Lock size={15} className="text-violet-400" />
            <span>Admin PIN: <span className="font-mono text-violet-300">{getSuperAdminPin()}</span></span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-xl shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={17} />
            <span>Yangi PS Xona Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Umumiy tarmoq ko'rsatkichlari (KPI cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Jami bugungi daromad */}
        <div className="p-5 rounded-2xl bg-[#1a1630] border border-[#2d2556] relative overflow-hidden group hover:border-violet-500/50 transition shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Jami Bugungi Tushum</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">{formatMoney(totalTodayIncome)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Barcha PS xonalarning umumiy kassasi</p>
        </div>

        {/* Faol seanslar */}
        <div className="p-5 rounded-2xl bg-[#1a1630] border border-[#2d2556] relative overflow-hidden group hover:border-violet-500/50 transition shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">O'ynalayotgan Konsollar</span>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Gamepad2 size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-violet-300">{totalActiveRooms} ta xona</p>
          <p className="text-[11px] text-slate-400 mt-1">Ayni paytda band konsollar</p>
        </div>

        {/* Faol filiallar */}
        <div className="p-5 rounded-2xl bg-[#1a1630] border border-[#2d2556] relative overflow-hidden group hover:border-violet-500/50 transition shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Ulangan PS Xonalar</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-300">{clubs.length} ta filial</p>
          <p className="text-[11px] text-slate-400 mt-1">Har birining o'z paroli bor</p>
        </div>

        {/* Doimiy mijozlar */}
        <div className="p-5 rounded-2xl bg-[#1a1630] border border-[#2d2556] relative overflow-hidden group hover:border-violet-500/50 transition shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Jami Mijozlar</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-cyan-300">{totalClients} nafar</p>
          <p className="text-[11px] text-slate-400 mt-1">Barcha klublar bo'yicha mijozlar</p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PS XONALAR VA ULARNING PAROLLARI RO'YXATI */}
      {/* ============================================================== */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <KeyRound size={20} className="text-violet-400" />
          PS Xonalar va Kirish Parollari (PIN-kodlar)
        </h2>
        <span className="text-xs text-slate-400">Jami: {clubs.length} ta klub</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((c, index) => {
          const sum = summaries[c.id] || { todayIncome: 0, activeCount: 0, freeCount: 9, totalRooms: 9 }
          const isCopied = copiedClubId === c.id

          return (
            <div
              key={c.id}
              className="rounded-3xl bg-[#16122d] border border-[#2d2556] p-6 hover:border-violet-500/60 transition-all duration-300 shadow-xl flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Tepasi: Nomi va amallar */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/40 flex items-center justify-center font-black text-violet-300">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-violet-300 transition-colors">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                        <MapPin size={13} className="shrink-0 text-slate-500" />
                        <span className="truncate max-w-[190px]">{c.address || "Manzil ko'rsatilmagan"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingClub(c)}
                      title="Filial va parolni tahrirlash"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#251f47] transition cursor-pointer"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteClub(c.id, c.name)}
                      title="O'chirish"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* 🔑 KIRISH PAROLI (PIN-KOD) BLOKI */}
                <div className="my-4 p-4 rounded-2xl bg-[#0e0b1f] border border-violet-500/30 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <KeyRound size={13} className="text-violet-400" /> Kirish Paroli (PIN)
                    </span>
                    <button
                      onClick={() => handleCopyPin(c.id, c.pin || '1111')}
                      className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition cursor-pointer font-medium"
                    >
                      {isCopied ? (
                        <>
                          <CheckCheck size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">Nusxalandi!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Nusxa olish</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-mono text-2xl font-black text-violet-300 tracking-wider">
                      {c.pin || '1111'}
                    </span>
                    <button
                      onClick={() => setEditingClub(c)}
                      className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Parolni o'zgartirish
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 mt-2">
                    Ushbu pes xona xodimi saytga kirishda faqat shu PIN kodni teradi.
                  </p>
                </div>

                {/* Telefon & Jonli kassa */}
                <div className="space-y-2 mb-6">
                  {c.phone && (
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span>Telefon:</span>
                      <span className="text-slate-200 font-medium flex items-center gap-1">
                        <Phone size={12} className="text-slate-500" /> {c.phone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-xs text-emerald-300/80">Bugungi Kassa:</span>
                    <span className="text-sm font-black text-emerald-400">
                      {formatMoney(sum.todayIncome)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1 pt-1">
                    <span className="text-slate-400">Faol konsollar:</span>
                    <span className="font-semibold text-slate-200">
                      <span className="text-violet-400 font-bold">{sum.activeCount} ta band</span> / {sum.totalRooms} ta xona
                    </span>
                  </div>
                </div>
              </div>

              {/* Boshqaruvga o'tish tugmasi */}
              <button
                onClick={() => onSelectClub(c.id)}
                className="w-full py-3 px-4 rounded-xl bg-[#251f47] hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Xona Boshqaruviga Kirish</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )
        })}
      </div>

      {/* ============================================================== */}
      {/* YANGI PS XONA QO'SHISH MODAL OYNASI */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#16122d] border border-[#2d2556] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-violet-400" />
                <h3 className="text-lg font-bold text-white">Yangi PS Xona Qo'shish</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#251f47]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">PS Xona Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 4-Filial (Olmazor) yoki GameZone"
                  value={newClubForm.name}
                  onChange={e => setNewClubForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#0b0918] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">
                  Ushbu Xona Uchun Kirish Paroli (PIN-kod) *
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="Masalan: 4444"
                    value={newClubForm.pin}
                    onChange={e => setNewClubForm(f => ({ ...f, pin: e.target.value }))}
                    className="w-full bg-[#0b0918] border border-violet-500/40 text-violet-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-wider outline-none focus:border-violet-400 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Ushbu klub operatori saytda faqat mana shu parolni teradi.</p>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">Manzili</label>
                <input
                  type="text"
                  placeholder="Masalan: Olmazor tumani, Qorasaroy ko'chasi"
                  value={newClubForm.address}
                  onChange={e => setNewClubForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-[#0b0918] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">Telefon raqami</label>
                <input
                  type="text"
                  placeholder="+998 90 ..."
                  value={newClubForm.phone}
                  onChange={e => setNewClubForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-[#0b0918] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-violet-500 transition"
                />
              </div>

              <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 text-[11px] text-violet-300">
                ✨ Ushbu xona uchun avtomatik 9 ta yangi xona, bar menyusi va toza alohida kassa ochiladi.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#251f47] text-slate-300 text-xs font-semibold hover:text-white transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 transition cursor-pointer"
                >
                  Xonani Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FILIAL VA PAROLNI TAHRIRLASH MODAL OYNASI */}
      {/* ============================================================== */}
      {editingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#16122d] border border-[#2d2556] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Edit2 size={20} className="text-violet-400" />
                <h3 className="text-lg font-bold text-white">Xona va Parolni Tahrirlash</h3>
              </div>
              <button
                onClick={() => setEditingClub(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-[#251f47]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateClub} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">PS Xona Nomi</label>
                <input
                  type="text"
                  required
                  value={editingClub.name}
                  onChange={e => setEditingClub(c => ({ ...c, name: e.target.value }))}
                  className="w-full bg-[#0b0918] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">
                  Kirish Paroli (PIN-kod)
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={editingClub.pin || ''}
                    onChange={e => setEditingClub(c => ({ ...c, pin: e.target.value }))}
                    className="w-full bg-[#0b0918] border border-violet-500 text-violet-300 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-400 transition font-mono tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">Manzili</label>
                <input
                  type="text"
                  value={editingClub.address || ''}
                  onChange={e => setEditingClub(c => ({ ...c, address: e.target.value }))}
                  className="w-full bg-[#0b0918] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">Telefon</label>
                <input
                  type="text"
                  value={editingClub.phone || ''}
                  onChange={e => setEditingClub(c => ({ ...c, phone: e.target.value }))}
                  className="w-full bg-[#0b0918] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-violet-500 transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClub(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#251f47] text-slate-300 text-xs font-semibold hover:text-white transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 transition cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUPER ADMIN MASTER PIN O'ZGARTIRISH MODALI */}
      {/* ============================================================== */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#16122d] border border-violet-500/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-violet-400" />
                <h3 className="text-lg font-bold text-white">Super Admin PIN</h3>
              </div>
              <button
                onClick={() => setShowAdminPinModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-[#251f47]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Ushbu master PIN faqat siz (boshqaruvchi) uchun. Shu PIN bilan barcha filiallar paneliga kirasiz.
            </p>

            <form onSubmit={handleSaveAdminPin} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">Yangi Master PIN</label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={adminPinInput}
                  onChange={e => setAdminPinInput(e.target.value)}
                  className="w-full bg-[#0b0918] border border-violet-500 text-violet-300 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest outline-none focus:border-violet-400 transition"
                />
              </div>

              {adminPinSaved && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs text-center font-semibold">
                  Yangi PIN muvaffaqiyatli saqlandi! ✓
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#251f47] text-slate-300 text-xs font-semibold hover:text-white transition"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 transition cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
