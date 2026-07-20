import client from './client';
import { Order, OrderFilters, PaginatedResponse } from '../types';

export const getOrders = (filters: OrderFilters) =>
  client.get<PaginatedResponse<Order>>('/orders', {
    params: { ...filters, isPaid: filters.isPaid === undefined ? undefined : String(filters.isPaid) },
  }).then((r) => r.data);

export const getOrder = (id: string) =>
  client.get<Order>(`/orders/${id}`).then((r) => r.data);

export const createOrder = (data: Partial<Order>) =>
  client.post<Order>('/orders', data).then((r) => r.data);

export const updateOrder = (id: string, data: Partial<Order>) =>
  client.put<Order>(`/orders/${id}`, data).then((r) => r.data);

export const changeOrderStatus = (id: string, status: string) =>
  client.patch<Order>(`/orders/${id}/status`, { status }).then((r) => r.data);

export const deleteOrder = (id: string) =>
  client.delete(`/orders/${id}`).then((r) => r.data);
