import client from './client';
import { AuditLogEntry, PaginatedResponse } from '../types';

export const getAuditLog = (params: { orderId?: string; page?: number; limit?: number; search?: string }) =>
  client.get<PaginatedResponse<AuditLogEntry>>('/audit-log', { params }).then((r) => r.data);

export const clearAuditLog = () =>
  client.delete('/audit-log').then((r) => r.data);
