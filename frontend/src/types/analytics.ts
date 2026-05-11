export interface CategoryBreakdown {
  name: string;
  total: number;
  percentage: number;
}

export interface AnalyticsSummary {
  date_from: string | null;
  date_to: string | null;
  total: number;
  daily_avg: number;
  monthly_avg: number;
  category_breakdown: CategoryBreakdown[];
}
