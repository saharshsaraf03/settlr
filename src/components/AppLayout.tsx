import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import { Menu, Bell, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useApp } from '../context/AppContext';
import { AddExpenseModal } from './AddExpenseModal';

export function AppLayout() {
  const { currentUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0e1a] overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0d111a] flex-shrink-0">
          <button
            className="md:hidden text-white/50 hover:text-white/80 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 md:flex-none" />
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setAddExpenseOpen(true)}
              className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#f97316]/20"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add expense</span>
            </motion.button>
            <button className="relative text-white/40 hover:text-white/70 transition-colors p-2">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f97316] rounded-full" />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
              style={{ backgroundColor: currentUser.avatarColor }}
              title={currentUser.name}
            >
              {currentUser.initials}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      <AddExpenseModal isOpen={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} />
    </div>
  );
}
