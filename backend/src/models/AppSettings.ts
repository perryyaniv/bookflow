import mongoose, { Schema, Document } from 'mongoose';

export interface IAppSettings extends Document {
  orderSourceOptions: string[];
  notOrderedThresholdDays: number;
  notArrivedThresholdDays: number;
  notCollectedThresholdDays: number;
}

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    orderSourceOptions: { type: [String], default: ['מודן', 'מחסן', 'סניף אחר'] },
    notOrderedThresholdDays: { type: Number, default: 3 },
    notArrivedThresholdDays: { type: Number, default: 14 },
    notCollectedThresholdDays: { type: Number, default: 14 },
  },
  { timestamps: true }
);

export default mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema);
