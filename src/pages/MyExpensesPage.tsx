import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  AddPersonalExpenseModal,
  CategoryIcon,
  type Category,
} from '@/components/AddPersonalExpenseModal';

interface PersonalExpense {
  id: string;
  amount: number;
  currency: string;
  description: string;
  category_id: string | null;
  date: string;
  created_at: string;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
}

function prevMonth(key: string) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return monthKey(d);
}

function nextMonth(key: string) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1);
  return monthKey(d);
}

export function MyExpensesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [filterCatId, setFilterCatId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const thisMonth = monthKey(new Date());

  // ── Fetch categories ──────────────────────────────────────────────────────
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['personal_categories', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user!.id}`)
        .order('is_default', { ascending: false })
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
  });

  // ── Fetch expenses for the selected month ────────────────────────────────
  const [year, mon] = month.split('-').map(Number);
  const dateFrom = `${year}-${String(mon).padStart(2, '0')}-01`;
  const dateTo = new Date(year, mon, 0).toISOString().split('T')[0]; // last day

  const { data: expenses = [], isLoading } = useQuery<PersonalExpense[]>({
    queryKey: ['personal_expenses', user?.id, month],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_expenses')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PersonalExpense[];
    },
  });

  // ── Add expense ──────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async (payload: {
      amount: number; description: string; date: string; category_id: string | null;
    }) => {
      const { error } = await supabase.from('personal_expenses').insert({
        user_id: user!.id,
        amount: payload.amount,
        currency: 'INR',
        description: payload.description,
        category_id: payload.category_id,
        date: payload.date,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_expenses'] }),
  });

  // ── Delete expense ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personal_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_expenses'] }),
  });

  // ── Add custom category ──────────────────────────────────────────────────
  const addCategoryMutation = useMutation({
    mutationFn: async (cat: { name: string; color: string; icon: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ user_id: user!.id, ...cat, is_default: false })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_categories'] }),
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = filterCatId
    ? expenses.filter(e => e.category_id === filterCatId)
    : expenses;

  const monthlyTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // Group filtered expenses by date
  const byDate: Record<string, PersonalExpense[]> = {};
  for (const exp of filtered) {
    if (!byDate[exp.date]) byDate[exp.date] = [];
    byDate[exp.date].push(exp);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ── */}
      <div className="px-5 py-5 border-b border-white/5 bg-[#0d111a] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">My Expenses</h1>
            <p className="text-white/40 text-sm mt-0.5">Personal spending tracker</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                filterCatId
                  ? 'bg-[#1cc29f]/15 border-[#1cc29f]/30 text-[#1cc29f]'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <motion.button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#f97316]/15"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add expense</span>
            </motion.button>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth(prevMonth(month))}
            className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-white font-semibold text-sm">{monthLabel(month)}</p>
          </div>
          <button
            onClick={() => setMonth(nextMonth(month))}
            disabled={month >= thisMonth}
            className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Category filter chips */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                <button
                  onClick={() => setFilterCatId(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    !filterCatId
                      ? 'bg-white/15 border-white/25 text-white'
                      : 'bg-white/5 border-white/8 text-white/50 hover:text-white/70'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCatId(filterCatId === cat.id ? null : cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                    style={filterCatId === cat.id ? {
                      backgroundColor: `${cat.color}20`,
                      borderColor: `${cat.color}50`,
                      color: cat.color,
                    } : {
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <CategoryIcon icon={cat.icon} size={12} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Monthly summary card ── */}
      <div className="px-5 pt-5">
        <div className="bg-gradient-to-br from-[#1cc29f]/15 to-[#1cc29f]/5 border border-[#1cc29f]/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
              {filterCatId ? `${catMap[filterCatId]?.name ?? 'Category'} · ` : ''}{monthLabel(month)}
            </p>
            <p className="text-white text-3xl font-bold">
              ₹{(filterCatId
                ? filtered.reduce((s, e) => s + Number(e.amount), 0)
                : monthlyTotal
              ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-white/35 text-xs mt-1">
              {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
              {filterCatId && <span> · <button className="text-[#1cc29f] hover:underline" onClick={() => setFilterCatId(null)}>Clear filter <X className="w-3 h-3 inline" /></button></span>}
            </p>
          </div>
          <div className="text-4xl opacity-20 select-none">₹</div>
        </div>
      </div>

      {/* ── Expense list ── */}
      <div className="px-5 py-4 flex-1">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-white/4 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : Object.keys(byDate).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl">💸</div>
            <p className="text-white/40 text-sm">No expenses {filterCatId ? 'in this category' : 'this month'}</p>
            <button
              onClick={() => setAddOpen(true)}
              className="text-[#1cc29f] text-sm hover:underline"
            >
              Add your first one
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(byDate).map(([date, exps]) => {
              const d = new Date(date + 'T00:00:00');
              const dayTotal = exps.reduce((s, e) => s + Number(e.amount), 0);
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/40 text-xs font-medium">
                      {d.toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-white/30 text-xs">₹{dayTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-2">
                    {exps.map((exp, i) => {
                      const cat = exp.category_id ? catMap[exp.category_id] : null;
                      return (
                        <motion.div
                          key={exp.id}
                          className="flex items-center gap-3 bg-[#161b27] hover:bg-[#1a2032] border border-white/6 rounded-2xl px-4 py-3 transition-all group"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          {/* Category chip */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: cat ? `${cat.color}20` : 'rgba(255,255,255,0.06)',
                              color: cat?.color ?? 'rgba(255,255,255,0.4)',
                            }}
                          >
                            <CategoryIcon icon={cat?.icon ?? 'Tag'} size={18} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white/85 text-sm font-medium truncate">{exp.description}</p>
                            {cat && (
                              <p className="text-xs mt-0.5" style={{ color: `${cat.color}99` }}>{cat.name}</p>
                            )}
                          </div>

                          {/* Amount */}
                          <p className="text-white/80 text-sm font-semibold flex-shrink-0">
                            ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>

                          {/* Delete */}
                          <button
                            onClick={() => deleteMutation.mutate(exp.id)}
                            disabled={deleteMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-white/25 hover:text-[#e74c3c] transition-all flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddPersonalExpenseModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
        onAdd={async payload => { await addMutation.mutateAsync(payload); }}
        onAddCategory={async cat => addCategoryMutation.mutateAsync(cat)}
      />
    </div>
  );
}
