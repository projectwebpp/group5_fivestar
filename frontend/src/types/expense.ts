export interface Expense {
  id: number;
  amount: number;
  currency: 'THB';
  category_id: number;
  description: string;
  date: string;        // YYYY-MM-DD
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseListMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ExpenseListResponse {
  items: Expense[];
  meta: ExpenseListMeta;
}

export interface ExpenseFilters {
  page?: number;
  category_id?: number | '';
  date_from?: string;   // YYYY-MM-DD
  date_to?: string;
  amount_min?: number | '';
  amount_max?: number | '';
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  errors?: Array<{ field: string; message: string }>;
}
