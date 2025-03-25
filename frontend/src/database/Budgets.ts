import { createClient } from '@/utils/supabase/client';
import { BudgetFrequency } from '@/types/Budgets';

export interface CreateBudgetParams {
  userId: string;
  budget_name: string;
  category: string;
  budgetAmount: number;
  frequency: BudgetFrequency;
}

export interface UpdateBudgetParams {
  id: string;
  budget_name?: string;
  category?: string;
  budgetAmount?: number;
  frequency?: BudgetFrequency;
}

export async function createBudget({
  userId,
  budget_name,
  category,
  budgetAmount,
  frequency,
}: CreateBudgetParams) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: userId,
      budget_name,
      category,
      budget_amount: budgetAmount,
      frequency,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBudget({
  id,
  budget_name,
  category,
  budgetAmount,
  frequency,
}: UpdateBudgetParams) {
  const supabase = createClient();

  const updates: Partial<{
    budget_name: string;
    category: string;
    budget_amount: number;
    frequency: BudgetFrequency;
  }> = {};

  if (budget_name !== undefined) updates.budget_name = budget_name;
  if (category !== undefined) updates.category = category;
  if (budgetAmount !== undefined) updates.budget_amount = budgetAmount;
  if (frequency !== undefined) updates.frequency = frequency;

  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBudget(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getBudgetById(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getBudgetsByUserId(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBudgetsByCategory(userId: string, category: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBudgetsByFrequency(userId: string, frequency: BudgetFrequency) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('frequency', frequency)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
} 