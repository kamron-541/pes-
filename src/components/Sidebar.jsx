import React, { useState } from 'react'
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Settings,
  Gamepad2,
  BarChart3,
  Briefcase,
  Zap,
  Building2,
  LogOut,
  ChevronDown,
  Shield,
  Store
} from 'lucide-react'

export default function Sidebar({
  activePage,
  setActivePage,
  currentClub,
  clubs,
  onSwitchClub,
  isSuperAdmin,
  onLogout
}) {
  const [showClubDropdown, setShowClubDropdown] = useState(false)

  const navItems = [
    ...(isSuperAdmin
      ? [{ id: 'super_admin', label: 'Barcha Filiallar', icon: Building2 }]
      : []),
    { id: 'dashboard', label: 'Dashboard (Xonalar)', icon: LayoutDashboard },
    { id: 'booking', label: 'Bron qilish', icon: CalendarCheck },
    { id: 'statistics', label: 'Statistika & Kassa', icon: BarChart3 },
    { id: 'clients', label: 'Mijozlar', icon: Users },
    { id: 'employer', label: 'Xodimlar', icon: Briefcase },
    { id: 'utilities', label: 'Kommunal', icon: Zap },
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
  ]

  return (
    <aside className="w-64 h-full bg-[#13102a] border-r border-[#2d2556] flex flex-col justify-between select-none">
      <div>
        {/* Clean Club Header (Faqat filial/klub nomi chiqadi) */}
        <div className="p-4 border-b border-[#2d2556] relative">
          <div
            onClick={() => isSuperAdmin && setShowClubDropdown(!showClubDropdown)}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
              isSuperAdmin
                ? 'bg-[#1b1638] border border-violet-500/40 hover:border-violet-400 cursor-pointer shadow-lg shadow-violet-950/40'
                : 'bg-[#181333] border border-[#2d2556]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0 text-white">
              {isSuperAdmin ? <Gamepad2 size={22} /> : <Store size={20} />}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <h2 className="text-white font-bold text-sm leading-tight truncate">
                {currentClub?.name || 'PlayStation Club'}
              </h2>
              <p className="text-violet-400 text-[11px] truncate mt-0.5">
                {isSuperAdmin ? '👑 Bosh Admin' : (currentClub?.address || "PlayStation Club")}
              </p>
            </div>
            {isSuperAdmin && (
              <ChevronDown size={15} className={`text-slate-400 transition-transform shrink-0 ${showClubDropdown ? 'rotate-180' : ''}`} />
            )}
          </div>

          {/* Super Admin Branch Switcher Dropdown */}
          {isSuperAdmin && showClubDropdown && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-[#181335] border border-[#3b326d] rounded-2xl shadow-2xl p-2 z-50 space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Filialni tanlang:
              </div>
              <button
                onClick={() => {
                  setActivePage('super_admin')
                  setShowClubDropdown(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activePage === 'super_admin'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-300 hover:bg-[#251f47] hover:text-white'
                }`}
              >
                <Building2 size={14} />
                <span>🏢 Barcha Filiallar Paneli</span>
              </button>

              <div className="h-px bg-[#2d2556] my-1" />

              {clubs.map(c => {
                const isCur = currentClub?.id === c.id && activePage !== 'super_admin'
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSwitchClub(c.id)
                      setShowClubDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      isCur
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-[#251f47] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">{c.pin}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activePage === id
            return (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40'
                    : 'text-slate-400 hover:bg-[#1e1a3a] hover:text-white'
                }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom User / Logout */}
      <div className="p-4 border-t border-[#2d2556]">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e1a3a] hover:bg-red-950/40 border border-[#2d2556] hover:border-red-500/50 text-slate-300 hover:text-red-300 text-xs font-semibold transition cursor-pointer"
        >
          <LogOut size={15} />
          <span>Chiqish / Almashtirish</span>
        </button>
      </div>
    </aside>
  )
}
