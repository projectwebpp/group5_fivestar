import apiClient from './client';
import type { ApiEnvelope } from '../types/expense';
import type { BudgetRow, CreateBudgetPayload, UpdateBudgetPayload } from '../types/budget';

/**
 * GET /api/budgets?month=M&year=Y
 * Returns all user categories with their current-month limit and spend.
 */
export async function getBudgets(month: number, year: number): Promise<BudgetRow[]> {
  const res = await apiClient.get<ApiEnvelope<BudgetRow[]>>('/budgets', {
    params: { month, year },
  });
  return res.data.data;
}

/**
 * POST /api/budgets
 * Creates a new budget limit for a category/month/year.
 */
export async function createBudget(payload: CreateBudgetPayload): Promise<BudgetRow> {
  const res = await apiClient.post<ApiEnvelope<BudgetRow>>('/budgets', payload);
  return res.data.data;
}

/**
 * PUT /api/budgets/{id}
 * Updates the amount on an existing budget row.
 */
export async function updateBudget(id: number, payload: UpdateBudgetPayload): Promise<BudgetRow> {
  const res = await apiClient.put<ApiEnvelope<BudgetRow>>(`/budgets/${id}`, payload);
  return res.data.data;
}

/**
 * DELETE /api/budgets/{id}
 * Hard-deletes a budget row (per D-06: saving blank removes the limit).
 */
export async function deleteBudget(id: number): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
