import { useState } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Settings, List, BarChart2, Calendar, MessageCircle, Check, ArrowRight, Link2, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { SettleUpModal } from '../components/SettleUpModal';
import { balancesToTransactions } from '../lib/debtSimplify';

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍽️', transport: '🚗', accommodation: '🏨',
  entertainment: '🎬', utilities: '💡', shopping: '🛍️', other: '📝',
};

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getGroupById, getExpensesByGroup, calculateGroupBalances, users, currentUser } = useApp();
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ userId: string; amount: number; fromUserId?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'balances'>('list');
  const [simplifyDebts, setSimplifyDebts] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const group = getGroupById(id || '');

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-white/50 text-lg">Group not found</p>
          <button onClick={() => navigate('/dashboard')} className="text-[#1cc29f] mt-2">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const expenses = getExpensesByGroup(group.id);
  const balances = calculateGroupBalances(group.id);
  const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);

  const groupMembers = users.filter(u => group.members.includes(u.id));

  // Group expenses by month
  const expensesByMonth: Record<string, typeof expenses> = {};
  expenses.forEach(exp => {
    const key = new Date(exp.date).toLocaleString('en', { month: 'long', year: 'numeric' });
    if (!expensesByMonth[key]) expensesByMonth[key] = [];
    expensesByMonth[key].push(exp);
  });

  const inviteLink = group.invite_code
    ? `${window.location.origin}/join/${group.invite_code}`
    : null;

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied!', { description: 'Share it with anyone you want to add to this group.' });
  };

  const handleSettleWithUser = (userId: string, amount: number, fromUserId?: string) => {
    setSettleTarget({ userId, amount, fromUserId });
    setSettleUpOpen(true);
  };

  const simplifiedTransactions = balancesToTransactions(balances);

  // Monthly spending data for the line chart
  const monthlySpending = (() => {
    const byMonth: Record<string, number> = {};
    expenses.forEach(exp => {
      const d = new Date(exp.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] ?? 0) + exp.amount;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => ({
        month: new Date(key + '-01').toLocaleString('en', { month: 'short', year: '2-digit' }),
        total: Math.round(total),
      }));
  })();

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Group header */}
        <div className="px-5 py-5 border-b border-white/5 bg-[#0d111a] sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-white/40 hover:text-white/70 transition-colors lg:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                style={{ backgroundColor: `${group.color}25`, border: `1px solid ${group.color}40` }}
              >
                {group.emoji}
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">{group.name}</h1>
                <p className="text-white/40 text-sm">{group.members.length} people · ₹{totalSpent.toLocaleString('en-IN')} total</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setAddExpenseOpen(true)}
                className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#f97316]/15"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add expense</span>
              </motion.button>
              <motion.button
                onClick={() => setSettleUpOpen(true)}
                className="flex items-center gap-2 bg-[#1cc29f]/15 hover:bg-[#1cc29f]/25 text-[#1cc29f] border border-[#1cc29f]/30 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Settle up
              </motion.button>
              {inviteLink && (
                <motion.button
                  onClick={copyInviteLink}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/85 border border-white/8 px-3 py-2 rounded-xl text-sm transition-all"
                  title="Copy invite link"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Invite</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 mt-4 bg-white/5 rounded-xl p-1 w-fit">
            {[
              { key: 'list', icon: <List className="w-4 h-4" />, label: 'Expenses' },
              { key: 'balances', icon: <BarChart2 className="w-4 h-4" />, label: 'Balances' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'list' | 'balances')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#1cc29f] text-white shadow-sm'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'list' ? (
          <div className="px-5 py-4">
            {Object.entries(expensesByMonth).map(([month, exps]) => (
              <div key={month} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/50 text-xs uppercase tracking-wider font-medium">{month}</h3>
                  <p className="text-white/30 text-xs">
                    ₹{exps.reduce((acc, e) => acc + e.amount, 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="space-y-2">
                  {exps.map((exp, i) => {
                    const payer = users.find(u => u.id === exp.paidBy);
                    const myShare = exp.splits.find(s => s.userId === currentUser.id);
                    const iAmPayer = exp.paidBy === currentUser.id;
                    const iAmInvolved = myShare !== undefined;

                    return (
                      <motion.div
                        key={exp.id}
                        className="flex items-center gap-4 bg-[#161b27] hover:bg-[#1a2032] border border-white/6 rounded-2xl px-4 py-3 transition-all group cursor-pointer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.005 }}
                      >
                        {/* Date */}
                        <div className="flex flex-col items-center text-white/30 text-xs w-8 flex-shrink-0 text-center">
                          <span className="uppercase text-[10px]">{new Date(exp.date).toLocaleString('en', { month: 'short' })}</span>
                          <span className="text-sm font-medium text-white/50">{new Date(exp.date).getDate()}</span>
                        </div>

                        {/* Category icon */}
                        <div className="w-10 h-10 bg-white/5 border border-white/8 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                          {CATEGORY_EMOJI[exp.category]}
                        </div>

                        {/* Description */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 text-sm font-medium truncate">{exp.description}</p>
                          <p className="text-white/35 text-xs mt-0.5">
                            {iAmPayer ? 'You paid' : `${payer?.name} paid`}
                            {' '}· ₹{exp.amount.toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* Who paid indicator */}
                        <div className="hidden sm:flex items-center gap-1.5 text-white/35 text-xs">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                            style={{ backgroundColor: payer?.avatarColor || '#555' }}
                          >
                            {payer?.initials?.[0] || '?'}
                          </div>
                          <span>paid ₹{exp.amount.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Your share */}
                        <div className="text-right flex-shrink-0 min-w-[90px]">
                          {!iAmInvolved ? (
                            <p className="text-white/25 text-xs">not involved</p>
                          ) : iAmPayer ? (
                            <>
                              <p className="text-white/30 text-[10px]">you lent</p>
                              <p className="text-[#1cc29f] text-sm font-semibold">
                                ₹{(exp.amount - (myShare?.amount || 0)).toFixed(2)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-white/30 text-[10px]">you borrowed</p>
                              <p className="text-[#f97316] text-sm font-semibold">
                                ₹{(myShare?.amount || 0).toFixed(2)}
                              </p>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {expenses.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">{group.emoji}</div>
                <p className="text-white/40 text-lg mb-2">No expenses yet</p>
                <p className="text-white/25 text-sm mb-6">Add your first expense to get started</p>
                <button
                  onClick={() => setAddExpenseOpen(true)}
                  className="bg-[#f97316] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#ea6c0a] transition-colors"
                >
                  Add first expense
                </button>
              </div>
            )}

            {/* Group spending trend — only show when 2+ months of data */}
            {monthlySpending.length >= 2 && (
              <motion.div
                className="mt-6 bg-[#161b27] border border-white/8 rounded-2xl p-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-sm font-semibold">Spending trend</p>
                    <p className="text-white/35 text-xs">Monthly group total</p>
                  </div>
                  <div
                    className="text-xs font-medium px-2 py-1 rounded-lg"
                    style={{ backgroundColor: `${group.color}18`, color: group.color }}
                  >
                    {monthlySpending.length} months
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={monthlySpending} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
                            <p className="text-white/50 mb-0.5">{label}</p>
                            <p className="font-semibold" style={{ color: group.color }}>
                              ₹{Number(payload[0].value).toLocaleString('en-IN')}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke={group.color}
                      strokeWidth={2}
                      dot={{ fill: group.color, strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>
        ) : (
          // Balances tab
          <div className="px-5 py-4 space-y-4">
            {simplifyDebts && simplifiedTransactions.length > 0 ? (
              <>
                <p className="text-white/35 text-xs uppercase tracking-wider">Simplified · {simplifiedTransactions.length} payment{simplifiedTransactions.length !== 1 ? 's' : ''}</p>
                {simplifiedTransactions.map((tx, i) => {
                  const fromUser = users.find(u => u.id === tx.from);
                  const toUser = users.find(u => u.id === tx.to);
                  const involveMe = tx.from === currentUser.id || tx.to === currentUser.id;
                  return (
                    <motion.div
                      key={i}
                      className={`flex items-center gap-4 rounded-2xl px-4 py-3 border transition-all ${
                        involveMe
                          ? 'bg-[#1cc29f]/8 border-[#1cc29f]/20'
                          : 'bg-[#161b27] border-white/6'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: fromUser?.avatarColor }}
                      >
                        {fromUser?.initials}
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: toUser?.avatarColor }}
                      >
                        {toUser?.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm">
                          <span className="font-medium">{tx.from === currentUser.id ? 'You' : fromUser?.name}</span>
                          <span className="text-white/40"> pays </span>
                          <span className="font-medium">{tx.to === currentUser.id ? 'you' : toUser?.name}</span>
                        </p>
                        <p className={`text-sm font-semibold ${involveMe ? 'text-[#1cc29f]' : 'text-white/60'}`}>
                          ₹{tx.amount.toFixed(2)}
                        </p>
                      </div>
                      {(tx.from === currentUser.id || tx.to === currentUser.id) && (
                        <button
                          onClick={() => handleSettleWithUser(tx.to, tx.amount, tx.from)}
                          className="text-xs bg-[#1cc29f]/10 hover:bg-[#1cc29f]/20 text-[#1cc29f] px-3 py-1.5 rounded-lg border border-[#1cc29f]/20 transition-all flex-shrink-0"
                        >
                          Settle
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {groupMembers.map((member, i) => {
                  const bal = balances.find(b => b.userId === member.id);
                  const amount = bal?.amount || 0;
                  return (
                    <motion.div
                      key={member.id}
                      className="bg-[#161b27] border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                          style={{ backgroundColor: member.avatarColor }}
                        >
                          {member.initials}
                        </div>
                        <div>
                          <p className="text-white/85 font-medium text-sm">{member.id === currentUser.id ? 'You' : member.name}</p>
                          <p className="text-white/35 text-xs">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {Math.abs(amount) < 0.01 ? (
                          <div className="flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-[#1cc29f]" />
                            <span className="text-white/40 text-sm">settled up</span>
                          </div>
                        ) : amount > 0 ? (
                          <div>
                            <p className="text-white/35 text-xs">gets back</p>
                            <p className="text-[#1cc29f] font-semibold">₹{amount.toFixed(2)}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-white/35 text-xs">owes</p>
                            <p className="text-[#f97316] font-semibold">₹{Math.abs(amount).toFixed(2)}</p>
                          </div>
                        )}
                        {member.id !== currentUser.id && Math.abs(amount) > 0.01 && (
                          <button
                            onClick={() => handleSettleWithUser(member.id, Math.abs(amount))}
                            className="text-xs bg-[#1cc29f]/10 hover:bg-[#1cc29f]/20 text-[#1cc29f] px-3 py-1.5 rounded-lg border border-[#1cc29f]/20 transition-all"
                          >
                            Settle
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            {simplifyDebts && simplifiedTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Check className="w-10 h-10 text-[#1cc29f]" />
                <p className="text-white/50 text-sm">Everyone is settled up</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel - Group Balances summary */}
      <div className="w-full lg:w-72 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 bg-[#0d111a] overflow-y-auto">
        <div className="p-5">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <button className="w-8 h-8 bg-white/8 hover:bg-white/12 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 transition-all">
              <List className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 bg-white/5 hover:bg-white/8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-all">
              <Calendar className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 bg-white/5 hover:bg-white/8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-all">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 bg-white/5 hover:bg-white/8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-all">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 bg-white/5 hover:bg-white/8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-all">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Group Balances</h3>

          {/* Simplify toggle */}
          <div
            className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 mb-4 cursor-pointer select-none"
            onClick={() => setSimplifyDebts(!simplifyDebts)}
          >
            <span className="text-white/50 text-xs flex-1">Simplify debts is</span>
            <span className={`text-xs font-bold ${simplifyDebts ? 'text-[#1cc29f]' : 'text-white/30'}`}>
              {simplifyDebts ? 'ON' : 'OFF'}
            </span>
            <div className={`w-8 h-4 rounded-full transition-colors relative ${simplifyDebts ? 'bg-[#1cc29f]' : 'bg-white/15'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${simplifyDebts ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
          </div>

          {/* Balance list */}
          <div className="space-y-3">
            {simplifyDebts ? (
              simplifiedTransactions.length === 0 ? (
                <div className="flex items-center gap-2 text-white/30 text-xs py-2">
                  <Check className="w-4 h-4 text-[#1cc29f]" />
                  Everyone is settled up
                </div>
              ) : (
                simplifiedTransactions.map((tx, i) => {
                  const fromUser = users.find(u => u.id === tx.from);
                  const toUser = users.find(u => u.id === tx.to);
                  return (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: fromUser?.avatarColor }}
                      >
                        {fromUser?.initials?.[0]}
                      </div>
                      <ArrowRight className="w-3 h-3 text-white/25 flex-shrink-0" />
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: toUser?.avatarColor }}
                      >
                        {toUser?.initials?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-xs truncate">
                          {tx.from === currentUser.id ? 'You' : fromUser?.name}
                          {' → '}
                          {tx.to === currentUser.id ? 'you' : toUser?.name}
                        </p>
                        <p className="text-[#1cc29f] text-xs font-medium">₹{tx.amount.toFixed(2)}</p>
                      </div>
                      {(tx.from === currentUser.id || tx.to === currentUser.id) && (
                        <button
                          onClick={() => handleSettleWithUser(tx.to, tx.amount, tx.from)}
                          className="w-7 h-7 bg-white/5 hover:bg-[#1cc29f]/20 rounded-lg flex items-center justify-center text-white/30 hover:text-[#1cc29f] transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  );
                })
              )
            ) : (
              balances
                .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                .map((bal, i) => {
                  const user = users.find(u => u.id === bal.userId);
                  if (!user) return null;
                  return (
                    <motion.div
                      key={bal.userId}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">
                          {bal.userId === currentUser.id ? 'You' : user.name}
                        </p>
                        {Math.abs(bal.amount) < 0.01 ? (
                          <p className="text-white/30 text-xs">settled up</p>
                        ) : bal.amount > 0 ? (
                          <p className="text-[#1cc29f] text-xs font-medium">
                            gets back ₹{bal.amount.toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-[#f97316] text-xs font-medium">
                            owes ₹{Math.abs(bal.amount).toFixed(2)}
                          </p>
                        )}
                      </div>
                      {bal.userId !== currentUser.id && Math.abs(bal.amount) > 0.01 && (
                        <button
                          onClick={() => handleSettleWithUser(bal.userId, Math.abs(bal.amount))}
                          className="w-7 h-7 bg-white/5 hover:bg-[#1cc29f]/20 rounded-lg flex items-center justify-center text-white/30 hover:text-[#1cc29f] transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  );
                })
            )}
          </div>

          {/* View details link */}
          <button className="mt-5 text-[#1cc29f] text-sm hover:underline w-full text-left">
            View details »
          </button>

          {/* Members section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white/50 text-xs uppercase tracking-wider">Members</h3>
              {inviteLink && (
                <button
                  onClick={() => setInviteOpen(!inviteOpen)}
                  className="text-[#1cc29f] text-xs hover:underline flex items-center gap-1"
                >
                  {inviteOpen ? <X className="w-3 h-3" /> : '+ Add'}
                </button>
              )}
            </div>

            {/* Invite link panel */}
            {inviteOpen && inviteLink && (
              <motion.div
                className="mb-3 bg-white/4 rounded-xl p-3 border border-white/8"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-white/50 text-xs mb-2">Share this link to invite someone:</p>
                <div className="flex items-center gap-2 bg-[#0d111a] rounded-lg px-2.5 py-2 border border-white/8">
                  <p className="text-white/40 text-[10px] flex-1 truncate font-mono">{inviteLink}</p>
                  <button
                    onClick={copyInviteLink}
                    className="flex items-center gap-1 text-[#1cc29f] hover:text-[#1aad8e] text-xs font-medium flex-shrink-0 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              {groupMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.initials[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm truncate">{m.name}</p>
                  </div>
                  {m.id === currentUser.id && (
                    <span className="text-white/25 text-[10px] flex-shrink-0">you</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddExpenseModal isOpen={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} defaultGroupId={group.id} />
      <SettleUpModal
        isOpen={settleUpOpen}
        onClose={() => { setSettleUpOpen(false); setSettleTarget(null); }}
        groupId={group.id}
        defaultToUserId={settleTarget?.userId}
        defaultFromUserId={settleTarget?.fromUserId}
        defaultAmount={settleTarget?.amount || 0}
      />
    </div>
  );
}
