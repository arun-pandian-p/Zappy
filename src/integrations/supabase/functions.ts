import { supabase } from './client';

export async function invokeFunction(name: string, options: { body?: any; method?: string } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const body = options.body !== undefined ? JSON.stringify(options.body) : undefined;

  // Pass through method if provided
  const invokeOptions: any = { headers };
  if (body) invokeOptions.body = body;
  if (options.method) invokeOptions.method = options.method;

  const res = await supabase.functions.invoke(name, invokeOptions);
  return res;
}

export default invokeFunction;
