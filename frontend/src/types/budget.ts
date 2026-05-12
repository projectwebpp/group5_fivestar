/**
 * Represents one row in the budget table — one per user category.
 * Returned by GET /api/budgets.
 */
export interface BudgetRow {
  category_id: number;
  category_name: string;
  budget_id: number | null;   // null if no limit has been set for this category
  limit: number | null;       // null if no limit set
  spent: number;              // always present — current-month spend
  remaining: number | null;   // null if no limit; negative when over budget (per D-08)
}

/**
 * Body for POST /api/budgets (create a new limit).
 */
export interface CreateBudgetPayload {
  category_id: number;
  month: number;  // 1–12
  year: number;
  amount: number; // > 0
}

/**
 * Body for PUT /api/budgets/{id} (update existing limit).
 */
export interface UpdateBudgetPayload {
  amount: number; // > 0
}
