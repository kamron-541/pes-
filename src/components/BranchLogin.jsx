import React, { useState } from 'react'
import { Gamepad2, KeyRound, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { getAllClubs, getSuperAdminPin } from '../lib/storage'

export default function BranchLogin({ onLoginSuccess }) {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    const enteredPin = pin.trim()
    if (!enteredPin) return

    // 1. Super Admin (Boshqaruvchi) PIN-kodini tekshirish
    const adminPin = getSuperAdminPin()
    if (enteredPin === adminPin) {
      onLoginSuccess({
        role: 'super_admin',
        clubId: 'admin',
        clubName: 'Super Admin (Boshqaruvchi)'
      })
      return
    }

    // 2. PS xonalar (Filiallar) PIN-kodini tekshirish
    const clubs = getAllClubs()
    const matchedClub = clubs.find(c => String(c.pin).trim() === enteredPin)

    if (matchedClub) {
      onLoginSuccess({
        role: 'operator',
        clubId: matchedClub.id,
        clubName: matchedClub.name,
        clubAddress: matchedClub.address
      })
      return
    }

    setErrorMsg("PIN-kod noto'g'ri! Iltimos, parolni qaytadan tekshirib kiriting.")
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07050e] text-white p-4">
      {/* Background ambient neon glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-sm p-8 rounded-3xl bg-[#13102a]/95 border border-[#2d2556] backdrop-blur-2xl shadow-2xl relative z-10">

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-900/50">
            <Gamepad2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-1.5">PlayStation Boshqaruvi</h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            Tizimga kirish uchun xonangiz PIN-kodini kiriting
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="relative">
              <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPin ? "text" : "password"}
                autoFocus
                required
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="PIN kodni kiriting..."
                className="w-full bg-[#0b0918] border border-[#2d2556] text-white rounded-2xl pl-12 pr-12 py-3.5 text-center text-lg font-mono tracking-widest outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-xl shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Kirish</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-7 pt-5 border-t border-[#2d2556]/60 text-center">
          <p className="text-[11px] text-slate-500 leading-normal">
            🔒 Bir marta kiritilgan PIN-kod brauzerda eslab qolinadi va qayta so'ralmaydi.
          </p>
        </div>

      </div>
    </div>
  )
}
