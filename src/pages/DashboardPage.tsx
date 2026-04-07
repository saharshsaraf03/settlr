import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, ArrowRight, PlusCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { SettleUpModal } from '../components/SettleUpModal';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, amount, type, delay = 0 }: {
  label: string;
  amount: number;
  type: 'neutral' | 'negative' | 'positive';
  delay?: number;
}) {
  const colors = {
    neutral: 'text-white/70',
    negative: 'text-[#f97316]',
    positive: 'text-[#1cc29f]',
  };
  const icons = {
    neutral: <Minus className="w-4 h-4 text-white/30" />,
    negative: <TrendingDown className="w-4 h-4 text-[#f97316]" />,
    positive: <TrendingUp className="w-4 h-4 text-[#1cc29f]" />,
  };

  return (
    <motion.div
      className="bg-[#161b27] border border-white/8 rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/45 text-sm">{label}</p>
        {icons[type]}
      </div>
      <p className={`text-2xl font-bold ${colors[type]}`}>
        {type === 'neutral' ? (amount < 0 ? '-' : '') : ''}
        ₹{Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </motion.div>
  );
}

export function DashboardPage() {
  const { groups, users, currentUser, getExpensesByGroup, calculateGroupBalances, getTotalBalance } = useApp();
  const navigate = useNavigate();
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleUpOpen, setSettleUpOpen] = useState(false);

  const { totalOwe, totalOwed } = getTotalBalance();
  const totalBalance = totalOwed - totalOwe;

  // Get recent expenses across all groups
  const allExpenses = groups.flatMap(g =>
    getExpensesByGroup(g.id).map(e => ({ ...e, group: g }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <div className="p-5 md:p-7 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-7"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">Welcome back!</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            onClick={() => setAddExpenseOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#f97316]/20"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <PlusCircle className="w-4 h-4" />
            Add an expense
          </motion.button>
          <motion.button
            onClick={() => setSettleUpOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-[#1cc29f]/15 hover:bg-[#1cc29f]/25 text-[#1cc29f] border border-[#1cc29f]/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Settle up
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <StatCard label="Total balance" amount={totalBalance} type={totalBalance >= 0 ? 'positive' : 'negative'} delay={0} />
        <StatCard label="You owe" amount={totalOwe} type="negative" delay={0.1} />
        <StatCard label="You are owed" amount={totalOwed} type="positive" delay={0.2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main expense list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent expenses</h2>
            <div className="flex gap-2">
              <button className="text-white/40 text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                View as list
              </button>
            </div>
          </div>

          {/* Owe / Owed sections */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* You owe */}
            <motion.div
              className="bg-[#161b27] border border-white/8 rounded-2xl p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/60 text-sm uppercase tracking-wider">You owe</h3>
                <TrendingDown className="w-4 h-4 text-[#f97316]" />
              </div>
              {groups.map(group => {
                const balances = calculateGroupBalances(group.id);
                const myBal = balances.find(b => b.userId === currentUser.id);
                if (!myBal || myBal.amount >= 0) return null;
                const creditor = balances.find(b => b.userId !== currentUser.id && b.amount > 0);
                const creditorUser = creditor ? users.find(u => u.id === creditor.userId) : null;
                return (
                  <div key={group.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: creditorUser?.avatarColor || '#555' }}
                    >
                      {creditorUser?.initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{creditorUser?.name || 'Someone'}</p>
                      <p className="text-white/35 text-xs">{group.name}</p>
                    </div>
                    <span className="text-[#f97316] text-sm font-semibold">
                      ₹{Math.abs(myBal.amount).toFixed(0)}
                    </span>
                  </div>
                );
              }).filter(Boolean).slice(0, 3)}
              {totalOwe === 0 && (
                <p className="text-white/25 text-sm py-2">You don't owe anything</p>
              )}
            </motion.div>

            {/* You are owed */}
            <motion.div
              className="bg-[#161b27] border border-white/8 rounded-2xl p-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/60 text-sm uppercase tracking-wider">You are owed</h3>
                <TrendingUp className="w-4 h-4 text-[#1cc29f]" />
              </div>
              {groups.map(group => {
                const balances = calculateGroupBalances(group.id);
                const myBal = balances.find(b => b.userId === currentUser.id);
                if (!myBal || myBal.amount <= 0) return null;
                const debtors = balances.filter(b => b.userId !== currentUser.id && b.amount < 0);
                if (debtors.length === 0) return null;
                const topDebtor = debtors.reduce((a, b) => Math.abs(a.amount) > Math.abs(b.amount) ? a : b);
                const debtorUser = users.find(u => u.id === topDebtor.userId);
                return (
                  <div key={group.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: debtorUser?.avatarColor || '#555' }}
                    >
                      {debtorUser?.initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{debtorUser?.name || 'Someone'}</p>
                      <p className="text-white/35 text-xs">{group.name}</p>
                    </div>
                    <span className="text-[#1cc29f] text-sm font-semibold">
                      ₹{Math.abs(myBal.amount).toFixed(0)}
                    </span>
                  </div>
                );
              }).filter(Boolean).slice(0, 3)}
              {totalOwed === 0 && (
                <p className="text-white/25 text-sm py-2">You are not owed anything</p>
              )}
            </motion.div>
          </div>

          {/* Recent transactions */}
          <div className="bg-[#161b27] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-white font-medium">All recent activity</h3>
            </div>
            <div className="divide-y divide-white/5">
              {allExpenses.map((exp, i) => {
                const payer = users.find(u => u.id === exp.paidBy);
                const myShare = exp.splits.find(s => s.userId === currentUser.id);
                const iAmPayer = exp.paidBy === currentUser.id;
                const CATEGORY_EMOJI: Record<string, string> = {
                  food: '🍽️', transport: '🚗', accommodation: '🏨',
                  entertainment: '🎬', utilities: '💡', shopping: '🛍️', other: '📝',
                };

                return (
                  <motion.div
                    key={exp.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                  >
                    <div className="flex flex-col items-center text-white/30 text-xs w-8 flex-shrink-0 text-center">
                      <span className="uppercase">{new Date(exp.date).toLocaleString('en', { month: 'short' })}</span>
                      <span className="text-sm font-medium text-white/50">{new Date(exp.date).getDate()}</span>
                    </div>
                    <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {CATEGORY_EMOJI[exp.category] || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/85 text-sm font-medium truncate">{exp.description}</p>
                      <p className="text-white/35 text-xs">
                        {iAmPayer ? 'You paid' : `${payer?.name} paid`} · {exp.group.name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white/50 text-xs">₹{exp.amount.toLocaleString('en-IN')}</p>
                      {myShare && !iAmPayer && (
                        <p className="text-[#f97316] text-xs font-medium">you owe ₹{myShare.amount.toFixed(0)}</p>
                      )}
                      {iAmPayer && myShare && (
                        <p className="text-[#1cc29f] text-xs font-medium">
                          you lent ₹{(exp.amount - myShare.amount).toFixed(0)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel - Groups summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Your groups</h2>
          </div>

          {groups.map((group, i) => {
            const balances = calculateGroupBalances(group.id);
            const myBal = balances.find(b => b.userId === currentUser.id);
            const expenses = getExpensesByGroup(group.id);
            const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);

            return (
              <motion.div
                key={group.id}
                className="bg-[#161b27] border border-white/8 rounded-2xl p-4 cursor-pointer hover:border-white/15 transition-all group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => navigate(`/groups/${group.id}`)}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${group.color}20`, border: `1px solid ${group.color}30` }}
                    >
                      {group.emoji}
                    </div>
                    <div>
                      <p className="text-white/85 text-sm font-medium">{group.name}</p>
                      <p className="text-white/35 text-xs">{group.members.length} members</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/30 text-xs">Total spent</p>
                    <p className="text-white/70 text-sm font-medium">₹{totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                  {myBal && myBal.amount !== 0 && (
                    <div className="text-right">
                      <p className="text-white/30 text-xs">{myBal.amount > 0 ? 'You are owed' : 'You owe'}</p>
                      <p className={`text-sm font-semibold ${myBal.amount > 0 ? 'text-[#1cc29f]' : 'text-[#f97316]'}`}>
                        ₹{Math.abs(myBal.amount).toFixed(0)}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AddExpenseModal isOpen={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} />
      <SettleUpModal isOpen={settleUpOpen} onClose={() => setSettleUpOpen(false)} />
    </div>
  );
}
