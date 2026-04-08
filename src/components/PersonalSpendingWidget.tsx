import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CategoryIcon } from '@/components/AddPersonalExpenseModal';
import type { Category } from '@/components/AddPersonalExpenseModal';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PURPLE = '#8B5CF6';

interface PersonalExpense {
  id: string;
  amount: number;
  description: string;
  category_id: string | null;
  date: string;
}

function monthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
  return { from, to, label: now.toLocaleString('en', { month: 'long', year: 'numeric' }) };
}

// Custom tooltip for the donut chart
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { color } } = payload[0];
  return (
    <div className="bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="font-medium" style={{ color }}>{name}</p>
      <p className="text-white/70 mt-0.5">₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
    </div>
  );
}

export function PersonalSpendingWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { from, to, label } = monthRange();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['personal_categories', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
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

  const { data: expenses = [], isLoading } = useQuery<PersonalExpense[]>({
    queryKey: ['personal_expenses_widget', user?.id, from],
    enabled: !!user,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_expenses')
        .select('id, amount, description, category_id, date')
        .eq('user_id', user!.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PersonalExpense[];
    },
  });

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Aggregate spending by category for the donut
  const byCategory: Record<string, { name: string; value: number; color: string; icon: string }> = {};
  for (const exp of expenses) {
    const cat = exp.category_id ? catMap[exp.category_id] : null;
    const key = cat?.id ?? '__none__';
    if (!byCategory[key]) {
      byCategory[key] = {
        name: cat?.name ?? 'Other',
        value: 0,
        color: cat?.color ?? '#64748b',
        icon: cat?.icon ?? 'MoreHorizontal',
      };
    }
    byCategory[key].value += Number(exp.amount);
  }
  const chartData = Object.values(byCategory)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // cap at 6 slices for readability

  const recent = expenses.slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-[#161b27] border border-white/8 rounded-2xl p-4 space-y-3">
        <div className="h-4 w-32 bg-white/8 rounded animate-pulse" />
        <div className="h-36 bg-white/4 rounded-xl animate-pulse" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-white/4 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[#161b27] border rounded-2xl p-4 cursor-pointer hover:border-white/15 transition-all"
      style={{ borderColor: `${PURPLE}25` }}
      onClick={() => navigate('/expenses')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white/85 text-sm font-semibold">My spending</p>
          <p className="text-white/35 text-xs">{label}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-lg" style={{ color: PURPLE }}>
            ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <ArrowRight className="w-4 h-4 text-white/20" />
        </div>
      </div>

      {totalSpent === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <p className="text-white/25 text-sm">No personal expenses this month</p>
        </div>
      ) : (
        <>
          {/* Donut chart + legend */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0" style={{ width: 100, height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    dataKey="value"
                    strokeWidth={0}
                    paddingAngle={chartData.length > 1 ? 2 : 0}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {chartData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <p className="text-white/55 text-xs truncate flex-1">{entry.name}</p>
                  <p className="text-white/70 text-xs font-medium flex-shrink-0">
                    ₹{entry.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          {recent.length > 0 && <div className="h-px bg-white/5 mb-3" />}

          {/* Last 3 expenses */}
          <div className="space-y-1.5">
            {recent.map(exp => {
              const cat = exp.category_id ? catMap[exp.category_id] : null;
              return (
                <div key={exp.id} className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: cat ? `${cat.color}20` : 'rgba(255,255,255,0.06)',
                      color: cat?.color ?? 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <CategoryIcon icon={cat?.icon ?? 'Tag'} size={12} />
                  </div>
                  <p className="text-white/60 text-xs flex-1 truncate">{exp.description}</p>
                  <p className="text-white/70 text-xs font-medium flex-shrink-0">
                    ₹{Number(exp.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
