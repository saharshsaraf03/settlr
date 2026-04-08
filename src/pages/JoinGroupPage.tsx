import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { useQueryClient } from '@tanstack/react-query';

interface GroupPreview {
  id: string;
  name: string;
  emoji: string;
  color: string;
  memberCount: number;
}

const PENDING_INVITE_KEY = 'pendingInvite';

export function JoinGroupPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [groupPreview, setGroupPreview] = useState<GroupPreview | null>(null);
  const [fetching, setFetching] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const hasJoined = useRef(false);

  // Always store the invite code in sessionStorage so the signup→profile→dashboard
  // flow can pick it up in AppLayout and auto-join there.
  useEffect(() => {
    if (inviteCode) {
      sessionStorage.setItem(PENDING_INVITE_KEY, inviteCode);
    }
  }, [inviteCode]);

  // Fetch group preview. For unauthenticated users the RLS on `groups` may
  // block this — we handle the null case gracefully below.
  useEffect(() => {
    if (!inviteCode) return;
    (async () => {
      setFetching(true);
      try {
        const { data: group } = await supabase
          .from('groups')
          .select('id, name, emoji, color')
          .eq('invite_code', inviteCode)
          .maybeSingle();

        if (!group) {
          // Could be RLS blocking anon read — don't show "not found" yet,
          // just show the generic invite UI. We'll verify after auth.
          setGroupPreview(null);
          setNotFound(false);
        } else {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          setGroupPreview({
            id: group.id,
            name: group.name,
            emoji: group.emoji || '👥',
            color: group.color || '#1cc29f',
            memberCount: count ?? 0,
          });
        }
      } finally {
        setFetching(false);
      }
    })();
  }, [inviteCode]);

  // Join logic — called when both user and group info are ready
  const joinGroup = async (preview: GroupPreview, userId: string) => {
    if (hasJoined.current) return;
    hasJoined.current = true;
    setJoining(true);

    try {
      // Check membership first
      const { data: existing } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', preview.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from('group_members').insert({
          group_id: preview.id,
          user_id: userId,
          role: 'member',
        });
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ['groups'] });
      }

      sessionStorage.removeItem(PENDING_INVITE_KEY);
      navigate(`/groups/${preview.id}`, { replace: true });
    } catch {
      // If something fails, just go to dashboard so they're not stuck
      sessionStorage.removeItem(PENDING_INVITE_KEY);
      navigate('/dashboard', { replace: true });
    }
  };

  // When user becomes logged in (either was already, or just logged in via modal),
  // join the group if we have the preview. If no preview (RLS blocked anon fetch),
  // try fetching again now that we're authed.
  useEffect(() => {
    if (!user || !inviteCode || hasJoined.current) return;

    (async () => {
      let preview = groupPreview;

      if (!preview) {
        // Try fetching again now that the user is authenticated
        const { data: group } = await supabase
          .from('groups')
          .select('id, name, emoji, color')
          .eq('invite_code', inviteCode)
          .maybeSingle();

        if (!group) {
          setNotFound(true);
          return;
        }

        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        preview = {
          id: group.id,
          name: group.name,
          emoji: group.emoji || '👥',
          color: group.color || '#1cc29f',
          memberCount: count ?? 0,
        };
        setGroupPreview(preview);
      }

      joinGroup(preview, user.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, groupPreview]);

  // ── Render: loading ──
  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1cc29f] animate-spin" />
      </div>
    );
  }

  // ── Render: joining (logged-in, processing) ──
  if (joining) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#1cc29f] animate-spin" />
        <p className="text-white/50 text-sm">Joining group…</p>
      </div>
    );
  }

  // ── Render: invite code invalid (and user is authed so we can be sure) ──
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-white text-xl font-bold mb-2">Link not found</h1>
          <p className="text-white/45 text-sm mb-6">
            This invite link is invalid or has expired. Ask the group owner for a new one.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#1cc29f] hover:bg-[#16a589] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Render: not logged in — show invite landing ──
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-6">
      {/* Settlr logo */}
      <motion.div
        className="flex items-center gap-2.5 mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-9 h-9 bg-[#1cc29f] rounded-xl flex items-center justify-center shadow-lg shadow-[#1cc29f]/30">
          <span className="text-white font-black text-lg">S</span>
        </div>
        <span className="text-white font-bold text-xl">Settlr</span>
      </motion.div>

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Card */}
        <div className="bg-[#161b27] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Group preview header */}
          <div className="p-6 text-center border-b border-white/5">
            {groupPreview ? (
              <>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg"
                  style={{
                    backgroundColor: `${groupPreview.color}25`,
                    border: `1px solid ${groupPreview.color}40`,
                  }}
                >
                  {groupPreview.emoji}
                </div>
                <p className="text-white/50 text-sm mb-1">You've been invited to</p>
                <h1 className="text-white text-xl font-bold mb-1">{groupPreview.name}</h1>
                <div className="flex items-center justify-center gap-1.5 text-white/35 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  <span>{groupPreview.memberCount} member{groupPreview.memberCount !== 1 ? 's' : ''}</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[#1cc29f]/15 flex items-center justify-center text-3xl mx-auto mb-3">
                  👥
                </div>
                <p className="text-white/50 text-sm mb-1">You've been invited to join</p>
                <h1 className="text-white text-xl font-bold mb-1">a Settlr group</h1>
                <p className="text-white/35 text-xs">Sign in to see the details and join</p>
              </>
            )}
          </div>

          {/* Auth prompt */}
          <div className="p-5 space-y-3">
            <p className="text-white/40 text-xs text-center">
              Sign in or create an account to join
            </p>
            <button
              onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
              className="w-full flex items-center justify-center gap-2 bg-[#1cc29f] hover:bg-[#16a589] text-white py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Log in to join
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setAuthOpen(true); }}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white py-3 rounded-xl text-sm transition-all border border-white/8"
            >
              Create a free account
            </button>
          </div>
        </div>

        <p className="text-white/20 text-xs text-center mt-5">
          Split expenses effortlessly with Settlr
        </p>
      </motion.div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
