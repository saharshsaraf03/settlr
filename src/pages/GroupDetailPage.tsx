import { useState } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Settings, List, BarChart2, Calendar, MessageCircle, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { SettleUpModal } from '../components/SettleUpModal';

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
  const [settleTarget, setSettleTarget] = useState<{ userId: string; amount: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'balances'>('list');
  const [simplifyDebts, setSimplifyDebts] = useState(true);

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

  const handleSettleWithUser = (userId: string, amount: number) => {
    setSettleTarget({ userId, amount });
    setSettleUpOpen(true);
  };

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
          </div>
        ) : (
          // Balances tab
          <div className="px-5 py-4">
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
            {balances
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
              })}
          </div>

          {/* View details link */}
          <button className="mt-5 text-[#1cc29f] text-sm hover:underline w-full text-left">
            View details »
          </button>

          {/* Members section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white/50 text-xs uppercase tracking-wider">Members</h3>
              <button className="text-[#1cc29f] text-xs hover:underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {groupMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.initials[0]}
                  </div>
                  <span className="text-white/60 text-sm">{m.id === currentUser.id ? 'You' : m.name}</span>
                  {m.id === currentUser.id && (
                    <span className="text-white/20 text-xs">(you)</span>
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
        defaultAmount={settleTarget?.amount || 0}
      />
    </div>
  );
}
