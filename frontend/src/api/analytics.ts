import apiClient from './client';
import type { ApiEnvelope } from '../types/expense';
import type { AnalyticsSummary } from '../types/analytics';

export async function getAnalyticsSummary(
  date_from: string,
  date_to: string
): Promise<AnalyticsSummary> {
  const res = await apiClient.get<ApiEnvelope<AnalyticsSummary>>('/analytics/summary', { params: { date_from, date_to } });
  return res.data.data;
}
