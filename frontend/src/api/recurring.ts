import apiClient from './client';
import type { ApiEnvelope } from '../types/expense';
import type { RecurringExpense, CreateRecurringPayload, UpdateRecurringPayload } from '../types/recurring';

/**
 * GET /api/recurring
 * Returns all recurring expense templates for the authenticated user.
 */
export async function listRecurring(): Promise<RecurringExpense[]> {
  const res = await apiClient.get<ApiEnvelope<RecurringExpense[]>>('/recurring');
  return res.data.data;
}

/**
 * POST /api/recurring
 * Creates a new recurring expense template.
 */
export async function createRecurring(payload: CreateRecurringPayload): Promise<RecurringExpense> {
  const res = await apiClient.post<ApiEnvelope<RecurringExpense>>('/recurring', payload);
  return res.data.data;
}

/**
 * PUT /api/recurring/{id}
 * Updates an existing recurring expense template.
 */
export async function updateRecurring(id: number, payload: UpdateRecurringPayload): Promise<RecurringExpense> {
  const res = await apiClient.put<ApiEnvelope<RecurringExpense>>(`/recurring/${id}`, payload);
  return res.data.data;
}

/**
 * DELETE /api/recurring/{id}
 * Deletes a recurring expense template. Stops future auto-creation.
 */
export async function deleteRecurring(id: number): Promise<void> {
  await apiClient.delete(`/recurring/${id}`);
}
