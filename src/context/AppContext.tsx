import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { User, Expense, Group, ExpenseCategory, ExpenseSplit } from '../types/index';

const AVATAR_COLORS = ['#1cc29f', '#4a6fa5', '#e74c3c', '#9b59b6', '#f39c12', '#e91e63'];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

interface AppContextType {
  isLoggedIn: boolean;
  currentUser: User;
  users: User[];
  expenses: Expense[];
  groups: Group[];
  login: () => void;
  logout: () => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addGroup: (group: Omit<Group, 'id' | 'expenses'>, onError?: (err: unknown) => void) => void;
  settleUp: (fromUserId: string, toUserId: string, amount: number, groupId?: string) => void;
  getUserById: (id: string) => User | undefined;
  getGroupById: (id: string) => Group | undefined;
  getExpensesByGroup: (groupId: string) => Expense[];
  calculateGroupBalances: (groupId: string) => { userId: string; amount: number }[];
  getTotalBalance: () => { totalOwe: number; totalOwed: number };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();

  const isLoggedIn = !!user;

  const currentUser: User = profile ? {
    id: profile.id,
    name: profile.display_name,
    email: user?.email || '',
    avatarColor: '#1cc29f',
    initials: getInitials(profile.display_name),
  } : {
    id: '',
    name: 'Guest',
    email: '',
    avatarColor: '#1cc29f',
    initials: 'GU',
  };

  const { data: groupsData = [] } = useQuery({
    queryKey: ['groups', user?.id],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const { data: memberRows } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);
      if (!memberRows?.length) return [];
      const groupIds = memberRows.map(r => r.group_id);
      const { data: groups } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
      const result: Group[] = [];
      for (const g of groups || []) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', g.id);
        const { data: expenses } = await supabase
          .from('expenses')
          .select('id')
          .eq('group_id', g.id);
        result.push({
          id: g.id,
          name: g.name,
          emoji: g.emoji || '👥',
          color: g.color || '#1cc29f',
          members: members?.map(m => m.user_id) || [],
          expenses: expenses?.map(e => e.id) || [],
        });
      }
      return result;
    },
  });

  const { data: usersData = [] } = useQuery({
    queryKey: ['users', groupsData.map(g => g.id).join(',')],
    enabled: groupsData.length > 0,
    retry: false,
    queryFn: async () => {
      const allMemberIds = [...new Set(groupsData.flatMap(g => g.members))];
      if (!allMemberIds.length) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', allMemberIds);
      return (profiles || []).map((p, i) => ({
        id: p.id,
        name: p.display_name,
        email: '',
        avatarColor: p.id === user?.id ? '#1cc29f' : getAvatarColor(i + 1),
        initials: getInitials(p.display_name),
      }));
    },
  });

  const { data: expensesData = [] } = useQuery({
    queryKey: ['expenses', groupsData.map(g => g.id).join(',')],
    enabled: groupsData.length > 0,
    retry: false,
    queryFn: async () => {
      const groupIds = groupsData.map(g => g.id);
      if (!groupIds.length) return [];
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*, expense_splits(*)')
        .in('group_id', groupIds)
        .eq('is_settled', false)
        .order('date', { ascending: false });
      return (expenses || []).map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        currency: e.currency || 'INR',
        paidBy: e.paid_by,
        date: e.date,
        category: e.category as ExpenseCategory,
        splits: (e.expense_splits || []).map((s: any) => ({
          userId: s.user_id,
          amount: s.amount_owed,
        })),
        groupId: e.group_id,
        settled: e.is_settled,
      }));
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id'>) => {
      const { data: newExpense, error } = await supabase
        .from('expenses')
        .insert({
          group_id: expense.groupId,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency || 'INR',
          paid_by: expense.paidBy,
          date: expense.date,
          category: expense.category,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      const splits = expense.splits.map(s => ({
        expense_id: newExpense.id,
        user_id: s.userId,
        amount_owed: s.amount,
        is_settled: false,
      }));
      await supabase.from('expense_splits').insert(splits);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const addGroupMutation = useMutation({
    mutationFn: async (group: Omit<Group, 'id' | 'expenses'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const payload = {
        name: group.name,
        emoji: group.emoji || '🏠',
        color: group.color || '#1cc29f',
        created_by: user.id,
        invite_code: inviteCode,
      };

      const { data: inserted, error } = await supabase
        .from('groups')
        .insert(payload)
        .select();

      const newGroup = inserted?.[0] ?? null;
      if (error) throw error;
      if (!newGroup) throw new Error('Insert returned no data');

      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: newGroup.id,
        user_id: user.id,
        role: 'admin',
      });

      if (memberError) throw memberError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (err: unknown) => {
      const e = err as { code?: string; message?: string };
      console.error('[Settlr] addGroup failed:', e.code, e.message ?? String(err));
    },
  });

  const settleUpMutation = useMutation({
    mutationFn: async ({ fromUserId }: { fromUserId: string; toUserId: string; amount: number; groupId?: string }) => {
      await supabase
        .from('expense_splits')
        .update({ is_settled: true })
        .eq('user_id', fromUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const getUserById = (id: string) => usersData.find(u => u.id === id);
  const getGroupById = (id: string) => groupsData.find(g => g.id === id);
  const getExpensesByGroup = (groupId: string) => expensesData.filter(e => e.groupId === groupId && !e.settled);

  const calculateGroupBalances = (groupId: string) => {
    const group = getGroupById(groupId);
    if (!group) return [];
    const groupExpenses = getExpensesByGroup(groupId);
    const balances: Record<string, number> = {};
    group.members.forEach(id => { balances[id] = 0; });
    groupExpenses.forEach(exp => {
      if (exp.paidBy in balances) {
        const paidByShare = exp.splits.find((s: ExpenseSplit) => s.userId === exp.paidBy)?.amount ?? 0;
        balances[exp.paidBy] += (exp.amount - paidByShare);
      }
      exp.splits.forEach((split: ExpenseSplit) => {
        if (split.userId !== exp.paidBy && split.userId in balances) {
          balances[split.userId] -= split.amount;
        }
      });
    });
    return Object.entries(balances).map(([userId, amount]) => ({ userId, amount }));
  };

  const getTotalBalance = () => {
    let totalOwe = 0;
    let totalOwed = 0;
    groupsData.forEach(group => {
      const balances = calculateGroupBalances(group.id);
      const myBalance = balances.find(b => b.userId === currentUser.id);
      if (myBalance) {
        if (myBalance.amount < 0) totalOwe += Math.abs(myBalance.amount);
        else totalOwed += myBalance.amount;
      }
    });
    return { totalOwe, totalOwed };
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn,
      currentUser,
      users: usersData,
      expenses: expensesData,
      groups: groupsData,
      login: () => {},
      logout: signOut,
      addExpense: (e) => addExpenseMutation.mutate(e),
      addGroup: (g, onError) => addGroupMutation.mutate(g, { onError }),
      settleUp: (f, t, a, g) => settleUpMutation.mutate({ fromUserId: f, toUserId: t, amount: a, groupId: g }),
      getUserById,
      getGroupById,
      getExpensesByGroup,
      calculateGroupBalances,
      getTotalBalance,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
