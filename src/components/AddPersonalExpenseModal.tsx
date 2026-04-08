import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, Check,
  UtensilsCrossed, Car, ShoppingBag, Clapperboard, Heart,
  Home, Zap, MoreHorizontal, Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
}

interface AddPersonalExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (expense: {
    amount: number;
    description: string;
    date: string;
    category_id: string | null;
  }) => Promise<void>;
  onAddCategory: (cat: { name: string; color: string; icon: string }) => Promise<Category>;
}

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed, Car, ShoppingBag, Clapperboard, Heart,
  Home, Zap, MoreHorizontal, Tag,
};

const PALETTE = [
  '#f97316', '#e74c3c', '#e91e63', '#9b59b6',
  '#4a6fa5', '#1cc29f', '#f39c12', '#64748b',
];

export function CategoryIcon({ icon, size = 16 }: { icon: string; size?: number }) {
  const Comp = ICON_MAP[icon] ?? Tag;
  return <Comp size={size} />;
}

export function AddPersonalExpenseModal({
  isOpen, onClose, categories, onAdd, onAddCategory,
}: AddPersonalExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New-category sub-form
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PALETTE[0]);
  const [newCatLoading, setNewCatLoading] = useState(false);

  const reset = () => {
    setAmount(''); setDescription(''); setDate(new Date().toISOString().split('T')[0]);
    setCategoryId(null); setError(''); setShowNewCat(false);
    setNewCatName(''); setNewCatColor(PALETTE[0]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError('Enter a valid amount'); return; }
    if (!description.trim()) { setError('Enter a description'); return; }
    setError('');
    setLoading(true);
    try {
      await onAdd({ amount: parsed, description: description.trim(), date, category_id: categoryId });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setNewCatLoading(true);
    try {
      const created = await onAddCategory({ name: newCatName.trim(), color: newCatColor, icon: 'Tag' });
      setCategoryId(created.id);
      setShowNewCat(false);
      setNewCatName(''); setNewCatColor(PALETTE[0]);
    } finally {
      setNewCatLoading(false);
    }
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
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            className="relative bg-[#161b27] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-lg">Add expense</h2>
              <button onClick={handleClose} className="text-white/40 hover:text-white/80 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Amount */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#1cc29f]/50 transition-all text-2xl"
                    min="0.01"
                    step="0.01"
                    autoFocus
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Description</label>
                <input
                  type="text"
                  placeholder="What was this for?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#1cc29f]/50 transition-all text-sm"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#1cc29f]/50 transition-all text-sm [color-scheme:dark]"
                />
              </div>

              {/* Category picker */}
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const active = categoryId === cat.id;
                    return (
                      <motion.button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(active ? null : cat.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border"
                        style={active ? {
                          backgroundColor: `${cat.color}25`,
                          borderColor: `${cat.color}60`,
                          color: cat.color,
                        } : {
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.55)',
                        }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <span style={{ color: active ? cat.color : 'rgba(255,255,255,0.4)' }}>
                          <CategoryIcon icon={cat.icon} size={14} />
                        </span>
                        {cat.name}
                        {active && <Check size={12} />}
                      </motion.button>
                    );
                  })}

                  {/* Add custom category */}
                  <button
                    type="button"
                    onClick={() => setShowNewCat(!showNewCat)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm border border-dashed border-white/15 text-white/35 hover:text-white/60 hover:border-white/25 transition-all"
                  >
                    <Plus size={13} />
                    New
                  </button>
                </div>

                {/* New category inline form */}
                <AnimatePresence>
                  {showNewCat && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleAddCategory} className="mt-3 p-3 bg-white/4 rounded-xl space-y-3">
                        <input
                          type="text"
                          placeholder="Category name"
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#1cc29f]/50"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-xs">Color:</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {PALETTE.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setNewCatColor(c)}
                                className="w-5 h-5 rounded-full transition-all"
                                style={{
                                  backgroundColor: c,
                                  outline: newCatColor === c ? `2px solid ${c}` : 'none',
                                  outlineOffset: 2,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowNewCat(false)}
                            className="flex-1 text-xs text-white/40 py-1.5 rounded-lg hover:text-white/60 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={newCatLoading || !newCatName.trim()}
                            className="flex-1 text-xs bg-[#1cc29f]/15 text-[#1cc29f] py-1.5 rounded-lg hover:bg-[#1cc29f]/25 transition-all disabled:opacity-50"
                          >
                            {newCatLoading ? 'Adding…' : 'Add category'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && <p className="text-[#e74c3c] text-xs">{error}</p>}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 py-3 rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#1cc29f] hover:bg-[#16a589] text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-60 text-sm flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
