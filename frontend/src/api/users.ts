import client from './client';
import { User, UserRole } from '../types';

export const getUsers = () =>
  client.get<User[]>('/users').then((r) => r.data);

export const createUser = (data: { name: string; email: string; password: string; role: UserRole; branchId?: string }) =>
  client.post<User>('/users', data).then((r) => r.data);

export const updateUser = (id: string, data: { role?: UserRole; active?: boolean; branchId?: string | null; name?: string }) =>
  client.put<User>(`/users/${id}`, data).then((r) => r.data);

export const resetPassword = (id: string, tempPassword: string) =>
  client.post(`/users/${id}/reset-password`, { tempPassword }).then((r) => r.data);
