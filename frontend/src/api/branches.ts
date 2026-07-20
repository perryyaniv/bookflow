import client from './client';
import { Branch } from '../types';

export const getBranches = () =>
  client.get<Branch[]>('/branches').then((r) => r.data);

export const createBranch = (data: { name: string }) =>
  client.post<Branch>('/branches', data).then((r) => r.data);

export const updateBranch = (id: string, data: Partial<Branch>) =>
  client.put<Branch>(`/branches/${id}`, data).then((r) => r.data);

export const deleteBranch = (id: string) =>
  client.delete(`/branches/${id}`).then((r) => r.data);
