export interface Profile {
  id: string
  display_name: string
  avatar_id: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: string
  joined_at: string
}

export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'entertainment' | 'utilities' | 'shopping' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  initials: string;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  date: string;
  category: ExpenseCategory;
  splits: ExpenseSplit[];
  groupId?: string;
  settled?: boolean;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  color: string;
  members: string[];
  expenses: string[];
  invite_code?: string;
}
