import { useState, useEffect } from 'react';
import { Zap, Flame, Droplets, Lightbulb, Plus, CheckCircle, Clock, Trash2, X, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { STORAGE_KEYS, DEFAULT_UTILITIES, ENABLE_SUPABASE, loadLocal, saveLocal, safeSupabaseSync } from '../lib/storage';

const typeIcons = {
  electricity: Zap,
  gas: Flame,
  light: Lightbulb,
  water: Droplets,
};

const typeLabels = {
  electricity: 'Elektr energiyasi (Tok)',
  gas: 'Gaz',
  light: 'Svet (yoritish)',
  water: 'Suv',
};

function formatMoney(num) {
  return (num || 0).toLocaleString('uz-UZ') + " so'm";
}

export default function Utilities({ clubId, currentClub }) {
  const [utilities, setUtilities] = useState(() => loadLocal(STORAGE_KEYS.UTILITIES, DEFAULT_UTILITIES, clubId));
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'electricity', amount: '', month: 'Oktabr 2026' });

  useEffect(() => {
    setUtilities(loadLocal(STORAGE_KEYS.UTILITIES, DEFAULT_UTILITIES, clubId));
    if (ENABLE_SUPABASE) {
      fetchBackgroundUtilities();
    }
  }, [clubId]);

  const fetchBackgroundUtilities = async () => {
    if (!ENABLE_SUPABASE) return;
    try {
      if (!supabase) return;
      let query = supabase
        .from('utilities')
        .select('*')
        .order('id', { ascending: false });

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        setUtilities(data);
        saveLocal(STORAGE_KEYS.UTILITIES, data, clubId);
      }
    } catch (err) {
      console.debug('Utilities Supabase sync skipped:', err?.message || err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.amount) return;

    const nowIso = new Date().toISOString();
    const newUtil = {
      id: Date.now(),
      name: typeLabels[form.type],
      type: form.type,
      amount: Number(form.amount),
      month: form.month || 'Oktabr 2026',
      paid: false,
      created_at: nowIso,
      paid_at: null,
    };

    const updated = [newUtil, ...utilities];
    setUtilities(updated);
    saveLocal(STORAGE_KEYS.UTILITIES, updated, clubId);
    safeSupabaseSync(() => supabase.from('utilities').insert([{ ...newUtil, club_id: clubId }]));

    setForm({ type: 'electricity', amount: '', month: 'Oktabr 2026' });
    setShowForm(false);
  };

  const handleTogglePaid = async (id, currentPaid) => {
    const nowIso = new Date().toISOString();
    const updated = utilities.map(u => {
      if (u.id === id) {
        const nextPaid = !currentPaid;
        return {
          ...u,
          paid: nextPaid,
          paid_at: nextPaid ? (u.paid_at || nowIso) : null
        };
      }
      return u;
    });
    setUtilities(updated);
    saveLocal(STORAGE_KEYS.UTILITIES, updated, clubId);
    safeSupabaseSync(() => supabase.from('utilities').update({ paid: !currentPaid }).eq('id', id).eq('club_id', clubId));
  };

  const handleDelete = async (id) => {
    const updated = utilities.filter(u => u.id !== id);
    setUtilities(updated);
    saveLocal(STORAGE_KEYS.UTILITIES, updated, clubId);
    safeSupabaseSync(() => supabase.from('utilities').delete().eq('id', id).eq('club_id', clubId));
  };

  // Metrics
  const totalAmount = utilities.reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
  const paidAmount = utilities.filter(u => u.paid).reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
  const unpaidAmount = utilities.filter(u => !u.paid).reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
              <Building2 size={12} />
              {currentClub?.name || "Filial"}
            </span>
            <span className="text-slate-400 text-xs">Kommunal hisob-kitoblar</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Kommunal to'lovlar</h1>
          <p className="text-slate-400 text-sm mt-1">Ushbu filialning gaz, svet, suv va yoritish xarajatlari</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Yangi to'lov qo'shish
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-5">
          <p className="text-slate-400 text-xs mb-1">Jami hisoblangan</p>
          <p className="text-white text-xl font-bold">{formatMoney(totalAmount)}</p>
        </div>
        <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-5">
          <p className="text-slate-400 text-xs mb-1">To'langan summa</p>
          <p className="text-emerald-400 text-xl font-bold">{formatMoney(paidAmount)}</p>
        </div>
        <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] p-5">
          <p className="text-slate-400 text-xs mb-1">To'lanmagan (Qarz)</p>
          <p className="text-rose-400 text-xl font-bold">{formatMoney(unpaidAmount)}</p>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1630] border border-[#2d2556] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Yangi kommunal to'lov</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Turi</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                >
                  <option value="electricity">Elektr energiyasi (Tok)</option>
                  <option value="gas">Gaz</option>
                  <option value="light">Svet (Yoritish)</option>
                  <option value="water">Suv</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Summa (so'mda)</label>
                <input
                  type="number"
                  required
                  placeholder="Masalan: 350000"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Qaysi oy uchun</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Oktabr 2026"
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                  className="w-full bg-[#0f0c1e] border border-[#2d2556] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#251f47] text-slate-300 text-sm font-semibold hover:text-white transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-900/40"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ro'yxat */}
      <div className="rounded-2xl bg-[#1a1630] border border-[#2d2556] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#2d2556] text-slate-400 text-xs">
              <th className="py-3.5 px-5">To'lov turi</th>
              <th className="py-3.5 px-5">Oy</th>
              <th className="py-3.5 px-5 text-right">Summa</th>
              <th className="py-3.5 px-5 text-center">Holat</th>
              <th className="py-3.5 px-5 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2556]/50">
            {utilities.map(u => {
              const Icon = typeIcons[u.type] || Zap;
              return (
                <tr key={u.id} className="hover:bg-[#201b3d]/50 transition">
                  <td className="py-3.5 px-5 text-white font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                      <Icon size={16} />
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-300 font-mono text-xs">{u.month}</td>
                  <td className="py-3.5 px-5 text-right font-bold text-white">
                    {formatMoney(u.amount)}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <button
                      onClick={() => handleTogglePaid(u.id, u.paid)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                        u.paid
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-700/40'
                          : 'bg-rose-950/40 text-rose-400 border-rose-700/40'
                      }`}
                    >
                      {u.paid ? 'To\'langan' : 'To\'lanmagan'}
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-xs text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-950/40 transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {utilities.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                  Ushbu filialda hozircha kommunal to'lovlar mavjud emas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
