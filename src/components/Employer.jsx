import { useState } from 'react'
import { Briefcase, UserPlus, Shield, Clock, Phone, Mail, MoreHorizontal, Trash2, DollarSign, History, Plus } from 'lucide-react'

export default function Employer({ staff, addStaff, removeStaff, expenses, addExpense }) {
    const [showForm, setShowForm] = useState(false)
    const [showExpenseModal, setShowExpenseModal] = useState(null) // staffId
    const [expenseForm, setExpenseForm] = useState({ amount: '', reason: 'Obed uchun' })
    const [form, setForm] = useState({ name: '', role: 'Operator', phone: '' })

    const handleAdd = () => {
        if (!form.name || !form.phone) return
        addStaff({
            name: form.name,
            role: form.role,
            phone: form.phone
        })
        setForm({ name: '', role: 'Operator', phone: '' })
        setShowForm(false)
    }

    const handleAddExpense = () => {
        if (!expenseForm.amount) return
        const staffMember = staff.find(s => s.id === showExpenseModal)
        addExpense({
            staffId: showExpenseModal,
            staffName: staffMember ? staffMember.name : "Noma'lum",
            amount: Number(expenseForm.amount),
            reason: expenseForm.reason,
            date: new Date().toLocaleString('uz-UZ')
        })
        setExpenseForm({ amount: '', reason: 'Obed uchun' })
        setShowExpenseModal(null)
    }

    const getStaffExpenses = (id) => {
        return expenses.filter(e => e.staff_id === id || e.staffId === id).reduce((sum, e) => sum + e.amount, 0)
    }

    return (
        <div className="p-6 min-h-screen">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-white text-2xl font-bold">Xodimlar</h1>
                    <p className="text-slate-400 text-sm mt-1">Klub xodimlari va ularning rollari</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 cursor-pointer"
                >
                    <UserPlus size={16} /> Xodim qo'shish
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {staff.map(s => {
                    const totalExp = getStaffExpenses(s.id)
                    return (
                    <div key={s.id} className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-5 flex items-center justify-between hover:border-violet-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2d2556] to-[#1a1630] border border-[#3d3470] flex items-center justify-center text-violet-400 font-bold group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300">
                                {s.name ? s.name[0].toUpperCase() : 'X'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-bold">{s.name}</p>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border 
                                        ${s.role === 'Admin' ? 'bg-amber-900/20 text-amber-500 border-amber-800/30' : 'bg-blue-900/20 text-blue-500 border-blue-800/30'}`}>
                                        {s.role}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-slate-500 text-xs flex items-center gap-1">
                                        <Phone size={10} /> {s.phone}
                                    </p>
                                    {totalExp > 0 && (
                                        <p className="text-rose-400 text-xs font-bold flex items-center gap-1">
                                            <DollarSign size={10} /> {totalExp.toLocaleString()} so'm olingan
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setShowExpenseModal(s.id)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/20 text-emerald-400 text-xs font-bold border border-emerald-800/30 hover:bg-emerald-900/40 transition cursor-pointer"
                            >
                                <Plus size={12} /> Pul berish
                            </button>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${s.status === 'Ishda' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                                    <p className={`text-xs font-medium ${s.status === 'Ishda' ? 'text-emerald-400' : 'text-slate-400'}`}>{s.status}</p>
                                </div>
                                <p className="text-slate-500 text-[10px] mt-0.5 font-mono">ID: {s.id.toString().slice(-4)}</p>
                            </div>
                            <button onClick={() => removeStaff(s.id)} className="p-2 rounded-lg bg-red-900/10 text-red-500/50 hover:text-red-500 hover:bg-red-900/20 transition cursor-pointer">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                )})}
                {staff.length === 0 && (
                    <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-8 text-center">
                        <p className="text-slate-500 text-sm">Xodimlar ro'yxati bo'sh. "+ Xodim qo'shish" tugmasi orqali xodim kiriting.</p>
                    </div>
                )}
            </div>

            {/* Expenses History */}
            {expenses.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <History size={18} className="text-violet-400" />
                        Xarajatlar tarixi (Avanslar)
                    </h2>
                    <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#0f0c1e] border-b border-[#2d2556]">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Xodim</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Sana</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Sabab</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Summa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2d2556]">
                                {expenses.slice(0, 10).map(e => (
                                    <tr key={e.id} className="hover:bg-[#221c3d] transition">
                                        <td className="px-6 py-4 text-sm text-white font-medium">{e.staff_name || e.staffName}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">{e.date}</td>
                                        <td className="px-6 py-4 text-xs text-slate-400">{e.reason}</td>
                                        <td className="px-6 py-4 text-sm text-rose-400 font-bold text-right">{e.amount.toLocaleString()} so'm</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1630] border border-[#2d2556] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-5">Yangi xodim qo'shish</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Ism familiya</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Ism kiriting..." className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Lavozim</label>
                                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                    className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition">
                                    <option value="Admin">Admin</option>
                                    <option value="Operator">Operator</option>
                                    <option value="Kassir">Kassir</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Telefon</label>
                                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                    placeholder="+998 90 000 00 00" className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-[#2d2556] text-slate-300 text-sm hover:bg-[#3d3470] transition cursor-pointer">Bekor</button>
                            <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 cursor-pointer">Saqlash</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1630] border border-[#2d2556] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-1">Pul berish (Avans)</h3>
                        <p className="text-violet-400 text-xs mb-5">{staff.find(s => s.id === showExpenseModal)?.name}</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Summa (so'm)</label>
                                <input 
                                    type="number" 
                                    value={expenseForm.amount} 
                                    onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                                    placeholder="Masalan: 20000" 
                                    className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition" 
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Sabab</label>
                                <input 
                                    value={expenseForm.reason} 
                                    onChange={e => setExpenseForm(f => ({ ...f, reason: e.target.value }))}
                                    className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition" 
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowExpenseModal(null)} className="flex-1 py-2.5 rounded-xl bg-[#2d2556] text-slate-300 text-sm hover:bg-[#3d3470] transition cursor-pointer">Bekor</button>
                            <button onClick={handleAddExpense} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-900/40 cursor-pointer">Saqlash</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
