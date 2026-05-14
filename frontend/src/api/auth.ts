import apiClient from './client';
import type { ApiEnvelope } from '../types/expense';

interface AuthResponse {
  token: string;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/login', { email, password });
  return res.data.data.token;
}

export async function register(
  email: string,
  password: string,
  password_confirmation: string,
): Promise<string> {
  const res = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/register', {
    email,
    password,
    password_confirmation,
  });
  return res.data.data.token;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('auth_token');
}
