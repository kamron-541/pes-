import React, { useState } from 'react'
import { Gamepad2, Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login({ onLoginSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (isLoginTab) {
        // Tizimga kirish
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        if (data?.user) {
          onLoginSuccess(data.user)
        }
      } else {
        // Ro'yxatdan o'tish
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error
        alert("Siz muvaffaqiyatli ro'yxatdan o'tdingiz. Tizimga kora olasiz!")
        setIsLoginTab(true)
      }
    } catch (err) {
      setErrorMsg(err.message || "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07050e] text-white">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl bg-[#13102a]/80 border border-[#2d2556] backdrop-blur-xl shadow-2xl relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/50">
            <Gamepad2 size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-1">PlayStation Club</h1>
          <p className="text-slate-400 text-xs">Boshqaruv boshqaruv paneliga kirish</p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-[#0f0c1e] p-1 rounded-xl mb-6 border border-[#2d2556]">
          <button
            onClick={() => { setIsLoginTab(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isLoginTab ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Kirish
          </button>
          <button
            onClick={() => { setIsLoginTab(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${!isLoginTab ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Elektron pochta (Email)</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="misol@psclub.uz"
                className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl pl-11 pr-4 py-3 text-xs outline-none focus:border-violet-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Parol</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl pl-11 pr-4 py-3 text-xs outline-none focus:border-violet-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all duration-200 shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLoginTab ? (
              <>
                <LogIn size={15} />
                Tizimga kirish
              </>
            ) : (
              <>
                <UserPlus size={15} />
                Yaratish va kirish
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
onChange = { e => setPassword(e.target.value) }
placeholder = "••••••••"
className = "w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-violet-500 transition"
  />
              </div >
            </div >

  <button
    type="submit"
    disabled={loading || !email || !password}
    className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading ? (
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    ) : isLoginTab ? <><LogIn size={16} /> Kirish</> : <><UserPlus size={16} /> Ro'yxatdan o'tish</>}
  </button>
          </form >
        </div >

  {/* Guide card */ }
  < div className = "p-5 rounded-2xl bg-[#1a1630]/80 border border-violet-900/40 text-xs text-slate-400 relative z-10" >
          <p className="text-violet-300 font-bold mb-2 flex items-center gap-1.5">
            <CheckCircle size={13} className="text-violet-400" />
            Birinchi marta kirish yo'riqnomasi
          </p>
          <ol className="space-y-1 list-decimal list-inside leading-relaxed">
            <li><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-violet-400 underline">supabase.com/dashboard</a> ga kiring</li>
            <li>Loyihangizni oching → <strong className="text-slate-300">Authentication</strong></li>
            <li><strong className="text-slate-300">Providers</strong> → <strong className="text-slate-300">Email</strong></li>
            <li><strong className="text-slate-300">"Confirm email"</strong> ni o'chiring → Save</li>
            <li>Keyin bu yerdan ro'yxatdan o'ting – darhol kiradi ✓</li>
          </ol>
        </div >
      </div >
    </div >
  )
}
