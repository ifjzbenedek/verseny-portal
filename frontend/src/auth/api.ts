import { api } from '@/shared/api/client';
import type { Role } from '@/shared/types/api';

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: Role;
  id?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
  role: Role;
}

export async function loginRequest(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', input);
  return data;
}

export async function registerRequest(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', input);
  return data;
}
