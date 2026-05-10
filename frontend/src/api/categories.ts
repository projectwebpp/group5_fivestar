import apiClient from './client';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryPayload {
  name: string;
  icon: string;
  color: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
  message: string;
}

export const getCategories = () =>
  apiClient.get<Envelope<Category[]>>('/categories');

export const createCategory = (payload: CategoryPayload) =>
  apiClient.post<Envelope<Category>>('/categories', payload);

export const updateCategory = (id: number, payload: CategoryPayload) =>
  apiClient.put<Envelope<Category>>(`/categories/${id}`, payload);

export const deleteCategory = (id: number) =>
  apiClient.delete<Envelope<null>>(`/categories/${id}`);

export async function listCategories(): Promise<Category[]> {
  const res = await apiClient.get<Envelope<Category[] | { items: Category[] }>>('/categories');
  const d = res.data.data;
  return Array.isArray(d) ? d : (d.items ?? []);
}
