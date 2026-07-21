export type UserRole = 'admin' | 'editor' | 'viewer';

export type OrderStatus = 'נוצר' | 'הוזמן' | 'הגיע חלקית' | 'הגיע' | 'הלקוח עודכן' | 'נאסף' | 'בוטל';

export const ORDER_STATUSES: OrderStatus[] = ['נוצר', 'הוזמן', 'הגיע חלקית', 'הגיע', 'הלקוח עודכן', 'נאסף', 'בוטל'];

export interface Branch {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface User {
  _id: string;
  name: string;
  username: string;
  role: UserRole;
  branchId?: string | Branch | null;
  active: boolean;
  forcePasswordChange: boolean;
  createdAt: string;
}

export interface OrderItem {
  bookName: string;
  sku?: string;
  quantity: number;
  arrived: boolean;
}

export interface Order {
  _id: string;
  branchId: Branch;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  orderedFrom: string;
  isPaid: boolean;
  status: OrderStatus;
  orderedAt?: string | null;
  customerNotifiedAt?: string | null;
  statusChangedAt: string;
  notes?: string;
  items: OrderItem[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  isNotArrived?: boolean;
  isNotCollected?: boolean;
}

export interface AppSettings {
  _id: string;
  orderSourceOptions: string[];
  notArrivedThresholdDays: number;
  notCollectedThresholdDays: number;
}

export interface AuditLogEntry {
  _id: string;
  userId: string;
  userName: string;
  orderId?: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface OrderFilters {
  branchId?: string;
  status?: OrderStatus;
  isPaid?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  alert?: 'notArrived' | 'notCollected';
}
