import { LayoutDashboard, CalendarCheck, Users, Settings, Gamepad2, BarChart3, Briefcase, Zap } from 'lucide-react'

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'booking', label: 'Bron qilish', icon: CalendarCheck },
    { id: 'statistics', label: 'Statistika', icon: BarChart3 },
    { id: 'clients', label: 'Mijozlar', icon: Users },
    { id: 'employer', label: 'Xodimlar', icon: Briefcase },
    { id: 'utilities', label: 'Kommunal', icon: Zap },
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
]

export default function Sidebar({ activePage, setActivePage }) {
    return (
        <aside className="w-64 h-full bg-[#13102a] border-r border-[#2d2556] flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-[#2d2556]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/50">
                    <Gamepad2 size={22} className="text-white" />
                </div>
                <div>
                    <p className="text-white font-bold text-base leading-tight">PS Admin</p>
                    <p className="text-violet-400 text-xs">Klub boshqaruvi</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = activePage === id
                    return (
                        <button
                            key={id}
                            onClick={() => setActivePage(id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                ${isActive
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40'
                                    : 'text-slate-400 hover:bg-[#1e1a3a] hover:text-white'
                                }`}
                        >
                            <Icon size={18} />
                            {label}
                        </button>
                    )
                })}
            </nav>
        </aside>
    )
}
