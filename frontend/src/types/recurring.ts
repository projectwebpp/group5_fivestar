/**
 * Represents one recurring expense template owned by the user.
 * Returned by GET /api/recurring and mutations.
 */
export interface RecurringExpense {
  id: number;
  description: string;
  category_id: number;
  category_name: string | null;
  amount: number;
  currency: string;                                 // 3-char code, default 'THB'
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;                               // YYYY-MM-DD
  last_created_date: string | null;                 // YYYY-MM-DD; null until first entry created
  next_due: string;                                 // YYYY-MM-DD computed by backend
  created_at: string;                               // ISO 8601
  updated_at: string;                               // ISO 8601
}

/**
 * Body for POST /api/recurring (create a new recurring expense template).
 */
export interface CreateRecurringPayload {
  description: string;
  category_id: number;
  amount: number;                                   // > 0, max 2 decimal places
  currency?: string;                                // optional; defaults to 'THB'
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;                               // YYYY-MM-DD
}

/**
 * Body for PUT /api/recurring/{id} (update an existing recurring template).
 * All fields optional — only include fields to change.
 */
export interface UpdateRecurringPayload {
  description?: string;
  category_id?: number;
  amount?: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  start_date?: string;                              // YYYY-MM-DD
}
