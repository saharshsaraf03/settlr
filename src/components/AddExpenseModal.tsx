import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Calendar, Users, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ExpenseCategory } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupId?: string;
}

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏨',
  entertainment: '🎬',
  utilities: '💡',
  shopping: '🛍️',
  other: '📝',
};

type SplitType = 'equal' | 'exact' | 'percentage';

export function AddExpenseModal({ isOpen, onClose, defaultGroupId }: AddExpenseModalProps) {
  const { groups, users, addExpense, currentUser } = useApp();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [groupId, setGroupId] = useState(defaultGroupId || groups[0]?.id || '');
  const [paidBy, setPaidBy] = useState(currentUser.id);
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [exactSplits, setExactSplits] = useState<Record<string, string>>({});
  const [percentSplits, setPercentSplits] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedGroup = groups.find(g => g.id === groupId);
  const groupMembers = users.filter(u => selectedGroup?.members.includes(u.id));

  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const total = parseFloat(amount) || 0;

  const getEqualSplit = () => total / (groupMembers.length || 1);

  const exactTotal = Object.values(exactSplits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const percentTotal = Object.values(percentSplits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  const getSplits = () => {
    if (splitType === 'equal') {
      const each = getEqualSplit();
      return groupMembers.map(m => ({ userId: m.id, amount: each }));
    }
    if (splitType === 'exact') {
      return groupMembers.map(m => ({ userId: m.id, amount: parseFloat(exactSplits[m.id] || '0') }));
    }
    // percentage
    return groupMembers.map(m => ({
      userId: m.id,
      amount: total * (parseFloat(percentSplits[m.id] || '0') / 100),
    }));
  };

  const isValidSplit = () => {
    if (splitType === 'equal') return true;
    if (splitType === 'exact') return Math.abs(exactTotal - total) < 0.01;
    return Math.abs(percentTotal - 100) < 0.01;
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setExactSplits({});
    setPercentSplits({});
    setSplitType('equal');
    setError('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!description || !amount || !groupId || !isValidSplit()) return;
    setLoading(true);
    setError('');
    addExpense(
      {
        description,
        amount: total,
        currency,
        paidBy,
        date,
        category,
        splits: getSplits(),
        groupId,
      },
      (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || 'Failed to add expense');
        setLoading(false);
      }
    );
    // Optimistically close — onSuccess invalidates queries and UI updates
    setLoading(false);
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative bg-[#161b27] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#f97316]/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#f97316]" />
                </div>
                <h2 className="text-white font-semibold text-lg">Add an expense</h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Group selector */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">Group</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <select
                    value={groupId}
                    onChange={e => setGroupId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-2.5 text-white appearance-none focus:outline-none focus:border-[#1cc29f]/50 transition-all cursor-pointer"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id} className="bg-[#1a2332]">
                        {g.emoji} {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  placeholder="What's this expense for?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#1cc29f]/50 transition-all"
                  required
                />
              </div>

              {/* Amount + Currency toggle */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">Amount</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-lg">{currencySymbol}</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#1cc29f]/50 transition-all text-lg"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-w-[70px] justify-center"
                  >
                    {currency === 'INR' ? '₹ INR' : '$ USD'}
                  </button>
                </div>
              </div>

              {/* Split type tabs */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">Split type</label>
                <div className="flex bg-white/5 rounded-xl p-1">
                  {(['equal', 'exact', 'percentage'] as SplitType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSplitType(type)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                        splitType === type
                          ? 'bg-[#1cc29f] text-white shadow-sm'
                          : 'text-white/50 hover:text-white/70'
                      }`}
                    >
                      {type === 'percentage' ? '%' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split details based on type */}
              {total > 0 && groupMembers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-2"
                >
                  {splitType === 'equal' && (
                    <>
                      <p className="text-white/50 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Split equally — {currencySymbol}{getEqualSplit().toFixed(2)}/person
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {groupMembers.map(m => (
                          <div key={m.id} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: m.avatarColor }}>
                              {m.initials[0]}
                            </div>
                            <span className="text-white/60 text-xs">{m.id === currentUser.id ? 'You' : m.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {splitType === 'exact' && (
                    <>
                      <p className="text-white/50 text-xs mb-2">Enter exact amounts per person</p>
                      {groupMembers.map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: m.avatarColor }}>
                            {m.initials[0]}
                          </div>
                          <span className="text-white/60 text-xs w-20 truncate">{m.id === currentUser.id ? 'You' : m.name}</span>
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30 text-xs">{currencySymbol}</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={exactSplits[m.id] || ''}
                              onChange={e => setExactSplits(prev => ({ ...prev, [m.id]: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg pl-5 pr-2 py-1 text-white text-xs focus:outline-none focus:border-[#1cc29f]/50"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      ))}
                      <div className={`flex justify-between text-xs mt-1 ${Math.abs(exactTotal - total) < 0.01 ? 'text-[#1cc29f]' : 'text-[#f97316]'}`}>
                        <span>Total assigned: {currencySymbol}{exactTotal.toFixed(2)}</span>
                        <span>Remaining: {currencySymbol}{(total - exactTotal).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {splitType === 'percentage' && (
                    <>
                      <p className="text-white/50 text-xs mb-2">Enter percentage per person (must sum to 100%)</p>
                      {groupMembers.map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: m.avatarColor }}>
                            {m.initials[0]}
                          </div>
                          <span className="text-white/60 text-xs w-20 truncate">{m.id === currentUser.id ? 'You' : m.name}</span>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              placeholder="0"
                              value={percentSplits[m.id] || ''}
                              onChange={e => setPercentSplits(prev => ({ ...prev, [m.id]: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg pl-2 pr-5 py-1 text-white text-xs focus:outline-none focus:border-[#1cc29f]/50"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-xs">%</span>
                          </div>
                          <span className="text-white/40 text-xs w-16 text-right">{currencySymbol}{(total * (parseFloat(percentSplits[m.id] || '0') / 100)).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className={`flex justify-between text-xs mt-1 ${Math.abs(percentTotal - 100) < 0.01 ? 'text-[#1cc29f]' : 'text-[#f97316]'}`}>
                        <span>Total: {percentTotal.toFixed(1)}%</span>
                        <span>{Math.abs(percentTotal - 100) < 0.01 ? '✓ Valid' : `${(100 - percentTotal).toFixed(1)}% remaining`}</span>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Category */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        category === cat
                          ? 'bg-[#1cc29f] text-white'
                          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                      }`}
                    >
                      <span>{CATEGORY_ICONS[cat]}</span>
                      <span className="capitalize">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid by */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">Paid by</label>
                <div className="relative">
                  <select
                    value={paidBy}
                    onChange={e => setPaidBy(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-8 py-2.5 text-white appearance-none focus:outline-none focus:border-[#1cc29f]/50 transition-all cursor-pointer"
                  >
                    {groupMembers.map(u => (
                      <option key={u.id} value={u.id} className="bg-[#1a2332]">
                        {u.id === currentUser.id ? 'You' : u.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#1cc29f]/50 transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-center" style={{ color: '#FF6B6B' }}>{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={loading || (total > 0 && !isValidSplit())}
                  className="flex-1 bg-[#f97316] hover:bg-[#ea6c0a] text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-70"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Adding...</span>
                    </div>
                  ) : 'Add expense'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
