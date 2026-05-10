import apiClient from './client';
import type { Expense, ExpenseListResponse, ExpenseFilters, ApiEnvelope } from '../types/expense';

export async function listExpenses(filters: ExpenseFilters = {}): Promise<ExpenseListResponse> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.category_id !== '' && filters.category_id != null) params.category_id = filters.category_id as number;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.amount_min !== '' && filters.amount_min != null) params.amount_min = filters.amount_min as number;
  if (filters.amount_max !== '' && filters.amount_max != null) params.amount_max = filters.amount_max as number;
  const res = await apiClient.get<ApiEnvelope<ExpenseListResponse>>('/expenses', { params });
  return res.data.data;
}

export async function getExpense(id: number): Promise<Expense> {
  const res = await apiClient.get<ApiEnvelope<Expense>>(`/expenses/${id}`);
  return res.data.data;
}

export async function createExpense(
  payload: Omit<Expense, 'id' | 'currency' | 'created_at' | 'updated_at' | 'notes'> & { notes?: string | null }
): Promise<Expense> {
  const res = await apiClient.post<ApiEnvelope<Expense>>('/expenses', payload);
  return res.data.data;
}

export async function updateExpense(
  id: number,
  payload: Partial<Omit<Expense, 'id' | 'currency' | 'created_at' | 'updated_at'>>
): Promise<Expense> {
  const res = await apiClient.put<ApiEnvelope<Expense>>(`/expenses/${id}`, payload);
  return res.data.data;
}

export async function deleteExpense(id: number): Promise<void> {
  await apiClient.delete(`/expenses/${id}`);
}
