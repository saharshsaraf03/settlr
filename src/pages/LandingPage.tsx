import { useState, useEffect, useRef } from 'react';
import { AuthModal } from '../components/AuthModal';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { Plane, Home, Heart, Star, Users, TrendingUp, Shield, Zap, ChevronRight, Menu, X } from 'lucide-react';
import type { JSX } from 'react';

// Geometric diamond shape made of triangle facets
const TRIANGLES = [
  // Top section
  { points: "250,35 145,160 255,195", fill: "#2dd4bf" },
  { points: "250,35 255,195 365,155", fill: "#1cc29f" },
  { points: "145,160 45,265 145,290", fill: "#0d9488" },
  { points: "145,160 145,290 255,195", fill: "#14b8a6" },
  { points: "255,195 145,290 250,320", fill: "#0f766e" },
  { points: "255,195 250,320 365,290", fill: "#115e59" },
  { points: "255,195 365,290 365,155", fill: "#134e4a" },
  { points: "365,155 365,290 460,265", fill: "#1cc29f" },
  // Middle band
  { points: "45,265 140,390 145,290", fill: "#0f766e" },
  { points: "145,290 140,390 250,320", fill: "#134e4a" },
  { points: "250,320 140,390 250,430", fill: "#0d9488" },
  { points: "250,320 250,430 370,390", fill: "#14b8a6" },
  { points: "365,290 250,320 370,390", fill: "#1cc29f" },
  { points: "460,265 365,290 370,390", fill: "#2dd4bf" },
  // Bottom section
  { points: "140,390 250,490 250,430", fill: "#115e59" },
  { points: "250,430 250,490 370,390", fill: "#0f766e" },
  // Extra detail triangles
  { points: "250,35 205,118 250,155", fill: "#5eead4" },
  { points: "250,35 250,155 300,115", fill: "#2dd4bf" },
  { points: "460,265 390,320 370,390", fill: "#134e4a" },
  { points: "45,265 95,320 140,390", fill: "#0d9488" },
];

function GeometricDiamond() {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <motion.svg
        viewBox="0 0 505 530"
        className="w-full max-w-[480px] drop-shadow-2xl"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Glow effect */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softglow">
            <feGaussianBlur stdDeviation="12" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer glow circle */}
        <motion.circle
          cx="252" cy="262"
          r="200"
          fill="none"
          stroke="#1cc29f"
          strokeWidth="1"
          strokeDasharray="8 6"
          opacity="0.15"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '252px 262px' }}
        />
        <motion.circle
          cx="252" cy="262"
          r="230"
          fill="none"
          stroke="#1cc29f"
          strokeWidth="0.5"
          strokeDasharray="4 12"
          opacity="0.08"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '252px 262px' }}
        />

        {/* Main triangles */}
        {TRIANGLES.map((tri, i) => (
          <motion.polygon
            key={i}
            points={tri.points}
            fill={tri.fill}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: i * 0.04,
              duration: 0.5,
              ease: 'backOut',
            }}
            whileHover={{ fill: '#5eead4', transition: { duration: 0.2 } }}
            style={{ cursor: 'crosshair' }}
          />
        ))}

        {/* Shimmer highlight triangles (more transparent) */}
        {TRIANGLES.slice(0, 4).map((tri, i) => (
          <motion.polygon
            key={`hl-${i}`}
            points={tri.points}
            fill="white"
            opacity="0"
            animate={{ opacity: [0, 0.12, 0] }}
            transition={{
              delay: 2 + i * 0.8,
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 5,
            }}
          />
        ))}

        {/* Center spark */}
        <motion.circle
          cx="252" cy="262" r="6"
          fill="#5eead4"
          filter="url(#glow)"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.svg>
    </motion.div>
  );
}

function RotatingWord() {
  const words = ['trips', 'home', 'groups', 'events', 'friends'];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % words.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className="block text-[#1cc29f]"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {words[index]}.
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function FeatureCard({ icon, title, description, delay = 0 }: { icon: JSX.Element; title: string; description: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className="bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/8 hover:border-[#1cc29f]/30 transition-all group"
    >
      <div className="w-12 h-12 bg-[#1cc29f]/15 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1cc29f]/25 transition-colors">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Mock App Preview component for feature sections
function AppPreview() {
  const expenses = [
    { name: 'Bacchus Lunch', paid: 'Soham paid', amount: '₹3,269', owed: '₹555', color: '#f97316' },
    { name: 'Petrol', paid: 'Aryaman paid', amount: '₹1,000', owed: '₹200', color: '#1cc29f' },
    { name: 'Planet Cafe Dinner', paid: 'Soham paid', amount: '₹846', owed: '₹211', color: '#f97316' },
    { name: 'Extra Petrol', paid: 'Soham paid', amount: '₹500', owed: '₹100', color: '#1cc29f' },
  ];

  return (
    <div className="bg-[#0e1117] rounded-2xl overflow-hidden border border-white/10 shadow-2xl w-full max-w-md mx-auto">
      {/* App header */}
      <div className="bg-[#1cc29f] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="text-white font-semibold text-sm">Settlr</span>
        </div>
        <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">YO</span>
        </div>
      </div>
      {/* Sidebar + content */}
      <div className="flex h-48">
        <div className="w-28 bg-[#0d111a] border-r border-white/5 p-2 flex flex-col gap-0.5">
          <div className="px-2 py-1.5 bg-[#1cc29f]/20 rounded-lg text-[10px] text-[#1cc29f] font-medium">Dashboard</div>
          <div className="px-2 py-1.5 text-[10px] text-white/40">Recent Activity</div>
          <div className="px-2 py-1.5 text-[10px] text-white/40 mt-1 text-[9px] uppercase tracking-wider">Groups</div>
          <div className="px-2 py-1 text-[10px] text-white/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1cc29f] block" />
            Manali Trip
          </div>
          <div className="px-2 py-1 text-[10px] text-white/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4a6fa5] block" />
            Roommates
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-2 space-y-1">
          {expenses.map((e, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center justify-between bg-white/3 rounded-lg px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="text-white text-[10px] font-medium truncate">{e.name}</p>
                <p className="text-white/40 text-[9px]">{e.paid}</p>
              </div>
              <div className="text-right ml-2 shrink-0">
                <p className="text-white/50 text-[9px]">{e.amount}</p>
                <p className="text-[9px] font-medium" style={{ color: e.color }}>you owe {e.owed}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BalancePreview() {
  const members = [
    { name: 'Ananya', amount: '₹5,554', status: 'owes', color: '#e74c3c' },
    { name: 'Meghansh', amount: 'settled', status: 'settled', color: '#1cc29f' },
    { name: 'You', amount: '₹1,043', status: 'owe', color: '#f97316' },
    { name: 'Soham', amount: '₹6,597', status: 'gets back', color: '#1cc29f' },
    { name: 'Vibs', amount: 'settled', status: 'settled', color: '#1cc29f' },
  ];

  return (
    <div className="bg-[#0e1117] rounded-2xl overflow-hidden border border-white/10 shadow-2xl w-full max-w-xs mx-auto">
      <div className="p-4 border-b border-white/8">
        <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Group Balances</p>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#1cc29f]" />
          <span className="text-white/60 text-xs">Simplify debts is ON</span>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {members.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-[9px] font-bold">
                {m.name[0]}
              </div>
              <span className="text-white/70 text-xs">{m.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium" style={{ color: m.color }}>
                {m.status === 'settled' ? (
                  <span className="text-white/30">settled up</span>
                ) : (
                  `${m.status} ${m.amount}`
                )}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' });

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-40 border-b border-white/5"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(10,14,26,0.85)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#1cc29f] rounded-xl flex items-center justify-center shadow-lg shadow-[#1cc29f]/20">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Settlr</span>
          </div>
          {/* Desktop nav — centred */}
          <div className="hidden md:flex items-center justify-center gap-10">
            <a href="#features" className="text-white/80 hover:text-white text-base font-medium tracking-wide transition-colors hover:drop-shadow-[0_0_8px_rgba(28,194,159,0.6)]">Features</a>
            <a href="#how-it-works" className="text-white/80 hover:text-white text-base font-medium tracking-wide transition-colors hover:drop-shadow-[0_0_8px_rgba(28,194,159,0.6)]">How it works</a>
          </div>
          <div className="hidden md:flex items-center justify-end gap-3">
            <button
              onClick={() => openAuth('login')}
              className="text-white/70 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
            >
              Log in
            </button>
            <motion.button
              onClick={() => openAuth('signup')}
              className="bg-[#1cc29f] hover:bg-[#16a589] text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-[#1cc29f]/20"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Sign up
            </motion.button>
          </div>
          <button className="md:hidden text-white/60" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden"
            >
              <div className="px-6 py-4 space-y-3">
                <a href="#features" className="block text-white/60 py-2">Features</a>
                <a href="#how-it-works" className="block text-white/60 py-2">How it works</a>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); openAuth('login'); }}
                    className="flex-1 bg-white/5 text-white py-2.5 rounded-xl text-sm"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); openAuth('signup'); }}
                    className="flex-1 bg-[#1cc29f] text-white py-2.5 rounded-xl text-sm font-medium"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(28,194,159,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(28,194,159,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Background radial glow */}
        <div className="absolute top-1/3 right-1/3 w-[600px] h-[600px] bg-[#1cc29f]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-[#4a6fa5]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 bg-[#1cc29f]/10 border border-[#1cc29f]/20 text-[#1cc29f] text-sm px-4 py-1.5 rounded-full mb-6">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Simple group expense tracking</span>
                </div>
              </motion.div>

              <motion.h1
                className="text-5xl lg:text-6xl leading-[1.1] mb-3"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <span className="text-white">Less stress when</span>
                <br />
                <span className="text-white">sharing expenses</span>
                <br />
                <RotatingWord />
              </motion.h1>

              <motion.div
                className="flex items-center gap-5 mt-6 mb-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {[
                  { icon: <Plane className="w-7 h-7" />, color: '#1cc29f', label: 'Trips' },
                  { icon: <Home className="w-7 h-7" />, color: '#a78bfa', label: 'Home' },
                  { icon: <Heart className="w-7 h-7" />, color: '#f472b6', label: 'Couples' },
                  { icon: <Star className="w-7 h-7" />, color: '#94a3b8', label: 'Others' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex flex-col items-center gap-1"
                    whileHover={{ scale: 1.1, y: -4 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    style={{ color: item.color }}
                  >
                    {item.icon}
                    <span className="text-xs text-white/40">{item.label}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.p
                className="text-white/55 text-lg leading-relaxed mb-8 max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
              >
                Keep track of your shared expenses and balances with housemates, trips, groups, friends, and family.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65 }}
              >
                <motion.button
                  onClick={() => openAuth('signup')}
                  className="flex items-center gap-2 bg-[#1cc29f] hover:bg-[#16a589] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors shadow-lg shadow-[#1cc29f]/25"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Sign up free
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => openAuth('login')}
                  className="flex items-center gap-2 bg-white/8 hover:bg-white/12 text-white px-8 py-4 rounded-2xl font-medium text-lg border border-white/10 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Log in
                </motion.button>
              </motion.div>

              <motion.p
                className="text-white/30 text-sm mt-5 flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <Shield className="w-4 h-4" />
                Free forever. No credit card required.
              </motion.p>
            </div>

            {/* Right - Geometric Animation */}
            <motion.div
              className="relative h-[480px] hidden lg:block"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
            >
              <GeometricDiamond />
              {/* Floating stat cards */}
              <motion.div
                className="absolute top-8 -left-4 bg-[#161b27] border border-white/10 rounded-2xl p-3 shadow-xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
              >
                <p className="text-white/40 text-xs">Total saved</p>
                <p className="text-[#1cc29f] font-bold text-lg">₹12,450</p>
              </motion.div>
              <motion.div
                className="absolute bottom-24 -left-4 bg-[#161b27] border border-white/10 rounded-2xl p-3 shadow-xl"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {['#1cc29f','#4a6fa5','#e74c3c'].map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-[#161b27]" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="text-white/60 text-xs">5 members</p>
                </div>
                <p className="text-white text-xs mt-1">Manali Trip 🏖️</p>
              </motion.div>
              <motion.div
                className="absolute top-16 right-0 bg-[#161b27] border border-white/10 rounded-2xl p-3 shadow-xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.8 }}
              >
                <p className="text-white/40 text-xs">You are owed</p>
                <p className="text-[#1cc29f] font-bold text-lg">₹3,820</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-[1px] h-10 bg-gradient-to-b from-transparent to-white/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </motion.div>
      </section>

      {/* Features - Track balances & Organize */}
      <section id="features" className="py-20">
        <div ref={featuresRef} className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl text-white mb-4">Everything you need to <span className="text-[#1cc29f]">split fair</span></h2>
            <p className="text-white/50 max-w-xl mx-auto">Powerful tools for tracking, splitting, and settling shared expenses with anyone.</p>
          </motion.div>

          {/* Feature block 1 */}
          <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden mb-8">
            <div className="bg-[#111827] p-10 flex flex-col justify-between">
              <div>
                <motion.h3
                  className="text-3xl text-white mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  Track balances
                </motion.h3>
                <motion.p
                  className="text-white/50 text-lg leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Keep track of shared expenses, balances, and who owes who. See it all at a glance.
                </motion.p>
              </div>
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <AppPreview />
              </motion.div>
            </div>
            <div className="bg-[#0d4040] p-10 flex flex-col justify-between">
              <div>
                <motion.h3
                  className="text-3xl text-white mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Organize expenses
                </motion.h3>
                <motion.p
                  className="text-white/60 text-lg leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Split expenses with any group: trips, housemates, friends, and family.
                </motion.p>
              </div>
              <motion.div
                className="mt-8 flex justify-center"
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <BalancePreview />
              </motion.div>
            </div>
          </div>

          {/* Feature cards row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-[#1cc29f]" />}
              title="Smart splitting"
              description="Split equally or customize amounts for each person in the group."
              delay={0}
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-[#1cc29f]" />}
              title="Multiple groups"
              description="Manage separate groups for trips, home, work, and more."
              delay={0.1}
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-[#1cc29f]" />}
              title="Instant settle up"
              description="Record cash or online payments with one tap to settle debts."
              delay={0.2}
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-[#1cc29f]" />}
              title="Always in sync"
              description="Everyone in the group sees the same balances in real time."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-[#0d111a]">
        <div ref={howItWorksRef} className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl text-white mb-4">How it <span className="text-[#1cc29f]">works</span></h2>
            <p className="text-white/50">Getting started takes less than 2 minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create a group',
                description: 'Create a group for your trip, home, or any occasion. Invite friends by email.',
                color: '#1cc29f',
              },
              {
                step: '02',
                title: 'Add expenses',
                description: 'Quickly add expenses as they happen. Assign who paid and split automatically.',
                color: '#f97316',
              },
              {
                step: '03',
                title: 'Settle up',
                description: "See exactly who owes what and settle up with one click. It's that simple.",
                color: '#a78bfa',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white font-black text-2xl"
                  style={{ backgroundColor: `${item.color}20`, border: `2px solid ${item.color}30`, color: item.color }}
                >
                  {item.step}
                </div>
                <h3 className="text-white text-xl mb-3">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.description}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1cc29f]/10 to-[#0a0e1a]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#1cc29f]/8 rounded-full blur-[80px]" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-5xl text-white mb-5">
              Start managing expenses<br />
              <span className="text-[#1cc29f]">together, today</span>
            </h2>
            <p className="text-white/50 text-xl mb-10">
              Join thousands of groups already using Settlr to keep finances stress-free.
            </p>
            <motion.button
              onClick={() => openAuth('signup')}
              className="inline-flex items-center gap-3 bg-[#1cc29f] hover:bg-[#16a589] text-white px-10 py-4 rounded-2xl font-semibold text-xl transition-colors shadow-2xl shadow-[#1cc29f]/30"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              Get started for free
              <ChevronRight className="w-6 h-6" />
            </motion.button>
            <p className="text-white/30 text-sm mt-5">No credit card required · Free forever</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1cc29f] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="text-white/60 font-medium">Settlr</span>
          </div>
          <p className="text-white/25 text-sm">© 2026 Settlr. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <a key={link} href="#" className="text-white/30 hover:text-white/60 text-sm transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
