import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  isActive: boolean;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBranch>('Branch', BranchSchema);
