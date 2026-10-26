import React, { useState, useEffect } from 'react';
import { Zap, Flame, Sun, Droplet, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { STORAGE_KEYS, DEFAULT_UTILITIES, ENABLE_SUPABASE, loadLocal, saveLocal, safeSupabaseSync } from '../lib/storage';

const typeIcons = {
  electricity: Zap,
  gas: Flame,
  light: Sun,
  water: Droplet,
};

const typeLabels = {
  electricity: 'Elektr energiyasi',
  gas: 'Gaz',
  light: 'Svet (yoritish)',
  water: 'Suv',
};

function formatMoney(num) {
  return (num || 0).toLocaleString('uz-UZ') + " so'm";
}

export default function Utilities() {
  const [utilities, setUtilities] = useState(() => loadLocal(STORAGE_KEYS.UTILITIES, DEFAULT_UTILITIES));
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'electricity', amount: '', month: 'Oktabr 2026' });

  useEffect(() => {
    if (ENABLE_SUPABASE) {
      fetchBackgroundUtilities();
    }
  }, []);

  const fetchBackgroundUtilities = async () => {
    if (!ENABLE_SUPABASE) return;
    try {
      if (!supabase) return;
      const { data } = await supabase
        .from('utilities')
        .select('*')
        .order('id', { ascending: false });
      if (data && data.length > 0) {
        setUtilities(data);
        saveLocal(STORAGE_KEYS.UTILITIES, data);
      }
    } catch (err) {
      console.debug('Utilities Supabase sync skipped:', err?.message || err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.amount) return;

    const newUtil = {
      id: Date.now(),
      name: typeLabels[form.type],
      type: form.type,
      amount: Number(form.amount),
      month: form.month || 'Oktabr 2026',
      paid: false,
    };

    const updated = [newUtil, ...utilities];
    setUtilities(updated);
    saveLocal(STORAGE_KEYS.UTILITIES, updated);
    safeSupabaseSync(() => supabase.from('utilities').insert([newUtil]));

    setForm({ type: 'electricity', amount: '', month: 'Oktabr 2026' });
    setShowForm(false);
  };

  const handleTogglePaid = async (id, currentPaid) => {
    const updated = utilities.map(u => u.id === id ? { ...u, paid: !currentPaid } : u);
    setUtilities(updated);
    saveLocal(STORAGE_KEYS.UTILITIES, updated);
    safeSupabaseSync(() => supabase.from('utilities').update({ paid: !currentPaid }).eq('id', id));
  };

  const handleDelete = async (id) => {
    const updated = utilities.filter(u => u.id !== id);
    setUtilities(updated);
    saveLocal(STORAGE_KEYS.UTILITIES, updated);
    safeSupabaseSync(() => supabase.from('utilities').delete().eq('id', id));
  };

  // Metrics
  const totalAmount = utilities.reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
  const paidAmount = utilities.filter(u => u.paid).reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
  const unpaidAmount = utilities.filter(u => !u.paid).reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Kommunal to'lovlar</h1>
          <p className="text-slate-400 text-sm mt-1">Klubning gaz, svet, suv va yoritish xarajatlari (LocalStorage da saqlanadi)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 cursor-pointer"
        >
          <Plus size={16} /> Yangi to'lov qo'shish
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Jami xarajat", value: totalAmount, color: 'text-violet-400', bg: 'bg-[#1a1630]' },
          { label: "To'langan", value: paidAmount, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
          { label: "To'lanmagan", value: unpaidAmount, color: 'text-rose-400', bg: 'bg-rose-950/20 border-rose-900/40' },
        ].map((item, idx) => (
          <div key={idx} className={`rounded-2xl p-5 border border-[#2d2556] ${item.bg}`}>
            <p className="text-slate-500 text-xs mb-1 font-medium">{item.label}</p>
            <p className={`text-xl font-bold ${item.color}`}>{formatMoney(item.value)}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-xs">Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {utilities.map((u) => {
            const Icon = typeIcons[u.type] || Zap;
            return (
              <div key={u.id} className={`flex items-center gap-4 p-5 rounded-2xl border transition ${u.paid ? 'bg-[#1a1630]/60 border-[#2d2556]/60' : 'bg-[#1a1630] border-[#392e6e]'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${u.paid ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-rose-400'}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-bold text-sm truncate">{u.name}</p>
                    <span className="text-[10px] text-slate-500 font-medium">({u.month})</span>
                  </div>
                  <p className="text-white font-semibold text-lg">{formatMoney(u.amount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleTogglePaid(u.id, u.paid)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer
                      ${u.paid 
                        ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800/30' 
                        : 'bg-amber-900/20 text-amber-500 border-amber-800/30 hover:bg-amber-900/40'}`}
                  >
                    {u.paid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {u.paid ? "To'langan" : "To'lash"}
                  </button>
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {utilities.length === 0 && (
            <div className="col-span-2 rounded-2xl bg-[#1a1630] border border-[#2d2556] p-10 text-center">
              <p className="text-slate-500 text-sm">Hech qanday kommunal to'lov mavjud emas</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1630] border border-[#2d2556] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-5">Yangi kommunal to'lov</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Turi</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                >
                  <option value="electricity">Elektr energiyasi</option>
                  <option value="gas">Gaz</option>
                  <option value="light">Svet (yoritish)</option>
                  <option value="water">Suv</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Summa (so'm)</label>
                <input
                  type="number"
                  required
                  placeholder="Masalan: 120000"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Oy</label>
                <input
                  required
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                  className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 py-2.5 rounded-xl bg-[#2d2556] text-slate-300 text-sm hover:bg-[#3d3470] transition select-none cursor-pointer"
                >
                  Bekor
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 select-none cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
