import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export type UserRole = 'admin' | 'clerk';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  branchId?: mongoose.Types.ObjectId | null;
  active: boolean;
  forcePasswordChange: boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'clerk'], default: 'clerk', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
    active: { type: Boolean, default: true },
    forcePasswordChange: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
