import { supabase } from './supabase';

function wrapError(err: unknown): never {
  // Supabase AuthError: returned as { data, error } — already unwrapped by caller
  // Native Error / network error / unknown — normalise into the envelope shape the UI expects
  const message =
    (err as { message?: string })?.message ??
    'Something went wrong. Please try again.';
  throw { response: { data: { message } } };
}

export async function login(email: string, password: string): Promise<string> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Login failed — no session returned.');
    return data.session.access_token;
  } catch (err) {
    wrapError(err);
  }
}

export async function register(
  email: string,
  password: string,
  _password_confirmation: string,
): Promise<string> {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Check your email to confirm your account, then log in.');
    return data.session.access_token;
  } catch (err) {
    wrapError(err);
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_email');
}
