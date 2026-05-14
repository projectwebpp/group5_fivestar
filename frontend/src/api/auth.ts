import { supabase } from './supabase';

export async function login(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw { response: { data: { message: error.message } } };
  if (!data.session) throw { response: { data: { message: 'Login failed — no session returned.' } } };
  return data.session.access_token;
}

export async function register(
  email: string,
  password: string,
  _password_confirmation: string,
): Promise<string> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw { response: { data: { message: error.message } } };
  if (!data.session) {
    throw { response: { data: { message: 'Check your email to confirm your account, then log in.' } } };
  }
  return data.session.access_token;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_email');
}
