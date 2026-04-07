import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
  defaultToUserId?: string;
  defaultAmount?: number;
}

export function SettleUpModal({ isOpen, onClose, groupId, defaultToUserId, defaultAmount = 0 }: SettleUpModalProps) {
  const { users, currentUser, groups, settleUp } = useApp();
  const [toUserId, setToUserId] = useState(defaultToUserId || '');
  const [amount, setAmount] = useState(defaultAmount > 0 ? defaultAmount.toFixed(2) : '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const group = groupId ? groups.find(g => g.id === groupId) : null;
  const availableUsers = group
    ? users.filter(u => group.members.includes(u.id) && u.id !== currentUser.id)
    : users.filter(u => u.id !== currentUser.id);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!toUserId || !amount) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    settleUp(currentUser.id, toUserId, parseFloat(amount), groupId);
    setLoading(false);
    setSuccess(true);
    await new Promise(r => setTimeout(r, 1200));
    setSuccess(false);
    onClose();
  };

  const toUser = users.find(u => u.id === toUserId);

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
            className="relative bg-[#161b27] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1cc29f]/20 rounded-xl flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-[#1cc29f]" />
                </div>
                <h2 className="text-white font-semibold text-lg">Settle up</h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Payment flow visualization */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg ring-2 ring-[#1cc29f]/50"
                    style={{ backgroundColor: currentUser.avatarColor }}
                  >
                    {currentUser.initials}
                  </div>
                  <span className="text-white/60 text-sm">You</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-0.5 bg-[#1cc29f]" />
                    <ArrowRight className="w-5 h-5 text-[#1cc29f]" />
                  </div>
                  {amount && <span className="text-[#1cc29f] text-sm font-medium">₹{parseFloat(amount || '0').toFixed(2)}</span>}
                </div>
                <div className="flex flex-col items-center gap-2">
                  {toUser ? (
                    <>
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg ring-2 ring-white/10"
                        style={{ backgroundColor: toUser.avatarColor }}
                      >
                        {toUser.initials}
                      </div>
                      <span className="text-white/60 text-sm">{toUser.name}</span>
                    </>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/30 ring-2 ring-white/5 ring-dashed">
                      ?
                    </div>
                  )}
                </div>
              </div>

              {/* Who to pay */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">Pay to</label>
                <div className="flex flex-wrap gap-2">
                  {availableUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setToUserId(u.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                        toUserId === u.id
                          ? 'bg-[#1cc29f] text-white shadow-lg'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: u.avatarColor }}
                      >
                        {u.initials[0]}
                      </div>
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#1cc29f]/50 transition-all text-2xl"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={loading || success}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2 ${
                    success ? 'bg-green-500 text-white' : 'bg-[#1cc29f] hover:bg-[#16a589] text-white'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {success ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Settled!</span>
                    </>
                  ) : loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Settle up'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
