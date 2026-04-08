import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Activity, List, Plus, ChevronDown, User, Mail, Send, LogOut, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { groups, users, currentUser, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [inviteEmail, setInviteEmail] = useState('');
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [friendsExpanded, setFriendsExpanded] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupError, setGroupError] = useState('');
  const { addGroup } = useApp();

  const friends = users.filter(u => u.id !== currentUser.id).slice(0, 4);

  const navItems = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Activity className="w-4 h-4" />, label: 'Recent activity', path: '/activity' },
    { icon: <List className="w-4 h-4" />, label: 'All expenses', path: '/expenses' },
  ];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    const emojis = ['🎉', '🏡', '🌍', '💼', '🎭', '🎮'];
    const colors = ['#1cc29f', '#4a6fa5', '#e74c3c', '#9b59b6', '#f39c12'];
    setGroupError('');
    addGroup(
      {
        name: trimmed,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        members: [currentUser.id],
      },
      (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        setGroupError(msg || 'Failed to create group');
      }
    );
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d111a] text-white overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1cc29f] rounded-xl flex items-center justify-center shadow-lg shadow-[#1cc29f]/20">
            <span className="text-white font-black text-base">S</span>
          </div>
          <span className="text-white font-bold text-lg">Settlr</span>
        </div>
        {onMobileClose && (
          <button onClick={onMobileClose} className="text-white/40 hover:text-white/70 md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="px-3 pt-3 pb-2 space-y-0.5">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onMobileClose?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? 'bg-[#1cc29f]/15 text-[#1cc29f] font-medium'
                  : 'text-white/55 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <span className={active ? 'text-[#1cc29f]' : ''}>{item.icon}</span>
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1cc29f]" />}
            </button>
          );
        })}
      </nav>

      <div className="h-px bg-white/5 mx-4 my-2" />

      {/* Groups */}
      <div className="px-3">
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-white/40 text-xs uppercase tracking-wider hover:text-white/60 transition-colors"
          onClick={() => setGroupsExpanded(!groupsExpanded)}
        >
          <span>Groups</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddGroup(!showAddGroup); }}
              className="flex items-center gap-1 text-[#1cc29f] hover:text-[#1aad8e] text-xs"
            >
              <Plus className="w-3 h-3" />
              add
            </button>
            <ChevronDown className={`w-3 h-3 transition-transform ${groupsExpanded ? '' : '-rotate-90'}`} />
          </div>
        </button>

        <AnimatePresence>
          {showAddGroup && (
            <motion.form
              onSubmit={handleCreateGroup}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-2"
            >
              <div className="flex gap-1 px-2 py-1">
                <input
                  type="text"
                  placeholder="Group name..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#1cc29f]/50"
                  autoFocus
                />
                <button type="submit" className="bg-[#1cc29f] text-white px-2 py-1.5 rounded-lg text-xs">Add</button>
              </div>
              {groupError && (
                <p className="px-2 pb-1 text-[10px]" style={{ color: '#FF6B6B' }}>{groupError}</p>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {groupsExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0.5 mb-2"
            >
              {groups.map(group => {
                const active = location.pathname === `/groups/${group.id}`;
                return (
                  <button
                    key={group.id}
                    onClick={() => { navigate(`/groups/${group.id}`); onMobileClose?.(); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                      active
                        ? 'bg-[#1cc29f]/15 text-[#1cc29f] font-medium'
                        : 'text-white/55 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    <span className="text-base leading-none">{group.emoji}</span>
                    <span className="truncate">{group.name}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1cc29f]" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-px bg-white/5 mx-4 my-2" />

      {/* Friends */}
      <div className="px-3">
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-white/40 text-xs uppercase tracking-wider hover:text-white/60 transition-colors"
          onClick={() => setFriendsExpanded(!friendsExpanded)}
        >
          <span>Friends</span>
          <div className="flex items-center gap-1">
            <span className="text-[#1cc29f] text-xs flex items-center gap-1 hover:text-[#1aad8e]">
              <Plus className="w-3 h-3" />add
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${friendsExpanded ? '' : '-rotate-90'}`} />
          </div>
        </button>

        <AnimatePresence>
          {friendsExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0.5 mb-2"
            >
              {friends.map(f => (
                <div
                  key={f.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/55 hover:bg-white/5 hover:text-white/80 transition-all cursor-pointer"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                    style={{ backgroundColor: f.avatarColor }}
                  >
                    {f.initials[0]}
                  </div>
                  <span className="text-sm truncate">{f.name}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-px bg-white/5 mx-4 my-2" />

      {/* Invite friends */}
      <div className="px-4 py-3">
        <p className="text-white/70 text-xs font-medium mb-2 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          Invite friends
        </p>
        <div className="space-y-2">
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white text-xs placeholder-white/25 focus:outline-none focus:border-[#1cc29f]/50 transition-all"
            />
          </div>
          <button
            onClick={() => setInviteEmail('')}
            className="w-full flex items-center justify-center gap-1.5 bg-[#1cc29f]/10 hover:bg-[#1cc29f]/20 text-[#1cc29f] py-2 rounded-lg text-xs font-medium transition-all"
          >
            <Send className="w-3 h-3" />
            Send invite
          </button>
        </div>
      </div>

      {/* Bottom user */}
      <div className="mt-auto px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            {currentUser.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-sm font-medium truncate">{currentUser.name === 'You' ? 'My Account' : currentUser.name}</p>
            <p className="text-white/30 text-xs truncate">{currentUser.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-white/30 hover:text-white/60 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-shrink-0 h-screen sticky top-0">
        <div className="w-full border-r border-white/5">
          {renderSidebarContent()}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.div
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-72"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
