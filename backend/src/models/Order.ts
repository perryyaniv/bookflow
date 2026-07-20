import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus =
  | 'נוצר'
  | 'הוזמן'
  | 'הגיע'
  | 'הלקוח עודכן'
  | 'נאסף'
  | 'בוטל';

export const ORDER_STATUSES: OrderStatus[] = [
  'נוצר',
  'הוזמן',
  'הגיע',
  'הלקוח עודכן',
  'נאסף',
  'בוטל',
];

export interface IOrderItem {
  bookName: string;
  sku?: string;
  quantity: number;
}

export interface IOrder extends Document {
  branchId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  orderDate: Date;
  orderedFrom: string;
  isPaid: boolean;
  status: OrderStatus;
  orderedAt?: Date | null;
  customerNotifiedAt?: Date | null;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  items: IOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    bookName: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    orderDate: { type: Date, required: true, default: Date.now },
    orderedFrom: { type: String, required: true, trim: true },
    isPaid: { type: Boolean, default: false },
    status: { type: String, enum: ORDER_STATUSES, default: 'נוצר' },
    orderedAt: { type: Date, default: null },
    customerNotifiedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], default: [] },
  },
  { timestamps: true }
);

OrderSchema.index({ branchId: 1, status: 1 });
OrderSchema.index({ customerName: 'text', customerPhone: 'text' });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
