import mongoose from 'mongoose';
import AuditLogEntry from '../models/AuditLogEntry';

export async function logAudit(params: {
  userId: string | mongoose.Types.ObjectId;
  userName: string;
  orderId?: string | mongoose.Types.ObjectId;
  action: string;
  fieldChanged?: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  try {
    await AuditLogEntry.create({
      userId: params.userId,
      userName: params.userName,
      orderId: params.orderId,
      action: params.action,
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue !== undefined ? String(params.oldValue) : undefined,
      newValue: params.newValue !== undefined ? String(params.newValue) : undefined,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
